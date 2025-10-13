import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="error-fallback">
      <div className="error-container">
        <div className="error-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        
        <h1 className="error-title">Oops! Something went wrong</h1>
        
        <p className="error-message">
          We're sorry, but something unexpected happened. Don't worry, our team has been notified and we're working on fixing this issue.
        </p>

        {isDevelopment && (
          <details className="error-details">
            <summary>Technical Details (Development Mode)</summary>
            <pre className="error-stack">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <>
                  <br /><br />
                  <strong>Stack Trace:</strong>
                  <br />
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}

        <div className="error-actions">
          <button 
            className="error-button primary"
            onClick={resetErrorBoundary}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23,4 23,10 17,10"/>
              <polyline points="1,20 1,14 7,14"/>
              <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4-4.64,4.36A9,9,0,0,1,3.51,15"/>
            </svg>
            Try Again
          </button>

          <button 
            className="error-button secondary"
            onClick={handleGoHome}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Go Home
          </button>

          <button 
            className="error-button outline"
            onClick={handleReload}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
            </svg>
            Reload Page
          </button>
        </div>

        <div className="error-help">
          <p>If this problem persists, please:</p>
          <ul>
            <li>Check your internet connection</li>
            <li>Clear your browser cache</li>
            <li>Contact our support team</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
