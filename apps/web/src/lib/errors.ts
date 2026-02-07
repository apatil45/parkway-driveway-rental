/**
 * Professional Error Handling System
 * Provides structured error types and user-friendly error messages
 */

// Error Types
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Error Categories for UI display
export enum ErrorCategory {
  CRITICAL = 'CRITICAL', // Show full page error
  WARNING = 'WARNING', // Show toast + inline
  INFO = 'INFO', // Show toast only
}

export interface AppError {
  type: ErrorType;
  category: ErrorCategory;
  message: string;
  userMessage: string; // User-friendly message
  technicalMessage?: string; // Technical details for debugging
  code?: string;
  statusCode?: number;
  retryable: boolean;
  action?: string; // Suggested action for user
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: any): string {
  // If already a formatted AppError with userMessage
  if (error && typeof error === 'object' && error.userMessage && typeof error.userMessage === 'string') {
    return error.userMessage;
  }

  // Handle string errors (if they're already user-friendly)
  if (typeof error === 'string') {
    const lowerMsg = error.toLowerCase();
    // Filter out technical messages
    if (lowerMsg.includes('request failed') || lowerMsg.includes('status code') || lowerMsg.includes('error:') || lowerMsg.includes('failed to execute')) {
      // This is a technical message, parse it
      return parseErrorMessage(error);
    }
    return error;
  }

  // PRIORITY 1: API response data (from createApiError)
  if (error?.response?.data) {
    const errorData = error.response.data;
    
    // Check for user-friendly message field first
    if (errorData.message && typeof errorData.message === 'string') {
      const msg = errorData.message.toLowerCase();
      // Filter out technical messages
      if (!msg.includes('request failed') && 
          !msg.includes('status code') && 
          !msg.includes('error:') && 
          !msg.includes('failed to execute') &&
          !msg.includes('failed with status')) {
        return errorData.message;
      }
    }
    
    // Check error field (usually error code, but sometimes has message)
    if (errorData.error && typeof errorData.error === 'string') {
      const errMsg = errorData.error.toLowerCase();
      // Only use if it's clearly user-friendly (not a code like "VALIDATION_ERROR")
      if (!errMsg.includes('_error') && 
          !errMsg.includes('error') && 
          !errMsg.includes('failed') &&
          errMsg.length > 10) { // User messages are usually longer
        return errorData.error;
      }
    }
  }

  // PRIORITY 2: Check if error object has a userMessage property
  if (error?.userMessage && typeof error.userMessage === 'string') {
    return error.userMessage;
  }

  // PRIORITY 3: Parse axios/technical error messages
  if (error?.message && typeof error.message === 'string') {
    return parseErrorMessage(error.message);
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Parse technical error messages into user-friendly ones
 */
function parseErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Filter out technical axios messages
  if (lowerMessage.includes('request failed with status code')) {
    // Extract status code and provide user-friendly message
    const statusMatch = message.match(/status code (\d+)/);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1]);
      if (statusCode === 400) {
        return 'Please check your input and try again.';
      } else if (statusCode === 401) {
        return 'Your session has expired. Please log in again.';
      } else if (statusCode === 403) {
        return 'You do not have permission to perform this action.';
      } else if (statusCode === 404) {
        return 'The requested resource was not found.';
      } else if (statusCode === 409) {
        return 'This action conflicts with the current state. Please refresh and try again.';
      } else if (statusCode >= 500) {
        return 'The server encountered an error. Please try again in a moment.';
      }
      return 'An error occurred. Please try again.';
    }
    return 'An error occurred. Please try again.';
  }

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('network error')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'The request took too long. Please check your connection and try again.';
  }

  // Auth errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }

  if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  // Not found
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'The requested resource was not found.';
  }

  // Server errors
  if (lowerMessage.includes('500') || lowerMessage.includes('server error') || lowerMessage.includes('internal server error')) {
    return 'The server encountered an error. Please try again in a moment.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // DOM / map library errors (e.g. removeChild - React vs Leaflet)
  if (lowerMessage.includes('removechild') || lowerMessage.includes('not a child of this node') || lowerMessage.includes('domexception')) {
    return 'A display error occurred. Please refresh the page.';
  }

  // If it's still a technical message, return generic user-friendly message
  if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('exception')) {
    return 'An error occurred. Please try again.';
  }

  // If message seems user-friendly, return as-is
  return message;
}

