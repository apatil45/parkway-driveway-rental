import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-details-summary">
                  Error Details (Development Only)
                </summary>
                <div className="error-boundary-details-content">
                  <h4>Error:</h4>
                  <pre className="error-boundary-stack">
                    {this.state.error.toString()}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre className="error-boundary-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <div className="error-boundary-actions">
              <Button variant="primary" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
