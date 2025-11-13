// supabase/functions/confirm-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get Stripe secret key from Supabase Secrets
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { paymentIntentId, bookingId, payerId } = await req.json()

    console.log('Confirming payment:', { paymentIntentId, bookingId, payerId })

    // Retrieve the PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    console.log('Payment Intent status:', paymentIntent.status)

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture') {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`)
    }

    // Insert payment record with stripe_payment_intent_id
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: bookingId,
        payer_id: payerId,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        method: 'credit_card',
        status: 'completed',
        transaction_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id, // ← NEW: Store payment intent ID
        payment_details: {
          payment_method: paymentIntent.payment_method,
          charges: paymentIntent.charges?.data || [],
        },
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment record error:', paymentError)
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    console.log('Payment record created:', payment.id)

    // Update booking status to confirmed
    const { error: bookingError } = await supabaseClient
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    if (bookingError) {
      console.error('Booking update error:', bookingError)
      throw new Error(`Failed to update booking: ${bookingError.message}`)
    }

    console.log('Booking confirmed:', bookingId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment confirmed and booking updated',
        paymentId: payment.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
