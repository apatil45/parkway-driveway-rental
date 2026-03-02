/**
 * Tests for Bookings page
 * Tests booking list, status filtering, cancellation, and auto-refresh
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import BookingsPage from '@/app/bookings/page';
import api from '@/lib/api-client';

// Mock Next.js hooks
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock API client (page uses api-client, not api)
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock useAuth
jest.mock('@/hooks', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User' },
  }),
}));

// Mock useToast
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// Mock AppLayout
jest.mock('@/components/layout', () => ({
  AppLayout: ({ children }: any) => <div>{children}</div>,
}));

// Mock UI components used by BookingsPage (mock must provide all imports)
jest.mock('@/components/ui', () => ({
  ReviewForm: ({ onSuccess }: any) => (
    <button onClick={onSuccess}>Submit Review</button>
  ),
  ConfirmDialog: (props: any) => (
    <div data-testid="confirm-dialog">
      {props.open && (
        <>
          <button onClick={props.onConfirm}>Confirm</button>
          <button onClick={props.onCancel}>Cancel</button>
        </>
      )}
    </div>
  ),
  ImageWithPlaceholder: ({ src, alt }: any) => <img src={src} alt={alt || ''} />,
  ButtonLink: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe('BookingsPage', () => {
  const mockBookings = [
    {
      id: 'booking-1',
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 90000000).toISOString(),
      totalPrice: 20,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      driveway: {
        id: 'driveway-1',
        title: 'Test Driveway',
        address: '123 Test St',
        images: [],
        owner: {
          id: 'owner-1',
          name: 'Owner Name',
          phone: '123-456-7890',
        },
      },
    },
    {
      id: 'booking-2',
      startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      endTime: new Date(Date.now() - 82800000).toISOString(),
      totalPrice: 30,
      status: 'COMPLETED',
      paymentStatus: 'COMPLETED',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      driveway: {
        id: 'driveway-2',
        title: 'Completed Driveway',
        address: '456 Test Ave',
        images: [],
        owner: {
          id: 'owner-2',
          name: 'Owner 2',
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          bookings: mockBookings,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      },
    });
    (api.patch as jest.Mock).mockResolvedValue({
      data: { data: { success: true } },
    });
  });

  it('loads bookings on mount', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/bookings?')
      );
    });
  });

  it('displays all bookings', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Driveway')).toBeInTheDocument();
      expect(screen.getByText('Completed Driveway')).toBeInTheDocument();
    });
  });

  it('filters bookings by status', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Driveway')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox') || screen.getByDisplayValue(/all status/i);
    if (statusFilter) {
      fireEvent.change(statusFilter, { target: { value: 'COMPLETED' } });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('status=COMPLETED')
        );
      });
    }
  });

  it('displays booking details correctly', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Driveway')).toBeInTheDocument();
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
    });
  });

  it('shows payment required warning for pending bookings', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/payment required/i).length).toBeGreaterThan(0);
    });
  });

  it('allows cancelling pending bookings', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Driveway')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/bookings/booking-1',
        { status: 'CANCELLED' }
      );
    });
  });

  it('does not cancel if user declines confirmation', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Driveway')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
    const dialog = screen.getByTestId('confirm-dialog');
    const cancelBtn = dialog.querySelectorAll('button')[1]; // Confirm=0, Cancel=1
    fireEvent.click(cancelBtn!);

    expect(api.patch).not.toHaveBeenCalled();
  });

  it('auto-refreshes when payment is completed but booking is pending', async () => {
    jest.useFakeTimers();

    const pendingWithPayment = [
      {
        ...mockBookings[0],
        status: 'PENDING',
        paymentStatus: 'COMPLETED',
      },
    ];

    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          bookings: pendingWithPayment,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      },
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/payment received/i)).toBeInTheDocument();
    });

    // Fast-forward 3 seconds (polling interval)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      // Should have been called at least twice (initial + poll)
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('handles API errors gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load bookings/i)).toBeInTheDocument();
    });
  });

  it('redirects to login on 401 error', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
    });
  });

  it('displays empty state when no bookings', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          bookings: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
      },
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
    });
  });
});

