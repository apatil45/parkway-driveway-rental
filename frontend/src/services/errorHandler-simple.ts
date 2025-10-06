// Simplified Error Handling Service for Parkway.com
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

    // Log the error
    this.logError(apiError);

    // Show user notification
    this.showUserNotification(apiError, context);

    return apiError;
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You are not authorized. Please log in and try again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may have been modified by another user.';
      case 422:
        return 'Invalid data provided. Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The request took too long to process.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private logError(error: APIError): void {
    // Add to error log
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
  }

  private showUserNotification(error: APIError, context: ErrorContext): void {
    // Show toast notification
    toast.error(error.message, {
      duration: 5000,
      position: 'top-right',
      id: `error-${context.operation}-${Date.now()}`
    });
  }

  // Get recent errors for debugging
  getRecentErrors(count: number = 10): APIError[] {
    return this.errorLog.slice(0, count);
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
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
        
        if (attempt === maxRetries) {
          // Final attempt failed
          throw this.handleAPIError(error, {
            ...context,
            additionalInfo: { ...context.additionalInfo, attempts: maxRetries }
          });
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        
        // Show retry notification
        toast.loading(`Retrying ${context.operation}... (${attempt}/${maxRetries})`, {
          id: `retry-${context.operation}`
        });
      }
    }
    
    throw lastError;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandlerService();

export default errorHandler;
