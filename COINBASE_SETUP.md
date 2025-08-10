# 🚀 Coinbase Commerce Integration Setup Guide

## 📋 Overview
Your BRICOLLANO app now has enhanced Coinbase Commerce integration for cryptocurrency payments. This guide will help you complete the setup.

## 🔧 Setup Steps

### 1. Create Coinbase Commerce Account
1. Go to [https://commerce.coinbase.com/](https://commerce.coinbase.com/)
2. Sign up for a Coinbase Commerce account
3. Complete the verification process

### 2. Get API Keys
1. In your Coinbase Commerce dashboard, go to **Settings** → **API Keys**
2. Create a new API key
3. Copy the API key (starts with something like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 3. Configure Your App
1. Open `config/coinbase.config.js`
2. Replace `'your_coinbase_commerce_api_key_here'` with your actual API key:
```javascript
export const COINBASE_API_KEY = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### 4. Set Up Webhooks (Optional but Recommended)
1. In Coinbase Commerce dashboard, go to **Settings** → **Webhook subscriptions**
2. Add your webhook URL: `https://your-backend.com/webhooks/coinbase`
3. Select events: `charge:created`, `charge:confirmed`, `charge:failed`
4. Copy the webhook secret and add it to your config

### 5. Database Setup
Make sure your Supabase database has these tables:

#### `payments` table:
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  payer_id UUID REFERENCES auth.users(id),
  method TEXT NOT NULL, -- 'card', 'crypto', 'paypal', etc.
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  transaction_id TEXT,
  payment_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `crypto_payments` table (optional):
```sql
CREATE TABLE crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  cryptocurrency TEXT,
  wallet_address TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 How It Works

### User Flow:
1. User selects "Cryptocurrency" payment method
2. App creates a Coinbase Commerce charge
3. User clicks "Pay with Crypto" button
4. Opens Coinbase Commerce hosted checkout (WebView or browser)
5. User completes payment with their preferred cryptocurrency
6. App monitors payment status automatically
7. Booking is confirmed when payment is received

### Supported Cryptocurrencies:
- Bitcoin (BTC)
- Ethereum (ETH)
- USD Coin (USDC)
- Litecoin (LTC)
- Bitcoin Cash (BCH)
- Dai (DAI)

## 🔍 Testing

### Test Mode:
1. Use Coinbase Commerce sandbox/test environment
2. Test with small amounts first
3. Verify payment status updates correctly

### Production:
1. Switch to production API keys
2. Test with real small transactions
3. Monitor webhook delivery

## 🚨 Important Notes

1. **API Keys Security**: Never commit real API keys to version control
2. **Webhook Verification**: Always verify webhook signatures in production
3. **Error Handling**: The app includes comprehensive error handling
4. **Payment Monitoring**: App automatically checks payment status every 10 seconds
5. **Timeout**: Payments expire after 1 hour (configurable)

## 📱 Features Implemented

✅ **Coinbase Commerce Integration**
✅ **Hosted Checkout** (WebView + Browser fallback)
✅ **Real-time Payment Monitoring**
✅ **Multiple Cryptocurrency Support**
✅ **Error Handling & Retry Logic**
✅ **Payment Status Tracking**
✅ **Automatic Booking Confirmation**
✅ **Modern UI/UX**

## 🛠️ Customization

You can customize:
- Supported cryptocurrencies in `coinbase.config.js`
- Payment timeout duration
- UI colors and styling
- Payment monitoring frequency
- Error messages

## 📞 Support

If you encounter issues:
1. Check Coinbase Commerce dashboard for payment details
2. Review app logs for error messages
3. Verify API key permissions
4. Test webhook delivery

---

**Your cryptocurrency payment system is now ready! 🎉**
