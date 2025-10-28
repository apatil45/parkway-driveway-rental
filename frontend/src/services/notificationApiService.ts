interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    booking: number;
    payment: number;
    system: number;
    warning: number;
    success: number;
    error: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationStatsResponse {
  success: boolean;
  stats: NotificationStats;
}

class NotificationApiService {
  private baseUrl = '/api/notifications';

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getNotifications(type?: string, unreadOnly?: boolean): Promise<NotificationResponse> {
    try {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (unreadOnly) params.append('unread_only', 'true');

      const queryString = params.toString();
      const endpoint = queryString ? `?${queryString}` : '';

      return await this.makeRequest<NotificationResponse>(endpoint);
    } catch (error) {
      console.warn('Notifications API not available:', error);
      // Return empty response instead of throwing
      return {
        success: false,
        notifications: [],
        error: 'Notifications service unavailable'
      };
    }
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>('/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async createNotification(notification: {
    userId?: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<{ success: boolean; notification: Notification; message: string }> {
    return this.makeRequest<{ success: boolean; notification: Notification; message: string }>('', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async getStats(): Promise<NotificationStatsResponse> {
    return this.makeRequest<NotificationStatsResponse>('/stats');
  }
}

export const notificationApiService = new NotificationApiService();
export type { Notification, NotificationStats };
