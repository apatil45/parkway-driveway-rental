import React from 'react';

interface ErrorDisplayProps {
  error: string | Error;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Something went wrong',
  onRetry,
  onDismiss,
  showDetails = false,
  type = 'error',
  className = ''
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack ? error.stack : null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'info':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
    }
  };

  return (
    <div className={`error-display ${type} ${className}`} role="alert" aria-live="assertive">
      <div className="error-content">
        <div className="error-icon" aria-hidden="true">
          {getIcon()}
        </div>
        <div className="error-text">
          <h3 className="error-title">{title}</h3>
          <p className="error-message">{errorMessage}</p>
          {showDetails && errorStack && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <pre className="error-stack">{errorStack}</pre>
            </details>
          )}
        </div>
        {onDismiss && (
          <button
            className="error-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      {onRetry && (
        <div className="error-actions">
          <button className="btn btn-primary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
