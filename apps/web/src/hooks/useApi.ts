import { useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { createAppError } from '@/lib/errors';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: ''
  });

  const execute = useCallback(async (
    apiCall: () => Promise<any>,
    customOptions?: Partial<UseApiOptions>
  ) => {
    const { onSuccess, onError } = { ...options, ...customOptions };
    
    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await apiCall();
      const data = response.data?.data || response.data;
      
      setState({
        data,
        loading: false,
        error: ''
      });

      onSuccess?.(data);
      return { success: true, data };
    } catch (error: any) {
      // Use createAppError to get user-friendly message
      const appError = createAppError(error);
      const errorMessage = appError.userMessage;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: ''
    });
  }, []);

  // Return a stable reference to avoid effect dependency churn
  return useMemo(() => ({
    ...state,
    execute,
    reset,
  }), [state, execute, reset]);
}

// Specific API hooks for common operations
export function useDriveways() {
  const { execute, ...rest } = useApi();
  
  const fetchDriveways = useCallback((params: Record<string, any> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return execute(() => api.get(`/driveways?${queryString}`));
  }, [execute]);

  return {
    ...rest,
    execute,
    fetchDriveways
  };
}

export function useBookings() {
  const { execute, ...rest } = useApi();
  
  const fetchBookings = useCallback((params: Record<string, any> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return execute(() => api.get(`/bookings?${queryString}`));
  }, [execute]);

  const createBooking = useCallback((bookingData: any) => {
    return execute(() => api.post('/bookings', bookingData));
  }, [execute]);

  return {
    ...rest,
    execute,
    fetchBookings,
    createBooking
  };
}

export function useDashboardStats() {
  const { execute, ...rest } = useApi();
  
  const fetchStats = useCallback(async () => {
    // Try once; on 401 attempt refresh then retry
    const res = await execute(() => api.get('/dashboard/stats'));
    if (!res.success && res.error && res.error.toLowerCase().includes('unauthorized')) {
      try {
        await api.post('/auth/refresh');
        return await execute(() => api.get('/dashboard/stats'));
      } catch {}
    }
    return res;
  }, [execute]);

  return {
    ...rest,
    execute,
    fetchStats
  };
}
