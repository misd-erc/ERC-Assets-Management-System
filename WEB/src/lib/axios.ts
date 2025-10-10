import axios, { type AxiosInstance, type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token and request ID
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = Date.now().toString();

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally with retry logic
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Handle token refresh or logout
      console.error('Unauthorized access - token may be expired');
      // Clear invalid token
      localStorage.removeItem('authToken');
      // Could dispatch logout action here if store is available
      // For now, just reject
    } else if (error.response?.status === 403) {
      console.error('Forbidden access');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    } else if (error.response?.status === 429) {
      console.error('Rate limited');
      // Could implement exponential backoff here
    } else if (!error.response && error.code === 'NETWORK_ERROR') {
      console.error('Network error - check connection');
    }

    // Retry logic for certain errors
    if (
      (!error.response || error.response.status >= 500) &&
      !originalRequest._retry &&
      (originalRequest.method === 'get' || originalRequest.method === 'GET')
    ) {
      originalRequest._retry = true;
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
