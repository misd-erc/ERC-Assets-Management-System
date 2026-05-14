import axios, { type AxiosInstance, type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getSessionToken, handleSessionExpired, isSessionError } from '@/utils/sessionUtils';
import { secureStorage } from '@/utils/secureStorage';

const baseURL = process.env.REACT_APP_API_URL || 'https://localhost:7702/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token and request ID
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add session token for authentication
    const sessionToken = secureStorage.getItem('sessionToken');
    if (sessionToken && !config.url?.includes('/Users/validation')) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
      // Also add as custom header for backend compatibility
      config.headers['X-System-User-Id'] = sessionToken;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = Date.now().toString();

    return config;
  },
  (error: AxiosError) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally with retry logic
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check for invalid session in successful responses
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (isSessionError(response.data)) {
        console.error('[Axios] Session error detected in response:', response.data);
        
        // Handle session expiration
        handleSessionExpired(
          response.data.message || 'Your session has expired. Please log in again.'
        );

        return Promise.reject(new Error('Session expired'));
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - session expired or invalid token
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error('[Axios] Unauthorized access - token may be expired');

      
      const isUserListApi = originalRequest.url?.includes('/Users/all');
      const isUserValidationApi = originalRequest.url?.includes('/Users/validation');

      if (!isUserListApi && !isUserValidationApi) {
        // Clear session and redirect to login for other APIs
        handleSessionExpired('Your session has expired. Please log in again.');
      }

      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden
    else if (error.response?.status === 403) {
      console.error('[Axios] Forbidden access - insufficient permissions');
    } 
    
    // Handle 500 Server Error
    else if (error.response?.status === 500) {
      console.error('[Axios] Server error');
      // Do not treat 500 as session error - it's a server issue
    }
    
    // Handle 429 Rate Limiting
    else if (error.response?.status === 429) {
      console.error('[Axios] Rate limited');
      // Could implement exponential backoff here
    } 
    
    // Handle Network Errors
    else if (!error.response && error.code === 'NETWORK_ERROR') {
      console.error('[Axios] Network error - check connection');
    }

    // Retry logic for certain errors (only for GET requests)
    if (
      (!error.response || error.response.status >= 500) &&
      !originalRequest._retry &&
      (originalRequest.method === 'get' || originalRequest.method === 'GET')
    ) {
      originalRequest._retry = true;
      console.log('[Axios] Retrying request after 1 second...');
      
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;



