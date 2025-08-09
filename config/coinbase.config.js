export const COINBASE_API_KEY = 'your_api_key_here';
export const COINBASE_WEBHOOK_SECRET = 'your_webhook_secret';
export const COINBASE_CHARGE_URL = 'https://api.commerce.coinbase.com/charges';

export const coinbaseConfig = {
  apiKey: COINBASE_API_KEY,
  environment: 'production',
  currencies: ['BTC', 'ETH', 'USDC', 'LTC'],
};