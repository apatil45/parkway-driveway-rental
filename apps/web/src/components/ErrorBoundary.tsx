'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ui';
import { logError } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error using our error logging system
    logError(error, `ErrorBoundary: ${errorInfo.componentStack || 'Unknown component'}`);
    
    // TODO: Integrate with error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if error is related to map container reuse
      const isMapError = this.state.error?.message?.includes('Map container is being reused') ||
                        this.state.error?.message?.includes('_leaflet_pos');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <ErrorMessage
            title="Something went wrong"
            message={isMapError 
              ? "Map initialization error. Please refresh the page or navigate away and come back."
              : this.state.error?.message || 'An unexpected error occurred'}
            onRetry={() => {
              // For map errors, reload the page to fully reset the map state
              if (isMapError && typeof window !== 'undefined') {
                window.location.reload();
              } else {
                // For other errors, just reset state and let component remount
                this.setState({ hasError: false, error: null });
              }
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

