import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '../config/env';

// Create a global Axios instance
export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handling & Auto-Retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    if (!config) {
      return Promise.reject(error);
    }

    // Auto-Logout or token expiration warning on 401
    if (error.response?.status === 401) {
      console.warn('Unauthorized access. Token might be expired.');
      // SecureStore.deleteItemAsync('userToken'); // Optionally force logout
      return Promise.reject(error);
    }

    // Retrieve the current retry count from the custom header (Axios preserves custom headers in config)
    const retryHeader = config.headers?.['X-Retry-Count'];
    let retryCount = retryHeader ? parseInt(String(retryHeader), 10) : 0;

    // Check if we should retry (network errors or 5xx server errors)
    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);
    
    // Safety rules: Only retry idempotent GET requests that are not authentication requests
    const isIdempotent = config.method?.toLowerCase() === 'get';
    const isAuthRequest = config.url?.includes('/auth/');
    
    if (shouldRetry && isIdempotent && !isAuthRequest && retryCount < ENV.MAX_RETRIES) {
      retryCount += 1;
      console.log(`[API CLIENT] Network request failed. Retrying ${config.url} (${retryCount}/${ENV.MAX_RETRIES})...`);
      
      // Exponential backoff
      const delay = new Promise((resolve) => setTimeout(resolve, retryCount * 1000));
      await delay;
      
      // Attach the incremented retry count to headers so it is preserved in the next interceptor execution
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers['X-Retry-Count'] = String(retryCount);
      
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);
