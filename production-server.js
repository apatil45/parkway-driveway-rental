const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import enhanced security middleware
const {
  helmetConfig,
  corsConfig,
  securityHeaders,
  validateRequest,
  securityMonitor,
  authLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter
} = require('./backend/src/middleware/security');

// Import database and models
const { sequelize, testConnection, syncDatabase } = require('./models');

// Import optimization utilities
const queryOptimizer = require('./backend/src/utils/queryOptimizer');
const databaseIndexManager = require('./backend/src/utils/databaseIndexes');

// Import routes
const authRoutes = require('./routes/auth');
const drivewayRoutes = require('./routes/driveways');
const bookingRoutes = require('./routes/bookings');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Enhanced security middleware
app.use(helmetConfig);
app.use(cors(corsConfig));
app.use(securityHeaders);
app.use(securityMonitor);
app.use(validateRequest);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/admin', strictLimiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/driveways', drivewayRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'OK',
      message: 'Parkway.com production server is running!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      database: dbStatus ? 'connected' : 'disconnected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server health check failed',
      error: error.message
    });
  }
});

// Performance monitoring endpoint
app.get('/api/performance', async (req, res) => {
  try {
    const [queryStats, dbPerformance] = await Promise.all([
      queryOptimizer.getPerformanceStats(),
      databaseIndexManager.getPerformanceSummary()
    ]);

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      queryPerformance: queryStats,
      databasePerformance: dbPerformance,
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Performance monitoring failed',
      error: error.message
    });
  }
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on('booking-created', (data) => {
    // Notify driveway owner about new booking
    socket.to(`owner-${data.drivewayOwnerId}`).emit('new-booking', data);
  });

  socket.on('booking-updated', (data) => {
    // Notify relevant users about booking updates
    socket.to(`user-${data.userId}`).emit('booking-status-changed', data);
    socket.to(`owner-${data.drivewayOwnerId}`).emit('booking-status-changed', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Server will start in limited mode.');
    }

    // Sync database and optimize
    if (dbConnected) {
      await syncDatabase();
      
      // Optimize database performance
      console.log('🚀 Optimizing database performance...');
      await databaseIndexManager.createAllIndexes();
      await databaseIndexManager.analyzeTables();
      await databaseIndexManager.optimizeDatabaseSettings();
      await queryOptimizer.optimizeConnectionPool();
      console.log('✅ Database optimization complete');
    }

    // Start HTTP server
    server.listen(PORT, () => {
      console.log('🚗 Parkway.com PRODUCTION server running on port', PORT);
      console.log('📱 Health check: http://localhost:' + PORT + '/api/health');
      console.log('✅ Registration: http://localhost:' + PORT + '/api/auth/register');
      console.log('✅ Login: http://localhost:' + PORT + '/api/auth/login');
      console.log('🏠 Driveways: http://localhost:' + PORT + '/api/driveways');
      console.log('📅 Bookings: http://localhost:' + PORT + '/api/bookings');
      console.log('🔒 Database:', dbConnected ? 'Connected' : 'Disconnected');
      console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
      console.log('⚡ Socket.io: Real-time features enabled');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = { app, server, io };
