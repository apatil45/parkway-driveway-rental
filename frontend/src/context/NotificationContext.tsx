import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Notification, { NotificationProps } from '../components/Notification';

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationData = {
      ...notification,
      id,
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const success = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration });
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-container">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              position: 'relative',
              zIndex: 10000 - index,
              marginBottom: index > 0 ? '0.5rem' : '0',
            }}
          >
            <Notification
              {...notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
