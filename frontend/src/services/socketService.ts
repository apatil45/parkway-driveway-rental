import { io, Socket } from 'socket.io-client';
import { notificationService } from './notificationService';

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

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced from 5 to 3
  private reconnectDelay = 5000; // Increased from 1 second to 5 seconds
  private token: string | null = null;

  // Event handlers
  private notificationHandlers: ((notification: NotificationData) => void)[] = [];
  private messageHandlers: ((message: MessageData) => void)[] = [];
  private bookingUpdateHandlers: ((update: BookingUpdate) => void)[] = [];
  private availabilityUpdateHandlers: ((update: AvailabilityUpdate) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  constructor() {
    this.setupEventListeners();
  }

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.token = token;
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? 'https://parkway-app.onrender.com'
      : 'http://localhost:3000';

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupSocketEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
    }
  }

  private setupSocketEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
      this.attemptReconnect();
    });

    // Notification events
    this.socket.on('notification', (notification: NotificationData) => {
      console.log('📢 Received notification:', notification);
      this.notifyNotificationHandlers(notification);
    });

    // Chat events
    this.socket.on('new_message', (message: MessageData) => {
      console.log('💬 Received message:', message);
      this.notifyMessageHandlers(message);
    });

    this.socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      // Handle typing indicators
      console.log('⌨️ User typing:', data);
    });

    // Booking events
    this.socket.on('booking_update', (update: BookingUpdate) => {
      console.log('📋 Received booking update:', update);
      this.notifyBookingUpdateHandlers(update);
    });

    // Availability events
    this.socket.on('availability_update', (update: AvailabilityUpdate) => {
      console.log('🏠 Received availability update:', update);
      this.notifyAvailabilityUpdateHandlers(update);
    });

    // Role notifications
    this.socket.on('role_notification', (notification: NotificationData) => {
      console.log('📢 Received role notification:', notification);
      this.notifyNotificationHandlers(notification);
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔌 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  private setupEventListeners() {
    // Setup global event listeners for browser events
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });

    window.addEventListener('focus', () => {
      if (this.token && !this.isConnected) {
        this.connect(this.token);
      }
    });
  }

  // Public methods for sending events
  joinBookingRoom(bookingId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_booking_room', bookingId);
    }
  }

  leaveBookingRoom(bookingId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_booking_room', bookingId);
    }
  }

  joinChat(otherUserId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_chat', otherUserId);
    }
  }

  sendMessage(recipientId: string, message: string, bookingId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        recipientId,
        message,
        bookingId
      });
    }
  }

  startTyping(recipientId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { recipientId });
    }
  }

  stopTyping(recipientId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { recipientId });
    }
  }

  // Event handler registration
  onNotification(handler: (notification: NotificationData) => void) {
    this.notificationHandlers.push(handler);
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  onMessage(handler: (message: MessageData) => void) {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onBookingUpdate(handler: (update: BookingUpdate) => void) {
    this.bookingUpdateHandlers.push(handler);
    return () => {
      const index = this.bookingUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.bookingUpdateHandlers.splice(index, 1);
      }
    };
  }

  onAvailabilityUpdate(handler: (update: AvailabilityUpdate) => void) {
    this.availabilityUpdateHandlers.push(handler);
    return () => {
      const index = this.availabilityUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.availabilityUpdateHandlers.splice(index, 1);
      }
    };
  }

  onConnection(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  // Private notification methods
  private notifyNotificationHandlers(notification: NotificationData) {
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }

  private notifyMessageHandlers(message: MessageData) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyBookingUpdateHandlers(update: BookingUpdate) {
    this.bookingUpdateHandlers.forEach(handler => {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in booking update handler:', error);
      }
    });
  }

  private notifyAvailabilityUpdateHandlers(update: AvailabilityUpdate) {
    this.availabilityUpdateHandlers.forEach(handler => {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in availability update handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
