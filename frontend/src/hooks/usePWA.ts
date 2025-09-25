import { useState, useEffect, useCallback } from 'react';
import pwaService from '../services/pwaService';

interface PWAInfo {
  canInstall: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  notificationPermission: NotificationPermission;
  userAgent: string;
  platform: string;
}

export const usePWA = () => {
  const [pwaInfo, setPwaInfo] = useState<PWAInfo>(pwaService.getPWAInfo());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Update PWA info when it changes
  useEffect(() => {
    const updatePWAInfo = () => {
      setPwaInfo(pwaService.getPWAInfo());
    };

    // Listen for online/offline status changes
    window.addEventListener('pwa-online-status', updatePWAInfo);
    
    // Listen for update availability
    window.addEventListener('pwa-update-available', () => {
      setShowUpdatePrompt(true);
    });

    // Initial update
    updatePWAInfo();

    return () => {
      window.removeEventListener('pwa-online-status', updatePWAInfo);
    };
  }, []);

  // Show install prompt when available
  useEffect(() => {
    if (pwaInfo.canInstall && !pwaInfo.isInstalled) {
      setShowInstallPrompt(true);
    }
  }, [pwaInfo.canInstall, pwaInfo.isInstalled]);

  // Install app
  const installApp = useCallback(async (): Promise<boolean> => {
    try {
      const success = await pwaService.showInstallPrompt();
      if (success) {
        setShowInstallPrompt(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to install app:', error);
      return false;
    }
  }, []);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  // Update app
  const updateApp = useCallback(async () => {
    try {
      await pwaService.updateServiceWorker();
      setShowUpdatePrompt(false);
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  }, []);

  // Dismiss update prompt
  const dismissUpdatePrompt = useCallback(() => {
    setShowUpdatePrompt(false);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await pwaService.requestNotificationPermission();
      setPwaInfo(pwaService.getPWAInfo());
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPushNotifications = useCallback(async () => {
    try {
      const subscription = await pwaService.subscribeToPushNotifications();
      if (subscription) {
        // Send subscription to your server
        console.log('Push subscription:', subscription);
        return subscription;
      }
      return null;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }, []);

  // Send notification
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    try {
      await pwaService.sendNotification(title, options);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, []);

  return {
    // State
    pwaInfo,
    showInstallPrompt,
    showUpdatePrompt,
    
    // Actions
    installApp,
    dismissInstallPrompt,
    updateApp,
    dismissUpdatePrompt,
    requestNotificationPermission,
    subscribeToPushNotifications,
    sendNotification,
    
    // Computed
    isInstallable: pwaInfo.canInstall && !pwaInfo.isInstalled,
    isOffline: !pwaInfo.isOnline,
    hasNotifications: pwaInfo.notificationPermission === 'granted'
  };
};
