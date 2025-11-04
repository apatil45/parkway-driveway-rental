/**
 * Professional Error Handler Hook
 * Provides consistent error handling with automatic toast notifications
 */

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { createAppError, logError, ErrorCategory, getUserFriendlyMessage } from '@/lib/errors';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast: showToastNotification } = useToast();
  const {
    showToast = true,
    logError: shouldLog = true,
    context = 'Unknown',
  } = options;

  const handleError = useCallback(
    (error: any, customOptions?: Partial<UseErrorHandlerOptions>) => {
      const opts = { ...options, ...customOptions };
      const appError = createAppError(error);
      
      // Log error if enabled
      if (opts.logError !== false && shouldLog) {
        logError(error, opts.context || context);
      }

      // Show toast notification based on error category
      if (opts.showToast !== false && showToast) {
        const toastType = 
          appError.category === ErrorCategory.CRITICAL ? 'error' :
          appError.category === ErrorCategory.WARNING ? 'warning' :
          'error';
        
        showToastNotification(appError.userMessage, toastType, 6000);
      }

      return appError;
    },
    [showToastNotification, options, shouldLog, context, showToast]
  );

  /**
   * Handle error silently (no toast, just return error)
   */
  const handleErrorSilently = useCallback(
    (error: any) => {
      return createAppError(error);
    },
    []
  );

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback((error: any): string => {
    return getUserFriendlyMessage(error);
  }, []);

  return {
    handleError,
    handleErrorSilently,
    getErrorMessage,
  };
}

