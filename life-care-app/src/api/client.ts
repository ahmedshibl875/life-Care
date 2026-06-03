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
    
    // Auto-Logout or token expiration warning on 401
    if (error.response?.status === 401) {
      console.warn('Unauthorized access. Token might be expired.');
      // SecureStore.deleteItemAsync('userToken'); // Optionally force logout
      return Promise.reject(error);
    }

    // Network Retry Logic for Mobile Stability
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    // Check if we should retry (network errors or 5xx server errors)
    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);
    
    if (shouldRetry && config.retry < ENV.MAX_RETRIES) {
      config.retry += 1;
      console.log(`Network request failed. Retrying... (${config.retry}/${ENV.MAX_RETRIES})`);
      
      // Exponential backoff
      const delay = new Promise((resolve) => setTimeout(resolve, config.retry * 1000));
      await delay;
      
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);