/**
 * Create structured AppError from various error types
 */
export function createAppError(error: any): AppError {
  // If already an AppError
  if (error && typeof error === 'object' && error.type && error.category) {
    return error as AppError;
  }

  const userMessage = getUserFriendlyMessage(error);
  let type = ErrorType.UNKNOWN;
  let category = ErrorCategory.WARNING;
  let retryable = false;
  let action: string | undefined;
  let code: string | undefined;
  let statusCode: number | undefined;

  // Extract status code
  if (error?.response?.status) {
    statusCode = error.response.status;
  } else if (error?.statusCode) {
    statusCode = error.statusCode;
  }

  // Determine error type and category
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    type = ErrorType.TIMEOUT;
    category = ErrorCategory.WARNING;
    retryable = true;
    action = 'Try again';
  } else if (
    error?.code === 'ERR_NETWORK' ||
    error?.message?.includes('Network Error') ||
    !navigator.onLine
  ) {
    type = ErrorType.NETWORK;
    category = ErrorCategory.CRITICAL;
    retryable = true;
    action = 'Check your internet connection';
  } else if (statusCode === 401) {
    type = ErrorType.AUTHENTICATION;
    category = ErrorCategory.WARNING;
    retryable = false;
    action = 'Log in again';
  } else if (statusCode === 403) {
    type = ErrorType.AUTHORIZATION;
    category = ErrorCategory.WARNING;
    retryable = false;
    action = 'Contact support if you believe this is an error';
  } else if (statusCode === 404) {
    type = ErrorType.NOT_FOUND;
    category = ErrorCategory.INFO;
    retryable = false;
  } else if (statusCode === 400 || statusCode === 422) {
    type = ErrorType.VALIDATION;
    category = ErrorCategory.INFO;
    retryable = false;
  } else if (statusCode && statusCode >= 500) {
    type = ErrorType.SERVER_ERROR;
    category = ErrorCategory.WARNING;
    retryable = true;
    action = 'Try again in a moment';
  }

  // Extract error code
  if (error?.response?.data?.error) {
    code = error.response.data.error;
  } else if (error?.code) {
    code = error.code;
  }

  return {
    type,
    category,
    message: error?.message || userMessage,
    userMessage,
    technicalMessage: error?.message || error?.stack,
    code,
    statusCode,
    retryable,
    action,
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const appError = createAppError(error);
  return appError.retryable;
}

/**
 * Log error for debugging (structured for future error service integration)
 */
export function logError(error: any, context?: string) {
  const appError = createAppError(error);
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    type: appError.type,
    category: appError.category,
    message: appError.message,
    userMessage: appError.userMessage,
    code: appError.code,
    statusCode: appError.statusCode,
    technicalMessage: appError.technicalMessage,
    stack: error?.stack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  // Safe technical details for console (avoid circular refs / DOM nodes from raw error)
  const technicalDetails = {
    message: appError.message,
    type: appError.type,
    userMessage: appError.userMessage,
    technicalMessage: appError.technicalMessage ?? null,
    errorName: typeof error?.name === 'string' ? error.name : undefined,
    errorMessage: typeof error?.message === 'string' ? error.message : undefined,
    code: appError.code,
    statusCode: appError.statusCode,
    context: errorLog.context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('Error Logged');
    console.error('Context:', errorLog.context);
    console.error('Type:', errorLog.type);
    console.error('User Message:', errorLog.userMessage);
    console.error('Technical Details:', technicalDetails);
    console.groupEnd();
  }

  // TODO: Integrate with error logging service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error, { extra: errorLog });
  
  return errorLog;
}

/**
 * Get error action button text
 */
export function getErrorAction(error: any): string | undefined {
  const appError = createAppError(error);
  return appError.action;
}

