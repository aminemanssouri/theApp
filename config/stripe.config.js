export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SLunJL44DKbQ2pS5hCQU1PpgPvi51HJCRXBDiBcTLEcYzGZH6fFFKTG1Kpe9IUy5m8cGcoWV5322LoqxmYRWiyV00BcqCkfgL';
// Secret key is stored securely in Supabase Edge Functions secrets (STRIPE_SECRET_KEY)

export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.brico',
  urlScheme: 'brico',
};