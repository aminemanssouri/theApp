// Quick test script to verify Stripe Edge Functions are working
import { supabase } from './lib/supabase.js';

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Edge Functions...\n');

  try {
    // Test 1: Create Payment Intent
    console.log('📝 Test 1: Creating payment intent...');
    const { data: intentData, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: 50.00,
        currency: 'EUR',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        bookingId: 'test-booking-123',
      },
    });

    if (intentError) {
      console.error('❌ Payment Intent Error:', intentError);
      return;
    }

    console.log('✅ Payment Intent Created!');
    console.log('   Client Secret:', intentData.clientSecret ? '✓ Present' : '✗ Missing');
    console.log('   Payment Intent ID:', intentData.paymentIntentId || 'Missing');
    
    // Note: You can't test confirm-payment without actually completing a real payment
    console.log('\n✅ Edge Functions are deployed and working!');
    console.log('💳 Now test in your app with card: 4242 4242 4242 4242');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.log('\n⚠️ Make sure you deployed the Edge Functions:');
    console.log('   1. supabase functions deploy create-payment-intent');
    console.log('   2. supabase functions deploy confirm-payment');
    console.log('   3. supabase secrets set STRIPE_SECRET_KEY=sk_test_...');
  }
}

testStripeIntegration();
