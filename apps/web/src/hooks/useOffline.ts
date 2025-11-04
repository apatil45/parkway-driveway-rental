/**
 * Offline Detection Hook
 * Detects when user goes offline and provides status
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      showToast('Connection restored. You are back online.', 'success', 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      showToast(
        'You are currently offline. Some features may not work until you reconnect.',
        'warning',
        8000
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  return { isOffline };
}

