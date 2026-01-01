import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createAppError, logError, ErrorCategory, ErrorType } from './errors';

// API client for Vercel serverless functions or external API origin
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 1; // Only try once to prevent infinite loops
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with global error handling and automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 errors with automatic token refresh
    // Skip token refresh for public endpoints that don't require auth
    const publicEndpoints = ['/stats/public', '/health', '/test', '/auth/me'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      originalRequest?.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isPublicEndpoint) {
      // Prevent infinite refresh loops
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        refreshAttempts = 0; // Reset for next session
        const appError = createAppError(error);
        // Redirect to login if in browser
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject({
          ...appError,
          originalError: error,
          axiosError: error,
        });
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttempts++;

      try {
        // Try to refresh the token
        await api.post('/auth/refresh');
        
        // Reset refresh attempts on success
        refreshAttempts = 0;
        
        // Process queued requests
        processQueue();
        isRefreshing = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear queue and reject
        processQueue(refreshError);
        isRefreshing = false;
        
        // If we're in the browser, redirect to login
        if (typeof window !== 'undefined') {
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        
        const appError = createAppError(error);
        return Promise.reject({
          ...appError,
          originalError: error,
          axiosError: error,
        });
      }
    }

    // For all other errors, use the structured error handling
    const appError = createAppError(error);
    
    // Log error for debugging
    logError(error, 'API Request');
    
    // For network errors, show user-friendly message
    if (appError.type === ErrorType.NETWORK) {
      // Network errors are handled at component level with toast
      // Return structured error for components to handle
    }
    
    // Reject with structured error that components can use
    return Promise.reject({
      ...appError,
      originalError: error,
      axiosError: error,
    });
  }
);

export default api;
