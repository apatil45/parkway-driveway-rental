import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { mockApiResponse, mockApiError } from '../__mocks__/api';

// Mock the API
jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location
    delete (window as any).location;
    window.location = { pathname: '/' } as any;
  });

  it('starts with loading state', () => {
    mockedApi.get.mockRejectedValue(mockApiError('Unauthorized', 401));
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('successfully checks auth and sets user', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['DRIVER'],
      isActive: true,
    };

    mockedApi.get.mockResolvedValue(mockApiResponse(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('handles 401 error and tries refresh', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['DRIVER'],
      isActive: true,
    };

    // First call fails with 401
    mockedApi.get.mockRejectedValueOnce(mockApiError('Unauthorized', 401));
    // Refresh succeeds
    mockedApi.post.mockResolvedValueOnce(mockApiResponse({}));
    // Second me call succeeds
    mockedApi.get.mockResolvedValueOnce(mockApiResponse(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles 401 error when refresh fails', async () => {
    // First call fails with 401
    mockedApi.get.mockRejectedValueOnce(mockApiError('Unauthorized', 401));
    // Refresh also fails
    mockedApi.post.mockRejectedValueOnce(mockApiError('Unauthorized', 401));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('handles server error (500+)', async () => {
    mockedApi.get.mockRejectedValue(mockApiError('Server Error', 500));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Failed to verify authentication');
  });

  it('successfully logs in', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['DRIVER'],
      isActive: true,
    };

    mockedApi.get.mockRejectedValue(mockApiError('Unauthorized', 401));
    mockedApi.post.mockResolvedValue(mockApiResponse({ user: mockUser }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.login('test@example.com', 'password123');
      expect(response.success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('handles login failure', async () => {
    mockedApi.get.mockRejectedValue(mockApiError('Unauthorized', 401));
    mockedApi.post.mockRejectedValue(mockApiError('Invalid credentials', 401));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.login('test@example.com', 'wrongpassword');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('successfully registers', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'New User',
      email: 'new@example.com',
      roles: ['DRIVER'],
      isActive: true,
    };

    mockedApi.get.mockRejectedValue(mockApiError('Unauthorized', 401));
    mockedApi.post.mockResolvedValue(mockApiResponse({ user: mockUser }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123',
        roles: ['DRIVER'],
      });
      expect(response.success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles registration failure', async () => {
    mockedApi.get.mockRejectedValue(mockApiError('Unauthorized', 401));
    mockedApi.post.mockRejectedValue(mockApiError('Email already exists', 400));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.register({
        name: 'New User',
        email: 'existing@example.com',
        password: 'Password123',
        roles: ['DRIVER'],
      });
      expect(response.success).toBe(false);
      expect(response.error).toBe('Email already exists');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Email already exists');
  });

  it('successfully logs out', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['DRIVER'],
      isActive: true,
    };

    mockedApi.get.mockResolvedValue(mockApiResponse(mockUser));
    mockedApi.post.mockResolvedValue(mockApiResponse({}));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles logout error gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['DRIVER'],
      isActive: true,
    };

    mockedApi.get.mockResolvedValue(mockApiResponse(mockUser));
    mockedApi.post.mockRejectedValue(mockApiError('Logout failed', 500));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    // State should still be cleared even if API call fails
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

