/**
 * Comprehensive tests for ErrorBoundary component
 * Tests error catching, fallback UI, error logging, and reset functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorMessage from '@/components/ui/ErrorMessage';

// Mock ErrorMessage component
jest.mock('@/components/ui/ErrorMessage', () => ({
  __esModule: true,
  default: ({ title, message, onRetry }: any) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    // Suppress console.error for error boundary tests
    console.error = jest.fn();
    console.log = jest.fn();
    // Reset React error boundary
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error = originalError;
    console.log = originalLog;
    jest.restoreAllMocks();
  });

  it('catches errors thrown by children', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('displays fallback UI when error occurs', () => {
    const fallback = <div>Custom fallback</div>;

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('displays default ErrorMessage when no fallback provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('reset functionality works', () => {
    const NoErrorComponent = () => <div>No error</div>;
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry button - this resets the error boundary state
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Re-render with error fixed - need to unmount and remount to fully reset
    rerender(
      <ErrorBoundary>
        <NoErrorComponent />
      </ErrorBoundary>
    );

    // The error boundary should now render children since error state was reset
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('handles error without message', () => {
    const ThrowErrorNoMessage = () => {
      throw new Error('');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorNoMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('handles multiple errors', () => {
    const ThrowError1 = () => {
      throw new Error('First error');
    };
    const ThrowError2 = () => {
      throw new Error('Second error');
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError1 />
      </ErrorBoundary>
    );

    expect(screen.getByText('First error')).toBeInTheDocument();

    // Reset and throw another error
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Unmount and remount with new error
    rerender(
      <ErrorBoundary key="new-boundary">
        <ThrowError2 />
      </ErrorBoundary>
    );

    expect(screen.getByText('Second error')).toBeInTheDocument();
  });

  it('handles errors in nested components', () => {
    const NestedComponent = () => (
      <div>
        <ThrowError shouldThrow={true} />
      </div>
    );

    render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
