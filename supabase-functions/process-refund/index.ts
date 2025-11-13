// supabase/functions/process-refund/index.ts
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

    const { 
      paymentIntentId,
      bookingId,
      refundAmount,
      cancellationFee,
      totalAmount,
      reason,
    } = await req.json()

    console.log('Processing refund:', {
      paymentIntentId,
      bookingId,
      refundAmount,
      cancellationFee,
      totalAmount,
      reason,
    })

    // Validate input
    if (!paymentIntentId || !bookingId || !refundAmount) {
      throw new Error('Missing required fields')
    }

    // Convert refund amount to cents for Stripe
    const refundAmountCents = Math.round(refundAmount * 100)

    // Process refund through Stripe (80% of total)
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: bookingId,
        cancellation_fee: cancellationFee.toString(),
        refund_percentage: '80',
        cancellation_reason: reason || 'Customer requested cancellation',
      },
    })

    console.log('Stripe refund created:', refund.id)

    // Record cancellation fee payment (20%) in database
    const { error: feeError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: bookingId,
        payer_id: (await supabaseClient.auth.getUser()).data.user?.id,
        amount: cancellationFee,
        method: 'cancellation_fee',
        status: 'completed',
        stripe_payment_intent_id: paymentIntentId,
        metadata: {
          refund_id: refund.id,
          original_amount: totalAmount,
          refund_amount: refundAmount,
          reason: reason,
        },
      })

    if (feeError) {
      console.error('Error recording cancellation fee:', feeError)
      // Don't throw - refund was successful, fee recording is secondary
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        refundAmount: refundAmount,
        cancellationFee: cancellationFee,
        message: `Refund of €${refundAmount} processed. Cancellation fee: €${cancellationFee}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Refund processing error:', error)
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
