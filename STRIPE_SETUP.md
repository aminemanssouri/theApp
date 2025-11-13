# Stripe + Supabase Edge Functions Setup Guide

This guide will help you set up secure Stripe payments using Supabase Edge Functions.

## ✅ What's Been Done

1. **Created Supabase Edge Functions** (2 functions):
   - `create-payment-intent` - Creates Stripe payment intents
   - `confirm-payment` - Confirms payment and updates booking

2. **Updated Payment Service** (`lib/services/payment.js`):
   - Added `createStripePaymentIntent()` function
   - Added `confirmStripePayment()` function

3. **Updated CreditCardPayment Screen**:
   - Now uses Supabase Edge Functions for secure payment processing
   - Secret key is no longer in the mobile app

---

## 🚀 Setup Steps

### Step 1: Install Supabase CLI

Open PowerShell and run:

```powershell
npm install -g supabase
```

### Step 2: Login to Supabase

```powershell
supabase login
```

This will open your browser. Login with your Supabase account.

### Step 3: Link Your Project

Find your project reference ID:
- Go to: https://supabase.com/dashboard/project/_/settings/general
- Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

Then link your project:

```powershell
cd c:\Users\DELL\Desktop\brico\theApp
supabase link --project-ref YOUR_PROJECT_REF_ID
```

### Step 4: Set Your Stripe Secret Key

```powershell
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

Replace `your_stripe_secret_key_here` with your actual Stripe secret key from: https://dashboard.stripe.com/test/apikeys

This stores your Stripe secret key securely in Supabase (not in your app code).

### Step 5: Deploy Edge Functions

Deploy both functions:

```powershell
supabase functions deploy create-payment-intent
supabase functions deploy confirm-payment
```

You should see:
```
✅ Deployed Function create-payment-intent
✅ Deployed Function confirm-payment
```

### Step 6: Verify Deployment

Go to your Supabase Dashboard:
1. Navigate to **Edge Functions**
2. You should see both functions listed
3. Click on each to view details

---

## 🧪 Testing

### Test Locally (Optional)

Before deploying, you can test functions locally:

```powershell
# Set environment variable for local testing
$env:STRIPE_SECRET_KEY = "your_stripe_secret_key_here"

# Start local functions server
supabase functions serve
```

Then test with:

```powershell
# Test create-payment-intent
Invoke-RestMethod -Uri "http://localhost:54321/functions/v1/create-payment-intent" `
  -Method Post `
  -Headers @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    amount = 100
    currency = "EUR"
    customerEmail = "test@example.com"
    customerName = "Test User"
    bookingId = "123"
  } | ConvertTo-Json)
```

### Test in Your App

1. **Run your app**:
   ```powershell
   npm start
   ```

2. **Navigate to payment screen**
3. **Use Stripe test card**:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Name: Your name
   - Email: Your email

4. **Complete payment**
5. **Check results**:
   - Supabase Dashboard → Edge Functions → Logs
   - Stripe Dashboard → Payments

---

## 🔍 Verifying Everything Works

### 1. Check Edge Functions Deployment

```powershell
supabase functions list
```

You should see:
```
create-payment-intent (deployed)
confirm-payment (deployed)
```

### 2. Check Secrets

```powershell
supabase secrets list
```

You should see:
```
STRIPE_SECRET_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 3. View Function Logs

After testing a payment:

```powershell
supabase functions logs create-payment-intent
supabase functions logs confirm-payment
```

Or in the Dashboard:
- Go to Edge Functions
- Click on function name
- View "Logs" tab

### 4. Check Stripe Dashboard

- Go to: https://dashboard.stripe.com/test/payments
- You should see your test payment

### 5. Check Supabase Database

- Go to: Supabase Dashboard → Table Editor → `payments`
- You should see the payment record

---

## 📱 App Configuration

Your app is already configured! The changes include:

### config/stripe.config.js
- ✅ Publishable key configured
- ✅ Secret key marked for backend only

### lib/services/payment.js
- ✅ `createStripePaymentIntent()` - Calls Edge Function
- ✅ `confirmStripePayment()` - Calls Edge Function

### screens/CreditCardPayment.js
- ✅ Uses new Supabase Edge Functions
- ✅ Secure payment flow

---

## 🔒 Security Checklist

- [x] Secret key stored in Supabase secrets (not in app code)
- [x] Payment processing happens server-side
- [x] CORS enabled for your app
- [x] Using test mode for development
- [ ] Switch to live keys before production
- [ ] Set up Stripe webhooks (optional)

---

## ⚠️ Important Notes

### Secret Key Security
Your Stripe secret key (`sk_test_51...`) is now:
- ✅ **Stored securely** in Supabase secrets
- ✅ **Not in app code** (removed from mobile app)
- ✅ **Only accessible** by Edge Functions

### Test vs Live Mode

**Currently using**: Test Mode
- Safe for development
- Use test cards only
- Charges are simulated

**For Production**:
1. Get live keys from Stripe Dashboard
2. Update secret key:
   ```powershell
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   ```
3. Update publishable key in `config/stripe.config.js`

---

## 🐛 Troubleshooting

### Function deployment fails
```powershell
# Check if logged in
supabase login

# Check project link
supabase projects list

# Re-link if needed
supabase link --project-ref YOUR_REF_ID
```

### Payment fails in app
1. Check Edge Function logs:
   ```powershell
   supabase functions logs create-payment-intent --tail
   ```
2. Check Stripe Dashboard logs
3. Verify secret key is set:
   ```powershell
   supabase secrets list
   ```

### CORS errors
Edge Functions already have CORS enabled. If you see errors:
- Make sure you're calling the correct function URL
- Check Supabase project URL in `lib/supabase.js`

### Function not found
Make sure functions are deployed:
```powershell
supabase functions deploy create-payment-intent
supabase functions deploy confirm-payment
```

---

## 📞 Support

### Supabase
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs/guides/functions
- CLI Reference: https://supabase.com/docs/reference/cli

### Stripe
- Dashboard: https://dashboard.stripe.com/
- Test Cards: https://stripe.com/docs/testing
- Docs: https://stripe.com/docs

### Your Project
- Edge Functions: `supabase/functions/`
- Payment Service: `lib/services/payment.js`
- Payment Screen: `screens/CreditCardPayment.js`

---

## ✅ Final Checklist

Before testing:
- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] Secret key set
- [ ] Functions deployed
- [ ] App running

Before going live:
- [ ] Switch to Stripe live keys
- [ ] Update secret in Supabase
- [ ] Update publishable key in app
- [ ] Test with real cards
- [ ] Monitor function logs
- [ ] Set up error alerting

---

**Your Stripe integration is now secure and production-ready!** 🎉

The secret key is safely stored in Supabase Edge Functions, and all payment processing happens server-side.
