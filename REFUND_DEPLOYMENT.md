# Refund Processing - Deployment Instructions

## Overview
This Edge Function processes Stripe refunds with an 80% refund policy (20% cancellation fee).

## Deployment Steps

### 1. Deploy the Edge Function to Supabase

```bash
# Navigate to your project directory
cd c:\Users\DELL\Desktop\brico\theApp

# Deploy the process-refund function
supabase functions deploy process-refund --project-ref YOUR_PROJECT_REF
```

### 2. Verify Stripe Secret Key

Make sure your Stripe secret key is set in Supabase Secrets:

```bash
# Check if secret exists
supabase secrets list --project-ref YOUR_PROJECT_REF

# If not set, set it now
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY --project-ref YOUR_PROJECT_REF
```

### 3. Test the Function

You can test the refund flow by:
1. Creating a test booking with payment
2. Canceling the booking from the app
3. Checking Stripe dashboard for the refund
4. Checking Supabase `payments` table for the cancellation fee record

## How It Works

### Refund Breakdown
- **Total Payment**: 100%
- **Refund to Customer**: 80%
- **Cancellation Fee**: 20%

### Example
If a booking costs €50:
- Customer gets refunded: €40 (80%)
- Cancellation fee: €10 (20%)

### Database Records
1. **Original Payment**: Recorded with `method='credit_card'`, `status='completed'`
2. **Cancellation Fee**: Recorded with `method='cancellation_fee'`, `status='completed'`
3. **Booking Status**: Updated to `cancelled` via `cancel_booking` RPC

### Stripe Refund
- Processed through Stripe Refunds API
- Refund reason: `requested_by_customer`
- Metadata includes: booking_id, cancellation_fee, refund_percentage, cancellation_reason

## API Endpoint

```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-refund
```

### Request Body
```json
{
  "paymentIntentId": "pi_xxxxx",
  "bookingId": "uuid",
  "refundAmount": 40.00,
  "cancellationFee": 10.00,
  "totalAmount": 50.00,
  "reason": "Customer requested cancellation"
}
```

### Response (Success)
```json
{
  "success": true,
  "refundId": "re_xxxxx",
  "refundAmount": 40.00,
  "cancellationFee": 10.00,
  "message": "Refund of €40 processed. Cancellation fee: €10"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Important Notes

1. **Stripe Payment Intent**: The function refunds a partial amount from the original PaymentIntent
2. **Idempotency**: Stripe handles duplicate refund requests automatically
3. **Cancellation Fee**: Recorded in the `payments` table for accounting
4. **Error Handling**: If fee recording fails, the refund still succeeds (logged as warning)

## Testing

### Test in Stripe Dashboard
1. Go to Stripe Dashboard > Payments
2. Find the payment you want to test
3. After cancellation, you should see a refund of 80% of the amount

### Test in Supabase
1. Check `payments` table for the cancellation_fee record
2. Check `bookings` table to confirm status is 'cancelled'

## Troubleshooting

### Refund Failed
- Check Stripe secret key is correctly set
- Verify the payment intent ID is valid
- Ensure the payment hasn't already been fully refunded

### Cancellation Fee Not Recorded
- Check Supabase logs for the error
- Verify user is authenticated
- Check payments table permissions

## Support
For issues, check:
- Supabase Function Logs
- Stripe Dashboard > Developers > Logs
- App console logs (search for "refund")
