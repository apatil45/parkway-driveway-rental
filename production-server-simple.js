const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import database and models
const { sequelize, testConnection, syncDatabase } = require('./models');

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

// Basic security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/driveways', drivewayRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Parkway.com production server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Performance monitoring endpoint
app.get('/api/performance', async (req, res) => {
  try {
    const performanceData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      database: {
        connected: sequelize.authenticate ? true : false
      }
    };
    res.json(performanceData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to get performance data',
      error: error.message
    });
  }
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Handle React Router routes - serve index.html for all non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Skip static file requests (they should be handled by express.static)
    if (req.path.includes('.')) {
      return next();
    }
    
    // Serve index.html for all other routes (React Router will handle routing)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler - handle any remaining routes
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server function
async function startServer() {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }

    // Sync database (this will create tables if they don't exist)
    console.log('🔄 Syncing database...');
    const dbSynced = await syncDatabase();
    
    if (!dbSynced) {
      console.error('❌ Database sync failed. Exiting...');
      process.exit(1);
    }

    // Run migrations if needed
    console.log('🔄 Running database migrations...');
    try {
      const { runMigrations } = require('./scripts/migrate-simple');
      await runMigrations();
      console.log('✅ Database migrations completed');
    } catch (migrationError) {
      console.warn('⚠️  Migration failed, but continuing with deployment:', migrationError.message);
      // Don't exit on migration failure, let the app start
    }

    // Start the server
    server.listen(PORT, () => {
      console.log('🚀 Parkway.com Production Server Started!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Performance: http://localhost:${PORT}/api/performance`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log('🏗️  Serving static files from /public');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    sequelize.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    sequelize.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

// Start the server
startServer();

module.exports = app;
