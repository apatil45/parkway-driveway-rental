/**
 * Tests for Search page
 * Tests search functionality, filters, map integration, and pagination
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchPage from '@/app/search/page';
import { useDriveways } from '@/hooks';

// Mock Next.js hooks
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useDriveways hook
const mockFetchDriveways = jest.fn();
jest.mock('@/hooks', () => ({
  useDriveways: () => ({
    data: [],
    loading: false,
    error: null,
    fetchDriveways: mockFetchDriveways,
  }),
  useOffline: () => false,
}));

// Mock useToast
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// Mock MapView
jest.mock('@/components/ui/MapView', () => ({
  __esModule: true,
  default: ({ markers, onMarkerClick }: any) => (
    <div data-testid="map-view">
      {markers.map((m: any) => (
        <button
          key={m.id}
          data-testid={`marker-${m.id}`}
          onClick={() => onMarkerClick?.(m.id)}
        >
          {m.title}
        </button>
      ))}
    </div>
  ),
}));

// Mock AppLayout
jest.mock('@/components/layout', () => ({
  AppLayout: ({ children }: any) => <div>{children}</div>,
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchDriveways.mockResolvedValue({
      success: true,
      data: {
        driveways: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
    });
  });

  it('renders search page', () => {
    render(<SearchPage />);
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('shows filters panel when filters button is clicked', () => {
    render(<SearchPage />);
    
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    expect(screen.getByText(/hide filters/i)).toBeInTheDocument();
  });

  it('calls fetchDriveways on mount', async () => {
    render(<SearchPage />);

    await waitFor(() => {
      expect(mockFetchDriveways).toHaveBeenCalled();
    });
  });

  it('updates search when filters change', async () => {
    render(<SearchPage />);

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    const searchButton = screen.getByText(/search/i);
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockFetchDriveways).toHaveBeenCalledTimes(2); // Once on mount, once on search
    });
  });

  it('handles geolocation when available', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  it('handles geolocation errors gracefully', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'User denied geolocation',
      });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    // Should not crash, just silently fail
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('displays empty state when no results', async () => {
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText(/no driveways found/i)).toBeInTheDocument();
    });
  });

  it('displays driveways when results are available', async () => {
    const mockDriveways = [
      {
        id: '1',
        title: 'Test Driveway 1',
        address: '123 Test St',
        pricePerHour: 10,
        latitude: 37.7749,
        longitude: -122.4194,
        images: [],
        averageRating: 4.5,
        reviewCount: 10,
        capacity: 2,
        amenities: ['covered'],
        carSize: ['small'],
        isActive: true,
        isAvailable: true,
        owner: { id: '1', name: 'Owner' },
      },
    ];

    mockFetchDriveways.mockResolvedValue({
      success: true,
      data: {
        driveways: mockDriveways,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    });

    // Re-mock useDriveways with data
    jest.doMock('@/hooks', () => ({
      useDriveways: () => ({
        data: mockDriveways,
        loading: false,
        error: null,
        fetchDriveways: mockFetchDriveways,
      }),
    }));

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Driveway 1')).toBeInTheDocument();
    });
  });

  it('navigates to driveway details when clicked', async () => {
    const mockDriveways = [
      {
        id: '1',
        title: 'Test Driveway 1',
        address: '123 Test St',
        pricePerHour: 10,
        latitude: 37.7749,
        longitude: -122.4194,
        images: [],
        averageRating: 4.5,
        reviewCount: 10,
        capacity: 2,
        amenities: ['covered'],
        carSize: ['small'],
        isActive: true,
        isAvailable: true,
        owner: { id: '1', name: 'Owner' },
      },
    ];

    mockFetchDriveways.mockResolvedValue({
      success: true,
      data: {
        driveways: mockDriveways,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    });

    render(<SearchPage />);

    await waitFor(() => {
      const driveway = screen.getByText('Test Driveway 1');
      expect(driveway).toBeInTheDocument();
    });

    const drivewayElement = screen.getByText('Test Driveway 1').closest('div');
    if (drivewayElement) {
      fireEvent.click(drivewayElement);
      expect(mockPush).toHaveBeenCalledWith('/driveway/1');
    }
  });

  it('handles pagination', async () => {
    mockFetchDriveways.mockResolvedValue({
      success: true,
      data: {
        driveways: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      },
    });

    render(<SearchPage />);

    await waitFor(() => {
      const nextButton = screen.getByText(/next/i);
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockFetchDriveways).toHaveBeenCalledWith(
          expect.objectContaining({
            page: '2',
          })
        );
      }
    });
  });
});

