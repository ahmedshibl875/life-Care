// Environment Configuration
export const ENV = {
  // Use localhost/10.0.2.2 for emulator testing if needed, or production URL
  API_URL: __DEV__ 
    ? 'https://life-care-production.up.railway.app/api' // Keeping staging/prod URL for __DEV__ to ensure it works outside localhost
    : 'https://life-care-production.up.railway.app/api',
  TIMEOUT: 15000,
  MAX_RETRIES: 3,
};
