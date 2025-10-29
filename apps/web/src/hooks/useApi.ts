import { useState, useCallback } from 'react';
import api from '@/lib/api';

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
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      
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

  return {
    ...state,
    execute,
    reset
  };
}

// Specific API hooks for common operations
export function useDriveways() {
  const apiHook = useApi();
  
  const fetchDriveways = useCallback((params: Record<string, any> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiHook.execute(() => api.get(`/driveways?${queryString}`));
  }, [apiHook]);

  return {
    ...apiHook,
    fetchDriveways
  };
}

export function useBookings() {
  const apiHook = useApi();
  
  const fetchBookings = useCallback((params: Record<string, any> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiHook.execute(() => api.get(`/bookings?${queryString}`));
  }, [apiHook]);

  const createBooking = useCallback((bookingData: any) => {
    return apiHook.execute(() => api.post('/bookings', bookingData));
  }, [apiHook]);

  return {
    ...apiHook,
    fetchBookings,
    createBooking
  };
}

export function useDashboardStats() {
  const apiHook = useApi();
  
  const fetchStats = useCallback(() => {
    return apiHook.execute(() => api.get('/dashboard/stats'));
  }, [apiHook]);

  return {
    ...apiHook,
    fetchStats
  };
}
