/**
 * Tests for ErrorBoundary handling map-specific errors
 * Tests map container reuse errors and _leaflet_pos errors
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock ErrorMessage component
jest.mock('@/components/ui/ErrorMessage', () => ({
  __esModule: true,
  default: ({ title, message, onRetry }: any) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Try Again</button>}
    </div>
  ),
}));

// Mock window.location.reload
const mockReload = jest.fn();
delete (window as any).location;
(window as any).location = {
  reload: mockReload,
  pathname: '/search',
  href: 'http://localhost:3000/search',
};

describe('ErrorBoundary - Map Error Handling', () => {
  const originalError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockReload.mockClear();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('detects map container reuse errors', () => {
    const ThrowMapError = () => {
      throw new Error('Map container is being reused by another instance');
    };

    render(
      <ErrorBoundary>
        <ThrowMapError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/map initialization error/i)).toBeInTheDocument();
  });

  it('detects _leaflet_pos errors', () => {
    const ThrowLeafletError = () => {
      throw new Error('Cannot read properties of undefined (reading \'_leaflet_pos\')');
    };

    render(
      <ErrorBoundary>
        <ThrowLeafletError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/map initialization error/i)).toBeInTheDocument();
  });

  it('reloads page for map errors on retry', () => {
    const ThrowMapError = () => {
      throw new Error('Map container is being reused by another instance');
    };

    render(
      <ErrorBoundary>
        <ThrowMapError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('does not reload for non-map errors', () => {
    const ThrowGenericError = () => {
      throw new Error('Generic error');
    };

    render(
      <ErrorBoundary>
        <ThrowGenericError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(mockReload).not.toHaveBeenCalled();
  });

  it('shows appropriate message for map errors', () => {
    const ThrowMapError = () => {
      throw new Error('Map container is being reused by another instance');
    };

    render(
      <ErrorBoundary>
        <ThrowMapError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/please refresh the page/i)).toBeInTheDocument();
  });

  it('shows generic message for non-map errors', () => {
    const ThrowGenericError = () => {
      throw new Error('Generic error message');
    };

    render(
      <ErrorBoundary>
        <ThrowGenericError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Generic error message')).toBeInTheDocument();
  });
});

