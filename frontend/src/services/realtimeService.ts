import { io, Socket } from 'socket.io-client';

interface RealtimeServiceConfig {
  serverUrl: string;
  onDrivewayUpdate?: (driveway: any) => void;
  onDrivewayAvailabilityChange?: (drivewayId: string, isAvailable: boolean) => void;
  onBookingUpdate?: (booking: any) => void;
  onError?: (error: any) => void;
}

class RealtimeService {
  private socket: Socket | null = null;
  private config: RealtimeServiceConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: RealtimeServiceConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket server...');
    
    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.subscribeToEvents();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.config.onError?.(error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.config.onError?.(error);
    });
  }

  private subscribeToEvents(): void {
    if (!this.socket) return;

    // Listen for driveway updates
    this.socket.on('driveway:updated', (data) => {
      console.log('🔄 Driveway updated:', data);
      this.config.onDrivewayUpdate?.(data);
    });

    // Listen for availability changes
    this.socket.on('driveway:availability_changed', (data) => {
      console.log('🔄 Driveway availability changed:', data);
      this.config.onDrivewayAvailabilityChange?.(data.drivewayId, data.isAvailable);
    });

    // Listen for booking updates
    this.socket.on('booking:created', (data) => {
      console.log('📅 New booking created:', data);
      this.config.onBookingUpdate?.(data);
    });

    this.socket.on('booking:updated', (data) => {
      console.log('📅 Booking updated:', data);
      this.config.onBookingUpdate?.(data);
    });

    this.socket.on('booking:cancelled', (data) => {
      console.log('❌ Booking cancelled:', data);
      this.config.onBookingUpdate?.(data);
    });

    // Join the general room for global updates
    this.socket.emit('join:general');
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to specific driveway updates
  subscribeToDriveway(drivewayId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join:driveway', drivewayId);
      console.log(`🔌 Subscribed to driveway ${drivewayId} updates`);
    }
  }

  // Unsubscribe from specific driveway updates
  unsubscribeFromDriveway(drivewayId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:driveway', drivewayId);
      console.log(`🔌 Unsubscribed from driveway ${drivewayId} updates`);
    }
  }

  // Subscribe to user's bookings
  subscribeToUserBookings(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join:user_bookings', userId);
      console.log(`🔌 Subscribed to user ${userId} booking updates`);
    }
  }

  // Unsubscribe from user's bookings
  unsubscribeFromUserBookings(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:user_bookings', userId);
      console.log(`🔌 Unsubscribed from user ${userId} booking updates`);
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance for custom events
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create a singleton instance
let realtimeServiceInstance: RealtimeService | null = null;

export const createRealtimeService = (config: RealtimeServiceConfig): RealtimeService => {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService(config);
  }
  return realtimeServiceInstance;
};

export const getRealtimeService = (): RealtimeService | null => {
  return realtimeServiceInstance;
};

export default RealtimeService;
