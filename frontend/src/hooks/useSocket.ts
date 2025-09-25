import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';
import { useSmartNotification } from './useNotificationQueue';

interface NotificationData {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'new_message' | 'availability_update' | 'general';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

interface MessageData {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  bookingId?: string;
  timestamp: string;
  type: 'chat';
}

interface BookingUpdate {
  bookingId: string;
  type: 'status_change' | 'payment_update' | 'time_change';
  status?: string;
  timestamp: string;
}

interface AvailabilityUpdate {
  drivewayId: string;
  type: 'slot_added' | 'slot_removed' | 'price_changed';
  timestamp: string;
}

export const useSocket = () => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const { success: showSuccess, error: showError, info: showInfo } = useSmartNotification();
  
  const notificationHandlersRef = useRef<(() => void)[]>([]);
  const messageHandlersRef = useRef<(() => void)[]>([]);
  const bookingUpdateHandlersRef = useRef<(() => void)[]>([]);
  const availabilityUpdateHandlersRef = useRef<(() => void)[]>([]);
  const connectionHandlerRef = useRef<(() => void) | null>(null);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user && token) {
      console.log('🔌 Connecting to WebSocket...');
      socketService.connect(token);
    } else {
      console.log('🔌 Disconnecting from WebSocket...');
      socketService.disconnect();
      setIsConnected(false);
    }

    return () => {
      // Cleanup on unmount
      notificationHandlersRef.current.forEach(cleanup => cleanup());
      messageHandlersRef.current.forEach(cleanup => cleanup());
      bookingUpdateHandlersRef.current.forEach(cleanup => cleanup());
      availabilityUpdateHandlersRef.current.forEach(cleanup => cleanup());
      if (connectionHandlerRef.current) {
        connectionHandlerRef.current();
      }
    };
  }, [user, token]);

  // Setup connection handler
  useEffect(() => {
    connectionHandlerRef.current = socketService.onConnection((connected) => {
      setIsConnected(connected);
      if (connected) {
        showInfo('Connected to real-time updates');
      } else {
        showError('Disconnected from real-time updates');
      }
    });

    return () => {
      if (connectionHandlerRef.current) {
        connectionHandlerRef.current();
      }
    };
  }, [showInfo, showError]);

  // Setup notification handler
  useEffect(() => {
    const cleanup = socketService.onNotification((notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
      
      // Show toast notification based on type
      switch (notification.type) {
        case 'booking_created':
          showSuccess(notification.message);
          break;
        case 'booking_confirmed':
          showSuccess(notification.message);
          break;
        case 'booking_cancelled':
          showError(notification.message);
          break;
        case 'new_message':
          showInfo(notification.message);
          break;
        case 'availability_update':
          showInfo(notification.message);
          break;
        default:
          showInfo(notification.message);
      }
    });

    notificationHandlersRef.current.push(cleanup);
    return cleanup;
  }, [showSuccess, showError, showInfo]);

  // Setup message handler
  useEffect(() => {
    const cleanup = socketService.onMessage((message: MessageData) => {
      setMessages(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 messages
    });

    messageHandlersRef.current.push(cleanup);
    return cleanup;
  }, []);

  // Setup booking update handler
  useEffect(() => {
    const cleanup = socketService.onBookingUpdate((update: BookingUpdate) => {
      // Handle booking updates
      console.log('Booking update received:', update);
      
      switch (update.type) {
        case 'status_change':
          showInfo(`Booking ${update.bookingId} status updated`);
          break;
        case 'payment_update':
          showSuccess(`Payment updated for booking ${update.bookingId}`);
          break;
        case 'time_change':
          showInfo(`Time changed for booking ${update.bookingId}`);
          break;
      }
    });

    bookingUpdateHandlersRef.current.push(cleanup);
    return cleanup;
  }, [showSuccess, showInfo]);

  // Setup availability update handler
  useEffect(() => {
    const cleanup = socketService.onAvailabilityUpdate((update: AvailabilityUpdate) => {
      // Handle availability updates
      console.log('Availability update received:', update);
      
      switch (update.type) {
        case 'slot_added':
          showInfo(`New availability added to driveway ${update.drivewayId}`);
          break;
        case 'slot_removed':
          showInfo(`Availability removed from driveway ${update.drivewayId}`);
          break;
        case 'price_changed':
          showInfo(`Price updated for driveway ${update.drivewayId}`);
          break;
      }
    });

    availabilityUpdateHandlersRef.current.push(cleanup);
    return cleanup;
  }, [showInfo]);

  // Public methods
  const joinBookingRoom = (bookingId: string) => {
    socketService.joinBookingRoom(bookingId);
  };

  const leaveBookingRoom = (bookingId: string) => {
    socketService.leaveBookingRoom(bookingId);
  };

  const joinChat = (otherUserId: string) => {
    socketService.joinChat(otherUserId);
  };

  const sendMessage = (recipientId: string, message: string, bookingId?: string) => {
    socketService.sendMessage(recipientId, message, bookingId);
  };

  const startTyping = (recipientId: string) => {
    socketService.startTyping(recipientId);
  };

  const stopTyping = (recipientId: string) => {
    socketService.stopTyping(recipientId);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    // Connection status
    isConnected,
    
    // Data
    notifications,
    messages,
    
    // Methods
    joinBookingRoom,
    leaveBookingRoom,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
    clearNotifications,
    clearMessages,
    
    // Utility
    isSocketConnected: socketService.isSocketConnected(),
    socketId: socketService.getSocketId()
  };
};
