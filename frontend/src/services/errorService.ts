// Professional Error Service for Parkway.com
interface ErrorDetails {
  code?: string;
  field?: string;
  suggestion?: string;
  supportEmail?: string;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

interface ErrorAction {
  label: string;
  action: () => void;
  variant: 'primary' | 'secondary' | 'danger';
}

interface ErrorConfig {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  details?: ErrorDetails;
  actions?: ErrorAction[];
  showRetry?: boolean;
  onRetry?: () => void;
  showReport?: boolean;
  onReport?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

class ErrorService {
  private errorQueue: ErrorConfig[] = [];
  private isProcessing = false;
  private currentError: ErrorConfig | null = null;
  private listeners: Array<(error: ErrorConfig | null) => void> = [];

  // Subscribe to error events
  subscribe(listener: (error: ErrorConfig | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notify(error: ErrorConfig | null) {
    this.listeners.forEach(listener => listener(error));
  }

  // Show error
  showError(config: ErrorConfig) {
    this.errorQueue.push(config);
    this.processQueue();
  }

  // Process error queue
  private processQueue() {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const error = this.errorQueue.shift()!;
    this.currentError = error;
    this.notify(error);

    // Auto-close if configured
    if (error.autoClose && error.autoCloseDelay) {
      setTimeout(() => {
        this.close();
      }, error.autoCloseDelay);
    }
  }

  // Close current error
  close() {
    this.currentError = null;
    this.isProcessing = false;
    this.notify(null);
    
    // Process next error in queue
    if (this.errorQueue.length > 0) {
      setTimeout(() => this.processQueue(), 300);
    }
  }

  // Clear all errors
  clearAll() {
    this.errorQueue = [];
    this.close();
  }

  // Predefined error types
  showNetworkError(onRetry?: () => void) {
    this.showError({
      title: 'Connection Problem',
      message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
      type: 'error',
      details: {
        code: 'NETWORK_ERROR',
        suggestion: 'Check your internet connection and try again. If the problem persists, please contact support.',
        supportEmail: 'support@parkway.com'
      },
      showRetry: true,
      onRetry,
      showReport: true,
      onReport: () => this.reportError('Network Error', 'User reported network connectivity issue')
    });
  }

  showAuthenticationError() {
    this.showError({
      title: 'Authentication Required',
      message: 'Your session has expired. Please log in again to continue.',
      type: 'warning',
      details: {
        code: 'AUTH_EXPIRED',
        suggestion: 'Please log in again to continue using the platform.'
      },
      actions: [
        {
          label: 'Log In',
          action: () => window.location.href = '/login',
          variant: 'primary'
        }
      ],
      autoClose: false
    });
  }

  showValidationError(field: string, message: string) {
    this.showError({
      title: 'Invalid Input',
      message: `Please check the ${field} field and try again.`,
      type: 'error',
      details: {
        code: 'VALIDATION_ERROR',
        field,
        suggestion: message
      },
      autoClose: true,
      autoCloseDelay: 5000
    });
  }

  showBookingError(message: string, onRetry?: () => void) {
    this.showError({
      title: 'Booking Failed',
      message: message,
      type: 'error',
      details: {
        code: 'BOOKING_ERROR',
        suggestion: 'Please try again or contact support if the problem persists.'
      },
      showRetry: true,
      onRetry,
      showReport: true,
      onReport: () => this.reportError('Booking Error', message)
    });
  }

  showPaymentError(message: string, onRetry?: () => void) {
    this.showError({
      title: 'Payment Failed',
      message: message,
      type: 'error',
      details: {
        code: 'PAYMENT_ERROR',
        suggestion: 'Please check your payment information and try again.'
      },
      showRetry: true,
      onRetry,
      showReport: true,
      onReport: () => this.reportError('Payment Error', message)
    });
  }

  showSuccess(message: string, autoClose: boolean = true) {
    this.showError({
      title: 'Success!',
      message: message,
      type: 'success',
      autoClose,
      autoCloseDelay: autoClose ? 3000 : undefined
    });
  }

  showInfo(message: string, autoClose: boolean = true) {
    this.showError({
      title: 'Information',
      message: message,
      type: 'info',
      autoClose,
      autoCloseDelay: autoClose ? 4000 : undefined
    });
  }

  showWarning(message: string, autoClose: boolean = true) {
    this.showError({
      title: 'Warning',
      message: message,
      type: 'warning',
      autoClose,
      autoCloseDelay: autoClose ? 5000 : undefined
    });
  }

  // Report error to backend
  private async reportError(type: string, message: string) {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  // Handle API errors
  handleApiError(error: any, context?: string) {
    console.error('API Error:', error);

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          this.showAuthenticationError();
          break;
        case 403:
          this.showError({
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            type: 'error',
            details: {
              code: 'ACCESS_DENIED',
              suggestion: 'Please contact support if you believe this is an error.'
            }
          });
          break;
        case 404:
          this.showError({
            title: 'Not Found',
            message: 'The requested resource was not found.',
            type: 'error',
            details: {
              code: 'NOT_FOUND',
              suggestion: 'Please check the URL or try again later.'
            }
          });
          break;
        case 429:
          this.showError({
            title: 'Too Many Requests',
            message: 'You\'re making requests too quickly. Please slow down and try again.',
            type: 'warning',
            details: {
              code: 'RATE_LIMITED',
              suggestion: 'Please wait a moment before trying again.'
            },
            autoClose: true,
            autoCloseDelay: 5000
          });
          break;
        case 500:
          this.showError({
            title: 'Server Error',
            message: 'Something went wrong on our end. We\'re working to fix it.',
            type: 'error',
            details: {
              code: 'SERVER_ERROR',
              suggestion: 'Please try again in a few minutes.'
            },
            showReport: true,
            onReport: () => this.reportError('Server Error', data?.message || 'Unknown server error')
          });
          break;
        default:
          this.showError({
            title: 'Request Failed',
            message: data?.message || 'An unexpected error occurred.',
            type: 'error',
            details: {
              code: `HTTP_${status}`,
              suggestion: 'Please try again or contact support.'
            }
          });
      }
    } else if (error.request) {
      // Network error
      this.showNetworkError();
    } else {
      // Other error
      this.showError({
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again.',
        type: 'error',
        details: {
          code: 'UNKNOWN_ERROR',
          suggestion: 'Please refresh the page and try again.'
        }
      });
    }
  }
}

// Create singleton instance
const errorService = new ErrorService();
export default errorService;
