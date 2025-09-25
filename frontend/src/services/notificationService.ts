/**
 * Professional Notification Service for Parkway.com
 * Provides contextual, non-spammy notifications with different types
 */

export interface NotificationConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'booking' | 'payment' | 'system';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  context?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

class NotificationService {
  private notifications: Map<string, NotificationConfig> = new Map();
  private maxNotifications = 3;
  private notificationQueue: NotificationConfig[] = [];
  private isProcessing = false;

  // Context-based notification rules
  private contextRules = {
    'auth': { maxPerMinute: 2, cooldown: 5000 },
    'booking': { maxPerMinute: 3, cooldown: 3000 },
    'payment': { maxPerMinute: 2, cooldown: 7000 },
    'upload': { maxPerMinute: 2, cooldown: 4000 },
    'search': { maxPerMinute: 5, cooldown: 1000 },
    'system': { maxPerMinute: 1, cooldown: 10000 }
  };

  private lastNotificationTime: Map<string, number> = new Map();

  /**
   * Show a contextual notification based on the situation
   */
  showNotification(config: Omit<NotificationConfig, 'id'>): string {
    const id = this.generateId();
    const fullConfig: NotificationConfig = {
      id,
      duration: this.getDefaultDuration(config.type),
      persistent: false,
      priority: 'medium',
      context: 'general',
      ...config
    };

    // Check if we should show this notification based on context rules
    if (!this.shouldShowNotification(fullConfig)) {
      return id;
    }

    // Add to queue if we're at max notifications
    if (this.notifications.size >= this.maxNotifications) {
      this.notificationQueue.push(fullConfig);
      return id;
    }

    this.displayNotification(fullConfig);
    return id;
  }

  /**
   * Context-specific notification methods
   */
  
  // Authentication notifications
  showAuthSuccess(message: string, title = 'Welcome!') {
    return this.showNotification({
      type: 'success',
      title,
      message,
      context: 'auth',
      priority: 'high'
    });
  }

  showAuthError(message: string, title = 'Authentication Error') {
    return this.showNotification({
      type: 'error',
      title,
      message,
      context: 'auth',
      priority: 'high',
      duration: 8000
    });
  }

  // Booking notifications
  showBookingSuccess(message: string, title = 'Booking Confirmed!') {
    return this.showNotification({
      type: 'booking',
      title,
      message,
      context: 'booking',
      priority: 'high',
      duration: 6000
    });
  }

  showBookingError(message: string, title = 'Booking Issue') {
    return this.showNotification({
      type: 'error',
      title,
      message,
      context: 'booking',
      priority: 'high',
      duration: 8000
    });
  }

  showBookingUpdate(message: string, title = 'Booking Update') {
    return this.showNotification({
      type: 'info',
      title,
      message,
      context: 'booking',
      priority: 'medium',
      duration: 5000
    });
  }

  // Payment notifications
  showPaymentSuccess(message: string, title = 'Payment Successful!') {
    return this.showNotification({
      type: 'payment',
      title,
      message,
      context: 'payment',
      priority: 'high',
      duration: 7000
    });
  }

  showPaymentError(message: string, title = 'Payment Failed') {
    return this.showNotification({
      type: 'error',
      title,
      message,
      context: 'payment',
      priority: 'critical',
      duration: 10000,
      persistent: true
    });
  }

  // Upload notifications
  showUploadSuccess(count: number, title = 'Images Uploaded!') {
    const message = count === 1 
      ? 'Your image has been uploaded successfully'
      : `${count} images have been uploaded successfully`;
    
    return this.showNotification({
      type: 'success',
      title,
      message,
      context: 'upload',
      priority: 'medium',
      duration: 4000
    });
  }

  showUploadError(message: string, title = 'Upload Failed') {
    return this.showNotification({
      type: 'error',
      title,
      message,
      context: 'upload',
      priority: 'high',
      duration: 6000
    });
  }

  showUploadProgress(progress: number, title = 'Uploading...') {
    return this.showNotification({
      type: 'info',
      title,
      message: `Upload progress: ${progress}%`,
      context: 'upload',
      priority: 'low',
      duration: 2000
    });
  }

  // Search notifications
  showSearchResults(count: number, title = 'Search Results') {
    const message = count === 0 
      ? 'No driveways found matching your criteria'
      : `Found ${count} driveway${count === 1 ? '' : 's'} matching your search`;
    
    return this.showNotification({
      type: 'info',
      title,
      message,
      context: 'search',
      priority: 'low',
      duration: 3000
    });
  }

  // System notifications
  showSystemInfo(message: string, title = 'System Notice') {
    return this.showNotification({
      type: 'system',
      title,
      message,
      context: 'system',
      priority: 'medium',
      duration: 5000
    });
  }

  showSystemWarning(message: string, title = 'System Warning') {
    return this.showNotification({
      type: 'warning',
      title,
      message,
      context: 'system',
      priority: 'high',
      duration: 7000
    });
  }

  // Connection notifications
  showConnectionStatus(connected: boolean) {
    if (connected) {
      return this.showNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates are active',
        context: 'system',
        priority: 'low',
        duration: 3000
      });
    } else {
      return this.showNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'Attempting to reconnect...',
        context: 'system',
        priority: 'medium',
        duration: 5000
      });
    }
  }

  /**
   * Smart notification display logic
   */
  private shouldShowNotification(config: NotificationConfig): boolean {
    const context = config.context || 'general';
    const rule = this.contextRules[context as keyof typeof this.contextRules];
    
    if (!rule) return true;

    const now = Date.now();
    const lastTime = this.lastNotificationTime.get(context) || 0;
    
    // Check cooldown period
    if (now - lastTime < rule.cooldown) {
      return false;
    }

    this.lastNotificationTime.set(context, now);
    return true;
  }

  private getDefaultDuration(type: string): number {
    const durations = {
      'success': 4000,
      'error': 7000,
      'warning': 6000,
      'info': 4000,
      'booking': 6000,
      'payment': 7000,
      'system': 5000
    };
    return durations[type as keyof typeof durations] || 4000;
  }

  private displayNotification(config: NotificationConfig) {
    this.notifications.set(config.id, config);
    
    // Emit custom event for the notification component
    const event = new CustomEvent('parkway-notification', {
      detail: config
    });
    window.dispatchEvent(event);

    // Auto-remove after duration (unless persistent)
    if (!config.persistent && config.duration) {
      setTimeout(() => {
        this.removeNotification(config.id);
      }, config.duration);
    }
  }

  private removeNotification(id: string) {
    this.notifications.delete(id);
    
    // Emit removal event
    const event = new CustomEvent('parkway-notification-remove', {
      detail: { id }
    });
    window.dispatchEvent(event);

    // Process queue if there are pending notifications
    this.processQueue();
  }

  private processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    // Process one notification from queue
    const nextNotification = this.notificationQueue.shift();
    if (nextNotification && this.notifications.size < this.maxNotifications) {
      this.displayNotification(nextNotification);
    }
    
    this.isProcessing = false;
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for manual control
  removeNotification(id: string) {
    this.removeNotification(id);
  }

  clearAllNotifications() {
    this.notifications.clear();
    this.notificationQueue = [];
    
    const event = new CustomEvent('parkway-notification-clear');
    window.dispatchEvent(event);
  }

  getActiveNotifications(): NotificationConfig[] {
    return Array.from(this.notifications.values());
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
