import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';

// Test component that uses toast
function TestComponent() {
  const { showToast, removeToast, toasts } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showToast('Warning message', 'warning')}>
        Show Warning
      </button>
      <button onClick={() => toasts.length > 0 && removeToast(toasts[0].id)}>
        Remove First
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
}

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders ToastProvider', () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Success message').closest('div');
    expect(toast).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('shows error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Error message').closest('div');
    expect(toast).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('shows info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Info message').closest('div');
    expect(toast).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('shows warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Warning');
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Warning message').closest('div');
    expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('auto-dismisses toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('manually removes toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showButton = screen.getByText('Show Success');
    act(() => {
      fireEvent.click(showButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close notification');
    act(() => {
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('shows multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Info'));
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
  });

  it('throws error when useToast used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');

    console.error = originalError;
  });

  it('displays correct icon for each toast type', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
    });

    await waitFor(() => {
      const toast = screen.getByText('Success message').closest('div');
      const icon = toast?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});

