import { useCallback } from 'react';
import { toast } from 'react-toastify';

export const useSingleNotification = () => {
  const showNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => {
    // Clear any existing notifications first
    toast.dismiss();
    
    // Show the new notification
    switch (type) {
      case 'success':
        toast.success(message, { autoClose: duration || 5000 });
        break;
      case 'error':
        toast.error(message, { autoClose: duration || 5000 });
        break;
      case 'warning':
        toast.warn(message, { autoClose: duration || 5000 });
        break;
      case 'info':
        toast.info(message, { autoClose: duration || 5000 });
        break;
    }
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showNotification('success', message, duration);
  }, [showNotification]);

  const error = useCallback((message: string, duration?: number) => {
    showNotification('error', message, duration);
  }, [showNotification]);

  const warning = useCallback((message: string, duration?: number) => {
    showNotification('warning', message, duration);
  }, [showNotification]);

  const info = useCallback((message: string, duration?: number) => {
    showNotification('info', message, duration);
  }, [showNotification]);

  const clearAll = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    success,
    error,
    warning,
    info,
    clearAll
  };
};
