/**
 * Offline Service for basic data persistence and offline support
 */

interface OfflineData {
  [key: string]: any;
}

class OfflineService {
  private readonly STORAGE_KEY = 'parkway_offline_data';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

  /**
   * Check if browser supports localStorage
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get stored offline data
   */
  getOfflineData(): OfflineData {
    if (!this.isStorageAvailable()) {
      return {};
    }

    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return {};
    }
  }

  /**
   * Save data offline
   */
  saveOfflineData(key: string, data: any): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now()
      };

      // Check storage size
      const dataString = JSON.stringify(offlineData);
      if (dataString.length > this.MAX_STORAGE_SIZE) {
        console.warn('Offline storage limit exceeded');
        this.cleanupOldData(offlineData);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData));
      return true;
    } catch (error) {
      console.error('Failed to save offline data:', error);
      return false;
    }
  }

  /**
   * Get specific offline data by key
   */
  getOfflineDataByKey(key: string): any | null {
    const offlineData = this.getOfflineData();
    const item = offlineData[key];
    
    if (!item) return null;

    // Check if data is expired (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - item.timestamp > maxAge) {
      this.removeOfflineData(key);
      return null;
    }

    return item.data;
  }

  /**
   * Remove specific offline data
   */
  removeOfflineData(key: string): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const offlineData = this.getOfflineData();
      delete offlineData[key];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData));
      return true;
    } catch (error) {
      console.error('Failed to remove offline data:', error);
      return false;
    }
  }

  /**
   * Clear all offline data
   */
  clearAllOfflineData(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }

  /**
   * Clean up old data to make room
   */
  private cleanupOldData(offlineData: OfflineData): void {
    const entries = Object.entries(offlineData);
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of data
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      delete offlineData[entries[i][0]];
    }
  }

  /**
   * Save form data offline for recovery
   */
  saveFormData(formName: string, formData: any): boolean {
    return this.saveOfflineData(`form_${formName}`, formData);
  }

  /**
   * Get saved form data
   */
  getFormData(formName: string): any | null {
    return this.getOfflineDataByKey(`form_${formName}`);
  }

  /**
   * Save booking data offline for retry
   */
  saveBookingData(bookingData: any): boolean {
    const bookings = this.getOfflineDataByKey('pending_bookings') || [];
    bookings.push({
      ...bookingData,
      id: `offline_${Date.now()}`,
      timestamp: Date.now()
    });
    return this.saveOfflineData('pending_bookings', bookings);
  }

  /**
   * Get pending bookings
   */
  getPendingBookings(): any[] {
    return this.getOfflineDataByKey('pending_bookings') || [];
  }

  /**
   * Remove booking from pending list
   */
  removePendingBooking(bookingId: string): boolean {
    const bookings = this.getPendingBookings();
    const filteredBookings = bookings.filter(booking => booking.id !== bookingId);
    return this.saveOfflineData('pending_bookings', filteredBookings);
  }

  /**
   * Save driveway data offline for retry
   */
  saveDrivewayData(drivewayData: any): boolean {
    const driveways = this.getOfflineDataByKey('pending_driveways') || [];
    driveways.push({
      ...drivewayData,
      id: `offline_${Date.now()}`,
      timestamp: Date.now()
    });
    return this.saveOfflineData('pending_driveways', driveways);
  }

  /**
   * Get pending driveways
   */
  getPendingDriveways(): any[] {
    return this.getOfflineDataByKey('pending_driveways') || [];
  }

  /**
   * Remove driveway from pending list
   */
  removePendingDriveway(drivewayId: string): boolean {
    const driveways = this.getPendingDriveways();
    const filteredDriveways = driveways.filter(driveway => driveway.id !== drivewayId);
    return this.saveOfflineData('pending_driveways', filteredDriveways);
  }

  /**
   * Check if user is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get network status
   */
  getNetworkStatus(): {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    };
  }

  /**
   * Retry pending operations when back online
   */
  async retryPendingOperations(): Promise<void> {
    if (!this.isOnline()) return;

    const pendingBookings = this.getPendingBookings();
    const pendingDriveways = this.getPendingDriveways();

    // Retry pending bookings
    for (const booking of pendingBookings) {
      try {
        // This would integrate with the robust booking service
        console.log('Retrying booking:', booking);
        // await robustBookingService.createBooking(booking);
        this.removePendingBooking(booking.id);
      } catch (error) {
        console.error('Failed to retry booking:', error);
      }
    }

    // Retry pending driveways
    for (const driveway of pendingDriveways) {
      try {
        // This would integrate with the robust driveway service
        console.log('Retrying driveway:', driveway);
        // await robustDrivewayService.createDriveway(driveway);
        this.removePendingDriveway(driveway.id);
      } catch (error) {
        console.error('Failed to retry driveway:', error);
      }
    }
  }
}

export const offlineService = new OfflineService();
