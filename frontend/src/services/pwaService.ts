// PWA Service for Parkway.com
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPrompt {
  event: BeforeInstallPromptEvent;
  show(): Promise<boolean>;
}

class PWAService {
  private installPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isOnline = navigator.onLine;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  private setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA: Install prompt available');
      e.preventDefault();
      this.installPrompt = {
        event: e as BeforeInstallPromptEvent,
        show: async () => {
          try {
            await this.installPrompt?.event.prompt();
            const choiceResult = await this.installPrompt?.event.userChoice;
            console.log('📱 PWA: User choice:', choiceResult?.outcome);
            return choiceResult?.outcome === 'accepted';
          } catch (error) {
            console.error('📱 PWA: Install prompt failed:', error);
            return false;
          }
        }
      };
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA: App installed successfully');
      this.isInstalled = true;
      this.installPrompt = null;
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 PWA: Back online');
      this.isOnline = true;
      this.notifyOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      console.log('🌐 PWA: Gone offline');
      this.isOnline = false;
      this.notifyOnlineStatus(false);
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 PWA: Service worker updated');
        window.location.reload();
      });
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 PWA: Service worker registered successfully');

        // Check for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 PWA: New version available');
                this.notifyUpdateAvailable();
              }
            });
          }
        });

      } catch (error) {
        console.error('❌ PWA: Service worker registration failed:', error);
      }
    }
  }

  // Public methods
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('📱 PWA: Install prompt not available');
      return false;
    }

    try {
      return await this.installPrompt.show();
    } catch (error) {
      console.error('📱 PWA: Failed to show install prompt:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return this.installPrompt !== null && !this.isInstalled;
  }

  isAppInstalled(): boolean {
    return this.isInstalled || window.matchMedia('(display-mode: standalone)').matches;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('📱 PWA: Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('📱 PWA: Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('📱 PWA: Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('📱 PWA: Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('📱 PWA: Push subscription created');
      return subscription;
    } catch (error) {
      console.error('📱 PWA: Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted' && this.registration) {
      try {
        await this.registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
      } catch (error) {
        console.error('📱 PWA: Failed to send notification:', error);
      }
    }
  }

  async updateServiceWorker() {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('🔄 PWA: Service worker update requested');
      } catch (error) {
        console.error('❌ PWA: Failed to update service worker:', error);
      }
    }
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private notifyOnlineStatus(online: boolean) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-online-status', { 
      detail: { online } 
    }));
  }

  private notifyUpdateAvailable() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  // Get PWA info
  getPWAInfo() {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isAppInstalled(),
      isOnline: this.isOnlineStatus(),
      hasServiceWorker: !!this.registration,
      notificationPermission: Notification.permission,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
  }
}

// Create singleton instance
const pwaService = new PWAService();
export default pwaService;
