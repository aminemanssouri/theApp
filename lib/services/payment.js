import { supabase } from '../supabase';
import { COINBASE_API_KEY, COINBASE_CHARGE_URL } from '../../config/coinbase.config';

/**
 * Create a payment record in the database
 */
export const createPaymentRecord = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: paymentData.booking_id,
        payer_id: paymentData.payer_id,
        method: paymentData.method, // 'card', 'crypto', 'paypal', etc.
        amount: paymentData.amount,
        currency: paymentData.currency || 'EUR',
        status: 'pending',
        transaction_id: paymentData.transaction_id,
        payment_details: paymentData.details || {}
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating payment record:', error);
    return { success: false, error };
  }
};

/**
 * Create Stripe Payment Intent using Supabase Edge Function
 */
export const createStripePaymentIntent = async (paymentData) => {
  try {
    console.log('🔄 Creating Stripe payment intent via Supabase Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: paymentData.amount,
        currency: paymentData.currency || 'EUR',
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        bookingId: paymentData.booking_id,
      },
    });

    if (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }

    console.log('✅ Payment intent created:', data);
    return { 
      success: true, 
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error) {
    console.error('❌ Failed to create payment intent:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process Stripe refund with 80% refund (20% cancellation fee)
 */
export const processStripeRefund = async (bookingId, paymentIntentId, totalAmount, reason) => {
  try {
    console.log('🔄 Processing Stripe refund via Supabase Edge Function...');
    console.log('Refund details:', { bookingId, paymentIntentId, totalAmount, reason });
    
    // Calculate refund amount (80% of total)
    const refundAmount = Math.round(totalAmount * 0.80 * 100) / 100;
    const cancellationFee = Math.round(totalAmount * 0.20 * 100) / 100;
    
    console.log(`💰 Refund breakdown: Total: €${totalAmount}, Refund: €${refundAmount}, Fee: €${cancellationFee}`);
    
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: {
        paymentIntentId,
        bookingId,
        refundAmount,
        cancellationFee,
        totalAmount,
        reason,
      },
    });

    if (error) {
      console.error('❌ Error processing refund:', error);
      throw error;
    }

    console.log('✅ Refund processed:', data);
    return { 
      success: true, 
      refundId: data.refundId,
      refundAmount: data.refundAmount,
      cancellationFee: data.cancellationFee,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ Failed to process refund:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Confirm Stripe payment and update booking using Supabase Edge Function
 */
export const confirmStripePayment = async (paymentIntentId, bookingId, payerId) => {
  try {
    console.log('🔄 Confirming payment via Supabase Edge Function...');
    console.log('   Payment Intent ID:', paymentIntentId);
    console.log('   Booking ID:', bookingId);
    
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: {
        paymentIntentId,
        bookingId,
        payerId,
      },
    });

    if (error) {
      console.error('❌ Error confirming payment:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      
      // Try to get the error message from the response body
      if (error.context?._bodyInit) {
        try {
          const errorBody = await fetch(error.context.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId, bookingId, payerId })
          }).then(r => r.json());
          console.error('   Server error:', errorBody);
        } catch (e) {
          console.error('   Could not parse error body');
        }
      }
      
      throw error;
    }

    if (data && !data.success) {
      console.error('❌ Payment confirmation failed:', data.error);
      console.error('   Details:', data.details);
      return { success: false, error: data.error, details: data.details };
    }

    console.log('✅ Payment confirmed:', data);
    return { 
      success: true, 
      payment: data.payment,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ Failed to confirm payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process Stripe payment (Legacy - kept for backwards compatibility)
 * @deprecated Use createStripePaymentIntent and confirmStripePayment instead
 */
export const processStripePayment = async (paymentData) => {
  try {
    // First create a payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: paymentData.booking_id,
        payer_id: paymentData.payer_id,
        method: 'card',
        amount: paymentData.amount,
        currency: paymentData.currency || 'EUR',
        status: 'pending',
        payment_details: {
          cardholder_name: paymentData.customerName,
          email: paymentData.customerEmail
        }
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // In production, this would call your backend API to process with Stripe
    // For now, we'll simulate a successful payment
    
    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        transaction_id: `stripe_${Date.now()}`, // In production, use actual Stripe transaction ID
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return { 
      success: true, 
      data: updatedPayment,
      transactionId: updatedPayment.transaction_id 
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a Coinbase Commerce charge
 */
export const createCoinbaseCharge = async (chargeData) => {
  try {
    console.log('🚀 Creating Coinbase Commerce charge...', chargeData);
    
    // Validate required data
    if (!chargeData.amount || !chargeData.booking_id || !chargeData.payer_id) {
      throw new Error('Missing required payment data');
    }

    // First create a payment record in database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: chargeData.booking_id,
        payer_id: chargeData.payer_id,
        method: 'crypto',
        amount: parseFloat(chargeData.amount),
        currency: chargeData.currency || 'EUR',
        status: 'pending',
        payment_details: {
          charge_name: chargeData.name || 'Service Payment',
          description: chargeData.description || 'Payment for service booking'
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Database error:', paymentError);
      throw paymentError;
    }

    console.log('✅ Payment record created:', paymentRecord.id);

    // Create charge with Coinbase Commerce API
    const chargePayload = {
      name: chargeData.name || `BRICOLLANO Service Payment #${paymentRecord.id}`,
      description: chargeData.description || `Payment for ${chargeData.serviceName || 'service'} booking`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: parseFloat(chargeData.amount).toFixed(2),
        currency: chargeData.currency || 'EUR'
      },
      metadata: {
        payment_id: paymentRecord.id.toString(),
        booking_id: chargeData.booking_id.toString(),
        app_name: 'BRICOLLANO',
        customer_id: chargeData.payer_id.toString()
      },
      // Coinbase requires absolute http(s) URLs. Deep links like bricollano:// are rejected.
      // We use polling in-app, so these can be placeholder HTTPS pages for now.
      redirect_url: 'https://www.bricollano.it/',
      cancel_url: 'https://example.com/payment-cancelled'
    };

    console.log('📤 Sending charge request to Coinbase:', chargePayload);
    console.log('🔑 API Key being used:', COINBASE_API_KEY ? `${COINBASE_API_KEY.substring(0, 8)}...` : 'MISSING');
    console.log('🌐 Request URL:', COINBASE_CHARGE_URL);

    const response = await fetch(COINBASE_CHARGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify(chargePayload),
    });
    
    const chargeResponse = await response.json();
    console.log('📥 Coinbase response:', chargeResponse);

    if (!response.ok) {
      const errorMessage = chargeResponse.error?.message || 
                          chargeResponse.errors?.[0]?.message || 
                          'Failed to create Coinbase charge';
      console.error('❌ Coinbase API error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!chargeResponse.data) {
      throw new Error('Invalid response from Coinbase Commerce');
    }

    // Update payment record with Coinbase charge ID
    await supabase
      .from('payments')
      .update({
        transaction_id: chargeResponse.data.id,
        payment_details: {
          ...paymentRecord.payment_details,
          coinbase_charge_id: chargeResponse.data.id,
          hosted_url: chargeResponse.data.hosted_url,
          expires_at: chargeResponse.data.expires_at
        }
      })
      .eq('id', paymentRecord.id);

    return { 
      success: true, 
      data: {
        ...chargeResponse.data,
        payment_id: paymentRecord.id
      }
    };
  } catch (error) {
    console.error('Coinbase charge error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check payment status from Coinbase
 */
export const checkPaymentStatus = async (chargeId) => {
  try {
    const response = await fetch(`${COINBASE_CHARGE_URL}/${chargeId}`, {
      headers: {
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
    });
    
    const data = await response.json();
    
    // Update payment status in database based on Coinbase status
    if (data.data.timeline) {
      const latestStatus = data.data.timeline[data.data.timeline.length - 1]?.status;
      
      if (latestStatus === 'COMPLETED') {
        // Update payment record
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', chargeId);

        // Update crypto payment details if available
        const payment = data.data.payments?.[0];
        if (payment) {
          await supabase
            .from('crypto_payments')
            .update({
              cryptocurrency: payment.network,
              transaction_hash: payment.transaction_id,
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', data.data.metadata?.payment_id);
        }
      } else if (latestStatus === 'EXPIRED' || latestStatus === 'CANCELED') {
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', chargeId);
      }
    }
    
    return data.data.timeline?.[data.data.timeline.length - 1]?.status || 'PENDING';
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, additionalData = {}) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error };
  }
};

/**
 * Get payment by booking ID
 */
export const getPaymentByBookingId = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        crypto_payments (*)
      `)
      .eq('booking_id', bookingId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return { success: false, error };
  }
};

/**
 * Process refund
 */
export const processRefund = async (paymentId, amount, reason) => {
  try {
    // Get original payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError) throw fetchError;

    // Create refund record (you might want to create a refunds table)
    const { data: refund, error: refundError } = await supabase
      .from('payments')
      .insert({
        booking_id: payment.booking_id,
        payer_id: payment.payer_id,
        method: payment.method,
        amount: -amount, // Negative amount for refund
        currency: payment.currency,
        status: 'completed',
        transaction_id: `refund_${payment.transaction_id}`,
        payment_details: {
          original_payment_id: paymentId,
          refund_reason: reason,
          refunded_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (refundError) throw refundError;

    return { success: true, data: refund };
  } catch (error) {
    console.error('Error processing refund:', error);
    return { success: false, error };
  }
};

/**
 * Test Coinbase Commerce API connection
 */
export const testCoinbaseConnection = async () => {
  try {
    console.log('🧪 Testing Coinbase Commerce connection...');
    
    // Test with a minimal charge request
    const testPayload = {
      name: 'BRICOLLANO API Test',
      description: 'Test charge to verify API connection',
      pricing_type: 'fixed_price',
      local_price: {
        amount: '1.00',
        currency: 'EUR'
      },
      metadata: {
        test: 'true'
      }
    };

    const response = await fetch(COINBASE_CHARGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify(testPayload),
    });
    
    const result = await response.json();
    
    if (response.ok && result.data) {
      console.log('✅ Coinbase API connection successful!');
      console.log('📋 Test charge created:', result.data.id);
      return { success: true, data: result.data };
    } else {
      console.error('❌ Coinbase API test failed:', result);
      return { 
        success: false, 
        error: result.error?.message || result.errors?.[0]?.message || 'API test failed' 
      };
    }
  } catch (error) {
    console.error('❌ Coinbase API test error:', error);
    return { success: false, error: error.message };
  }
};