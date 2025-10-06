// Enhanced Error Handling Service for Parkway.com
import toast from 'react-hot-toast';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

class ErrorHandlerService {
  private errorLog: APIError[] = [];
  private maxLogSize = 100;

  // Enhanced error handling with user-friendly messages
  handleAPIError(error: any, context: ErrorContext): APIError {
    const timestamp = new Date().toISOString();
    let userMessage = 'Something went wrong. Please try again.';
    let status = 500;
    let code = 'UNKNOWN_ERROR';

    // Extract error information
    if (error.response) {
      // Server responded with error status
      status = error.response.status;
      const serverError = error.response.data;
      
      if (serverError?.message) {
        userMessage = serverError.message;
      } else if (serverError?.error) {
        userMessage = serverError.error;
      } else {
        userMessage = this.getDefaultErrorMessage(status);
      }
      
      code = serverError?.code || `HTTP_${status}`;
    } else if (error.request) {
      // Network error
      userMessage = 'Network error. Please check your connection and try again.';
      code = 'NETWORK_ERROR';
      status = 0;
    } else {
      // Other error
      userMessage = error.message || userMessage;
      code = 'CLIENT_ERROR';
    }

    const apiError: APIError = {
      message: userMessage,
      status,
      code,
      details: {
        originalError: error.message,
        context,
        stack: error.stack
      },
      timestamp
    };

    // Log error
    this.logError(apiError);

    // Show user-friendly notification
    this.showUserNotification(apiError, context);

    return apiError;
  }

  // Get default error messages for common HTTP status codes
  private getDefaultErrorMessage(status: number): string {
    const errorMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'You need to log in to perform this action.',
      403: 'You don\'t have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This action conflicts with existing data.',
      422: 'The data you provided is invalid.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.',
      504: 'Request timeout. Please try again later.'
    };

    return errorMessages[status] || 'An unexpected error occurred. Please try again.';
  }

  // Show user-friendly notification
  private showUserNotification(error: APIError, context: ErrorContext): void {
    const { operation, component } = context;
    
    // Don't show toast for certain operations to avoid spam
    const silentOperations = ['heartbeat', 'background-sync', 'cache-refresh'];
    if (silentOperations.includes(operation)) {
      return;
    }

    // Customize message based on context
    let displayMessage = error.message;
    
    if (operation.includes('login')) {
      displayMessage = 'Login failed. Please check your credentials.';
    } else if (operation.includes('register')) {
      displayMessage = 'Registration failed. Please check your information.';
    } else if (operation.includes('booking')) {
      displayMessage = 'Booking failed. Please try again.';
    } else if (operation.includes('driveway')) {
      displayMessage = 'Driveway operation failed. Please try again.';
    }

    // Show appropriate toast based on error severity
    if (error.status && error.status >= 500) {
      toast.error(displayMessage, {
        duration: 5000,
        position: 'top-right'
      });
    } else if (error.status === 401 || error.status === 403) {
      toast.error(displayMessage, {
        duration: 4000,
        position: 'top-right'
      });
    } else {
      toast.error(displayMessage, {
        duration: 3000,
        position: 'top-right'
      });
    }
  }

  // Log error for debugging and monitoring
  private logError(error: APIError): void {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 API Error: ${error.code}`);
      console.error('Message:', error.message);
      console.error('Status:', error.status);
      console.error('Context:', error.details?.context);
      console.error('Timestamp:', error.timestamp);
      console.error('Stack:', error.details?.stack);
      console.groupEnd();
    }

    // In production, you might want to send errors to a monitoring service
    // this.sendToMonitoringService(error);
  }

  // Retry mechanism for failed requests
  async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry certain errors
        if (this.shouldNotRetry(error)) {
          throw this.handleAPIError(error, context);
        }

        // Show retry notification on last attempt
        if (attempt === maxRetries) {
          toast.error(`Operation failed after ${maxRetries} attempts. Please try again.`, {
            duration: 4000
          });
          throw this.handleAPIError(error, context);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw this.handleAPIError(lastError, context);
  }

  // Determine if an error should not be retried
  private shouldNotRetry(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      // Don't retry client errors (4xx) except 429 (rate limit)
      return status >= 400 && status < 500 && status !== 429;
    }
    return false;
  }

  // Get recent errors for debugging
  getRecentErrors(limit: number = 10): APIError[] {
    return this.errorLog.slice(0, limit);
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByStatus: Record<number, number>;
    errorsByCode: Record<string, number>;
    recentErrors: APIError[];
  } {
    const errorsByStatus: Record<number, number> = {};
    const errorsByCode: Record<string, number> = {};

    this.errorLog.forEach(error => {
      if (error.status) {
        errorsByStatus[error.status] = (errorsByStatus[error.status] || 0) + 1;
      }
      errorsByCode[error.code || 'UNKNOWN'] = (errorsByCode[error.code || 'UNKNOWN'] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByStatus,
      errorsByCode,
      recentErrors: this.errorLog.slice(0, 5)
    };
  }

  // Validate API response
  validateResponse<T>(response: any, expectedFields: string[] = []): T {
    if (!response) {
      throw new Error('Empty response received');
    }

    if (response.data === undefined) {
      throw new Error('Invalid response format: missing data field');
    }

    // Check for expected fields
    for (const field of expectedFields) {
      if (!(field in response.data)) {
        console.warn(`Missing expected field: ${field}`);
      }
    }

    return response.data;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandlerService();

export default errorHandler;
