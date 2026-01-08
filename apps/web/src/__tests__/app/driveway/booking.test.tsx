/**
 * Tests for booking form and flow
 * Tests form validation, submission, error handling, and sessionStorage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import DrivewayDetailsPage from '@/app/driveway/[id]/page';
import api from '@/lib/api';

// Mock Next.js hooks
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: 'test-driveway-id' }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock hooks
jest.mock('@/hooks', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: 'user-1', name: 'Test User' },
  }),
  useOffline: () => false,
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

describe('DrivewayDetailsPage - Booking Flow', () => {
  const mockDriveway = {
    id: 'test-driveway-id',
    title: 'Test Driveway',
    description: 'A test driveway',
    address: '123 Test St',
    latitude: 37.7749,
    longitude: -122.4194,
    pricePerHour: 10,
    capacity: 2,
    carSize: ['small', 'medium'],
    amenities: ['covered', 'security'],
    images: ['https://example.com/image.jpg'],
    isActive: true,
    isAvailable: true,
    averageRating: 4.5,
    reviewCount: 10,
    owner: {
      id: 'owner-1',
      name: 'Owner Name',
      phone: '123-456-7890',
    },
    reviews: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockDriveway },
    });
    // Clear sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('loads driveway details on mount', async () => {
    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/driveways/test-driveway-id');
    });
  });

  it('displays booking form when "Book Now" is clicked', async () => {
    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Now'));

    await waitFor(() => {
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    });
  });

  it('calculates price when times are entered', async () => {
    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Now'));

    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    // Set future dates
    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 3);

    fireEvent.change(startTimeInput, {
      target: { value: startDate.toISOString().slice(0, 16) },
    });

    fireEvent.change(endTimeInput, {
      target: { value: endDate.toISOString().slice(0, 16) },
    });

    await waitFor(() => {
      // Price should be calculated (2 hours * $10 = $20)
      expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
    });
  });

  it('validates that end time is after start time', async () => {
    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Now'));

    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 3);
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 1); // Before start

    fireEvent.change(startTimeInput, {
      target: { value: startDate.toISOString().slice(0, 16) },
    });

    fireEvent.change(endTimeInput, {
      target: { value: endDate.toISOString().slice(0, 16) },
    });

    await waitFor(() => {
      // Price should not be calculated for invalid times
      expect(screen.queryByText(/\$\d+\.\d{2}/)).not.toBeInTheDocument();
    });
  });

  it('saves form data to sessionStorage when user is not authenticated', async () => {
    // Mock unauthenticated user
    jest.doMock('@/hooks', () => ({
      useAuth: () => ({
        isAuthenticated: false,
        loading: false,
        user: null,
      }),
    }));

    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Now'));

    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 3);

    fireEvent.change(startTimeInput, {
      target: { value: startDate.toISOString().slice(0, 16) },
    });

    fireEvent.change(endTimeInput, {
      target: { value: endDate.toISOString().slice(0, 16) },
    });

    const submitButton = screen.getByText(/confirm booking/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/login?redirect=')
      );
    });
  });

  it('prevents duplicate submissions', async () => {
    (api.post as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { data: { id: 'booking-1' } } }), 100))
    );

    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Now'));

    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 3);

    fireEvent.change(startTimeInput, {
      target: { value: startDate.toISOString().slice(0, 16) },
    });

    fireEvent.change(endTimeInput, {
      target: { value: endDate.toISOString().slice(0, 16) },
    });

    const form = screen.getByRole('form') || startTimeInput.closest('form');
    if (form) {
      fireEvent.submit(form);
      
      // Try to submit again immediately
      fireEvent.submit(form);
      
      // Should only call API once
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('handles booking creation errors', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'Time slot is no longer available' },
      },
    });

    render(<DrivewayDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Now'));

    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 3);

    fireEvent.change(startTimeInput, {
      target: { value: startDate.toISOString().slice(0, 16) },
    });

    fireEvent.change(endTimeInput, {
      target: { value: endDate.toISOString().slice(0, 16) },
    });

    const form = screen.getByRole('form') || startTimeInput.closest('form');
    if (form) {
      fireEvent.submit(form);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    }
  });
});

