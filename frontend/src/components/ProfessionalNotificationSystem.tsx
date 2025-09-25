import React, { useState, useEffect } from 'react';
import { notificationService, NotificationConfig } from '../services/notificationService';
import './ProfessionalNotificationSystem.css';

interface NotificationProps {
  notification: NotificationConfig;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'booking':
        return '📅';
      case 'payment':
        return '💳';
      case 'system':
        return '🔧';
      default:
        return '📢';
    }
  };

  const getPriorityClass = () => {
    switch (notification.priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  return (
    <div 
      className={`notification-item ${notification.type} ${getPriorityClass()} ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''}`}
      onClick={handleRemove}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <div className="notification-title">
            {notification.title}
          </div>
          <div className="notification-message">
            {notification.message}
          </div>
        </div>
        <button 
          className="notification-close"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      
      {notification.actions && notification.actions.length > 0 && (
        <div className="notification-actions">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              className={`action-button ${action.style || 'secondary'}`}
              onClick={(e) => {
                e.stopPropagation();
                action.action();
                handleRemove();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {!notification.persistent && (
        <div className="notification-progress">
          <div 
            className="progress-bar"
            style={{
              animationDuration: `${notification.duration || 4000}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};

const ProfessionalNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as NotificationConfig;
      setNotifications(prev => [...prev, notification]);
    };

    const handleRemoveNotification = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleClearNotifications = () => {
      setNotifications([]);
    };

    // Listen for notification events
    window.addEventListener('parkway-notification', handleNewNotification as EventListener);
    window.addEventListener('parkway-notification-remove', handleRemoveNotification as EventListener);
    window.addEventListener('parkway-notification-clear', handleClearNotifications);

    return () => {
      window.removeEventListener('parkway-notification', handleNewNotification as EventListener);
      window.removeEventListener('parkway-notification-remove', handleRemoveNotification as EventListener);
      window.removeEventListener('parkway-notification-clear', handleClearNotifications);
    };
  }, []);

  const handleRemove = (id: string) => {
    notificationService.removeNotification(id);
  };

  // Group notifications by priority for better stacking
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const priority = notification.priority || 'medium';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(notification);
    return acc;
  }, {} as Record<string, NotificationConfig[]>);

  const priorityOrder = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="professional-notification-system">
      {priorityOrder.map(priority => 
        groupedNotifications[priority]?.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={handleRemove}
          />
        ))
      )}
    </div>
  );
};

export default ProfessionalNotificationSystem;
