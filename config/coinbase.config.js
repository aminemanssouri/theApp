// Coinbase Commerce Configuration
// Replace with your actual API keys from https://commerce.coinbase.com/
export const COINBASE_API_KEY = '1ec20457-d95c-4ea9-82dc-d01e2e4663f6';
export const COINBASE_WEBHOOK_SECRET = '1QNIEAoYMzS60A1FM1qRUT5tVAA5gjwnWQqUNTCiPpIX57u1qwwr+KWp5zz89BbRIJU5L9XWdxigv8MGdj9YmA==';
export const COINBASE_CHARGE_URL = 'https://api.commerce.coinbase.com/charges';
export const COINBASE_CHECKOUT_URL = 'https://api.commerce.coinbase.com/checkouts';

export const coinbaseConfig = {
  apiKey: COINBASE_API_KEY,
  webhookSecret: COINBASE_WEBHOOK_SECRET,
  environment: __DEV__ ? 'sandbox' : 'production', // Use sandbox for development
  apiVersion: '2018-03-22',
  supportedCurrencies: [
    { id: 'BTC', name: 'Bitcoin', symbol: '₿', color: '#F7931A' },
    { id: 'ETH', name: 'Ethereum', symbol: 'Ξ', color: '#627EEA' },
    { id: 'USDC', name: 'USD Coin', symbol: '$', color: '#2775CA' },
    { id: 'LTC', name: 'Litecoin', symbol: 'Ł', color: '#345D9D' },
    { id: 'BCH', name: 'Bitcoin Cash', symbol: '₿', color: '#8DC351' },
    { id: 'DAI', name: 'Dai', symbol: '◈', color: '#F5AC37' },
  ],
  defaultCurrency: 'EUR',
  timeout: 3600, // 1 hour timeout for payments
};