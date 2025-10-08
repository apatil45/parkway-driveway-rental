import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { notificationApiService, Notification } from '../services/notificationApiService';
import './NotificationCenter.css';

const NotificationCenter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'payment' | 'system'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking at 123 Main Street has been confirmed for tomorrow at 2:00 PM.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionUrl: '/driver-dashboard?tab=bookings',
      actionText: 'View Booking',
      priority: 'high'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      message: 'You received $15.00 for your driveway rental at 456 Oak Avenue.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false,
      actionUrl: '/owner-dashboard?tab=analytics',
      actionText: 'View Earnings',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      priority: 'low'
    },
    {
      id: '4',
      type: 'warning',
      title: 'Booking Reminder',
      message: 'Your parking session at 789 Pine Street ends in 30 minutes.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      read: true,
      actionUrl: '/driver-dashboard?tab=bookings',
      actionText: 'Extend Booking',
      priority: 'high'
    },
    {
      id: '5',
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      actionUrl: '/profile',
      actionText: 'View Profile',
      priority: 'low'
    }
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationApiService.getNotifications();
      if (response.success) {
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = response.notifications.map(notification => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
        setNotifications(notificationsWithDates);
      } else {
        // Fallback to mock data if API fails
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to mock data if API fails
      setNotifications(mockNotifications);
      notificationService.showError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await notificationApiService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      notificationService.showError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationApiService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      notificationService.showError('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await notificationApiService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      notificationService.showError('Failed to delete notification');
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }
    
    return filtered.sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📅';
      case 'payment': return '💰';
      case 'system': return '⚙️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return '#2196F3';
      case 'payment': return '#4CAF50';
      case 'system': return '#9C27B0';
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#607D8B';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-center">
      {/* Notification Bell Button */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-read"
                  onClick={markAllAsRead}
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
              <button
                className="close-panel"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notification-filters">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'booking', label: 'Bookings', count: notifications.filter(n => n.type === 'booking').length },
              { key: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
              { key: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                className={`filter-tab ${filter === filterOption.key ? 'active' : ''}`}
                onClick={() => setFilter(filterOption.key as any)}
              >
                {filterOption.label}
                {filterOption.count > 0 && (
                  <span className="filter-count">{filterOption.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                >
                  <div className="notification-content">
                    <div className="notification-icon" style={{ backgroundColor: getNotificationColor(notification.type) }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-details">
                      <div className="notification-title">
                        {notification.title}
                        {!notification.read && <div className="unread-indicator"></div>}
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                        {notification.actionUrl && notification.actionText && (
                          <a href={notification.actionUrl} className="notification-action">
                            {notification.actionText}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="notification-controls">
                    {!notification.read && (
                      <button
                        className="mark-read"
                        onClick={() => markAsRead(notification.id)}
                        aria-label="Mark as read"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      </button>
                    )}
                    <button
                      className="delete-notification"
                      onClick={() => deleteNotification(notification.id)}
                      aria-label="Delete notification"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h4>No notifications</h4>
                <p>
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : `No ${filter === 'all' ? '' : filter} notifications found.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
