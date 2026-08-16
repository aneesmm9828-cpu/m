import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API] Response Error: ${error.response?.status} from ${error.config?.url}`, error.message);
    if (error.response?.status === 401) {
      console.log('Unauthorized request');
    }
    return Promise.reject(error);
  }
);
