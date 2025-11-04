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
  // If already a formatted AppError
  if (error && typeof error === 'object' && error.userMessage) {
    return error.userMessage;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle API response errors
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle axios errors
  if (error?.message) {
    return parseErrorMessage(error.message);
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Parse technical error messages into user-friendly ones
 */
function parseErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (lowerMessage.includes('timeout')) {
    return 'The request took too long. Please try again.';
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
  if (lowerMessage.includes('500') || lowerMessage.includes('server error')) {
    return 'The server encountered an error. Please try again in a moment.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }

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

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Logged');
    console.error('Context:', errorLog.context);
    console.error('Type:', errorLog.type);
    console.error('User Message:', errorLog.userMessage);
    console.error('Technical Details:', errorLog);
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

