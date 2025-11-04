/**
 * Professional Error Display Component
 * Shows errors based on category with appropriate UI
 */

import React from 'react';
import { ErrorMessage } from './ErrorMessage';
import { ErrorCategory, createAppError, getErrorAction } from '@/lib/errors';
import { Button } from './Button';

interface ErrorDisplayProps {
  error: any;
  title?: string;
  onRetry?: () => void;
  className?: string;
  inline?: boolean; // Show inline instead of full page
}

export default function ErrorDisplay({
  error,
  title,
  onRetry,
  className = '',
  inline = false,
}: ErrorDisplayProps) {
  const appError = createAppError(error);
  const actionText = getErrorAction(error) || 'Try Again';
  const displayTitle = title || getErrorTitle(appError.category);
  
  // For inline errors, show compact version
  if (inline) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">{displayTitle}</h3>
            <p className="text-sm text-red-700">{appError.userMessage}</p>
            {appError.retryable && onRetry && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                {actionText}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For critical errors, show full page ErrorMessage
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 p-4 ${className}`}>
      <ErrorMessage
        title={displayTitle}
        message={appError.userMessage}
        onRetry={appError.retryable ? onRetry : undefined}
      />
    </div>
  );
}

function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.CRITICAL:
      return 'Critical Error';
    case ErrorCategory.WARNING:
      return 'Error';
    case ErrorCategory.INFO:
      return 'Notice';
    default:
      return 'Error';
  }
}

