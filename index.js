const express = require('express');
const mongoose = require('mongoose');
const { sequelize, testConnection } = require('./models/database'); // PostgreSQL connection
const { setupAssociations } = require('./models/associations');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Robust startup function
const startServer = async () => {
  try {
    console.log('🚀 Starting Parkway.com server...');
    
    // Database Connection
    if (process.env.DATABASE_URL) {
      console.log('🔗 Connecting to PostgreSQL (Production)...');
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Failed to connect to PostgreSQL after retries');
      }
      
      // Setup model associations
      setupAssociations();
      
      // Sync database models
      console.log('📋 Synchronizing database models...');
      await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
      console.log('✅ Database models synchronized');
      
    } else if (process.env.MONGO_URI) {
      console.log('🔗 Connecting to MongoDB (Development)...');
      await mongoose.connect(process.env.MONGO_URI, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ MongoDB connected');
    } else {
      console.log('⚠️  No database connection configured. Please set DATABASE_URL or MONGO_URI.');
    }

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Robust middleware setup
app.use(express.json({ 
  extended: false,
  limit: '10mb'
}));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Define Routes (use PostgreSQL routes in production)
app.use('/api/driveways', process.env.DATABASE_URL ? require('./routes/drivewaysPG') : require('./routes/driveways'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/auth', process.env.DATABASE_URL ? require('./routes/authPG') : require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/geocoding', require('./routes/geocoding')); // New geocoding route

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes (handled by individual route modules)

// Serve frontend for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    if (process.env.DATABASE_URL) {
      sequelize.close()
        .then(() => console.log('✅ PostgreSQL connection closed'))
        .catch(err => console.error('❌ Error closing PostgreSQL:', err));
    }
    
    if (process.env.MONGO_URI) {
      mongoose.connection.close()
        .then(() => console.log('✅ MongoDB connection closed'))
        .catch(err => console.error('❌ Error closing MongoDB:', err));
    }
    
    process.exit(0);
  });
};

// Start server with robust error handling
const server = app.listen(PORT, async () => {
  console.log(`🌟 Parkway.com server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database connection
  await startServer();
  
  console.log('✅ Server fully initialized and ready to accept connections');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => process.exit(1));
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
