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

// Response interceptor with global error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const appError = createAppError(error);
    
    // Log error for debugging
    logError(error, 'API Request');
    
    // Handle specific error types
    if (appError.type === ErrorType.AUTHENTICATION && appError.statusCode === 401) {
      // Don't auto-redirect here - let components handle it
      // But we can clear any stale tokens if needed
      if (typeof window !== 'undefined') {
        // Auth errors are handled by useAuth hook
        // Just pass through for component-level handling
      }
    }
    
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
