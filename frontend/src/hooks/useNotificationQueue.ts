import { useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

interface NotificationState {
  lastShown: number;
  pendingNotification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  } | null;
  timeoutId: NodeJS.Timeout | null;
}

export const useSmartNotification = () => {
  const stateRef = useRef<NotificationState>({
    lastShown: 0,
    pendingNotification: null,
    timeoutId: null
  });

  const MIN_INTERVAL = 3000; // 3 seconds minimum between notifications (like Uber/Lyft)
  const DEBOUNCE_DELAY = 500; // 500ms debounce for rapid clicks

  const showNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => {
    const now = Date.now();
    const timeSinceLastNotification = now - stateRef.current.lastShown;

    // If we have a pending notification, clear it
    if (stateRef.current.timeoutId) {
      clearTimeout(stateRef.current.timeoutId);
      stateRef.current.timeoutId = null;
    }

    // If enough time has passed since last notification, show immediately
    if (timeSinceLastNotification >= MIN_INTERVAL) {
      // Clear any existing notifications
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
      
      stateRef.current.lastShown = now;
      stateRef.current.pendingNotification = null;
    } else {
      // Not enough time has passed, debounce and queue the notification
      stateRef.current.pendingNotification = { type, message, duration };
      
      // Set a timeout to show the notification after the minimum interval
      const remainingTime = MIN_INTERVAL - timeSinceLastNotification;
      stateRef.current.timeoutId = setTimeout(() => {
        if (stateRef.current.pendingNotification) {
          const { type: pendingType, message: pendingMessage, duration: pendingDuration } = stateRef.current.pendingNotification;
          
          // Clear any existing notifications
          toast.dismiss();
          
          // Show the pending notification
          switch (pendingType) {
            case 'success':
              toast.success(pendingMessage, { autoClose: pendingDuration || 5000 });
              break;
            case 'error':
              toast.error(pendingMessage, { autoClose: pendingDuration || 5000 });
              break;
            case 'warning':
              toast.warn(pendingMessage, { autoClose: pendingDuration || 5000 });
              break;
            case 'info':
              toast.info(pendingMessage, { autoClose: pendingDuration || 5000 });
              break;
          }
          
          stateRef.current.lastShown = Date.now();
          stateRef.current.pendingNotification = null;
          stateRef.current.timeoutId = null;
        }
      }, remainingTime + DEBOUNCE_DELAY);
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
    // Clear any pending notifications
    if (stateRef.current.timeoutId) {
      clearTimeout(stateRef.current.timeoutId);
      stateRef.current.timeoutId = null;
    }
    stateRef.current.pendingNotification = null;
    
    // Clear displayed notifications
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
