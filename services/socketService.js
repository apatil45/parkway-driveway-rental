const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://parkway-app.onrender.com', 'https://parkway-driveway-rental.vercel.app']
          : ['http://localhost:3000', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userRooms = new Map(); // userId -> room names mapping
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.user.id;
        socket.userRoles = decoded.user.roles || ['driver'];
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.userId} connected via socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user to their personal room
      const userRoom = `user_${socket.userId}`;
      socket.join(userRoom);
      this.userRooms.set(socket.userId, userRoom);

      // Join user to role-based rooms
      socket.userRoles.forEach(role => {
        const roleRoom = `role_${role}`;
        socket.join(roleRoom);
      });

      // Handle general room joining
      socket.on('join:general', () => {
        socket.join('general');
        console.log(`🌐 User ${socket.userId} joined general room`);
      });

      // Handle driveway-specific subscriptions
      socket.on('join:driveway', (drivewayId) => {
        const drivewayRoom = `driveway_${drivewayId}`;
        socket.join(drivewayRoom);
        console.log(`🏠 User ${socket.userId} joined driveway room ${drivewayId}`);
      });

      socket.on('leave:driveway', (drivewayId) => {
        const drivewayRoom = `driveway_${drivewayId}`;
        socket.leave(drivewayRoom);
        console.log(`🏠 User ${socket.userId} left driveway room ${drivewayId}`);
      });

      // Handle user booking subscriptions
      socket.on('join:user_bookings', (userId) => {
        const userBookingsRoom = `user_bookings_${userId}`;
        socket.join(userBookingsRoom);
        console.log(`📅 User ${socket.userId} joined user bookings room for ${userId}`);
      });

      socket.on('leave:user_bookings', (userId) => {
        const userBookingsRoom = `user_bookings_${userId}`;
        socket.leave(userBookingsRoom);
        console.log(`📅 User ${socket.userId} left user bookings room for ${userId}`);
      });

      // Handle booking events
      socket.on('join_booking_room', (bookingId) => {
        const bookingRoom = `booking_${bookingId}`;
        socket.join(bookingRoom);
        console.log(`📋 User ${socket.userId} joined booking room ${bookingId}`);
      });

      socket.on('leave_booking_room', (bookingId) => {
        const bookingRoom = `booking_${bookingId}`;
        socket.leave(bookingRoom);
        console.log(`📋 User ${socket.userId} left booking room ${bookingId}`);
      });

      // Handle chat events
      socket.on('join_chat', (otherUserId) => {
        const chatRoom = this.getChatRoom(socket.userId, otherUserId);
        socket.join(chatRoom);
        console.log(`💬 User ${socket.userId} joined chat with ${otherUserId}`);
      });

      socket.on('send_message', (data) => {
        const { recipientId, message, bookingId } = data;
        const chatRoom = this.getChatRoom(socket.userId, recipientId);
        
        const messageData = {
          id: Date.now().toString(),
          senderId: socket.userId,
          recipientId,
          message,
          bookingId,
          timestamp: new Date().toISOString(),
          type: 'chat'
        };

        // Send to chat room
        this.io.to(chatRoom).emit('new_message', messageData);
        
        // Send notification to recipient if not in chat
        this.sendNotification(recipientId, {
          type: 'new_message',
          title: 'New Message',
          message: `You have a new message`,
          data: { bookingId, senderId: socket.userId }
        });

        console.log(`💬 Message sent from ${socket.userId} to ${recipientId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { recipientId } = data;
        const chatRoom = this.getChatRoom(socket.userId, recipientId);
        socket.to(chatRoom).emit('user_typing', { userId: socket.userId, isTyping: true });
      });

      socket.on('typing_stop', (data) => {
        const { recipientId } = data;
        const chatRoom = this.getChatRoom(socket.userId, recipientId);
        socket.to(chatRoom).emit('user_typing', { userId: socket.userId, isTyping: false });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.userRooms.delete(socket.userId);
      });
    });
  }

  // Public methods for sending notifications
  sendNotification(userId, notification) {
    const userRoom = this.userRooms.get(userId);
    if (userRoom) {
      this.io.to(userRoom).emit('notification', {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
      console.log(`📢 Notification sent to user ${userId}:`, notification.type);
    } else {
      console.log(`⚠️ User ${userId} not connected, notification queued`);
      // In a real app, you'd queue this for when they reconnect
    }
  }

  sendBookingUpdate(bookingId, update) {
    const bookingRoom = `booking_${bookingId}`;
    this.io.to(bookingRoom).emit('booking_update', {
      bookingId,
      ...update,
      timestamp: new Date().toISOString()
    });
    console.log(`📋 Booking update sent for booking ${bookingId}:`, update.type);
  }

  sendAvailabilityUpdate(drivewayId, update) {
    const drivewayRoom = `driveway_${drivewayId}`;
    this.io.to(drivewayRoom).emit('availability_update', {
      drivewayId,
      ...update,
      timestamp: new Date().toISOString()
    });
    console.log(`🏠 Availability update sent for driveway ${drivewayId}:`, update.type);
  }

  // New real-time update methods
  broadcastDrivewayUpdate(driveway) {
    // Send to general room for all users
    this.io.to('general').emit('driveway:updated', {
      ...driveway,
      timestamp: new Date().toISOString()
    });
    
    // Send to specific driveway room
    const drivewayRoom = `driveway_${driveway.id}`;
    this.io.to(drivewayRoom).emit('driveway:updated', {
      ...driveway,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🔄 Driveway update broadcasted for ${driveway.id}`);
  }

  broadcastAvailabilityChange(drivewayId, isAvailable) {
    // Send to general room for all users
    this.io.to('general').emit('driveway:availability_changed', {
      drivewayId,
      isAvailable,
      timestamp: new Date().toISOString()
    });
    
    // Send to specific driveway room
    const drivewayRoom = `driveway_${drivewayId}`;
    this.io.to(drivewayRoom).emit('driveway:availability_changed', {
      drivewayId,
      isAvailable,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🔄 Availability change broadcasted for driveway ${drivewayId}: ${isAvailable}`);
  }

  broadcastBookingUpdate(booking, eventType = 'updated') {
    // Send to general room for all users
    this.io.to('general').emit(`booking:${eventType}`, {
      ...booking,
      timestamp: new Date().toISOString()
    });
    
    // Send to user's booking room
    const userBookingsRoom = `user_bookings_${booking.userId}`;
    this.io.to(userBookingsRoom).emit(`booking:${eventType}`, {
      ...booking,
      timestamp: new Date().toISOString()
    });
    
    // Send to specific booking room
    const bookingRoom = `booking_${booking.id}`;
    this.io.to(bookingRoom).emit(`booking:${eventType}`, {
      ...booking,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📅 Booking ${eventType} broadcasted for booking ${booking.id}`);
  }

  broadcastToRole(role, notification) {
    const roleRoom = `role_${role}`;
    this.io.to(roleRoom).emit('role_notification', {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    console.log(`📢 Role notification sent to ${role}:`, notification.type);
  }

  // Helper methods
  getChatRoom(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get socket instance for external use
  getIO() {
    return this.io;
  }
}

module.exports = SocketService;
