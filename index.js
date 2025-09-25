const express = require('express');
const { sequelize, testConnection } = require('./models/database'); // PostgreSQL connection
const { setupAssociations } = require('./models/associations');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Robust startup function
const startServer = async () => {
  try {
    console.log('🚀 Starting Parkway.com server...');
    
    // Database Connection - PostgreSQL only
    if (process.env.DATABASE_URL) {
      console.log('🔗 Connecting to PostgreSQL...');
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Failed to connect to PostgreSQL after retries');
      }
      
      // Setup model associations
      setupAssociations();
      
      // Sync database models - force recreate to fix schema issues
      console.log('📋 Synchronizing database models...');
      await sequelize.sync({ 
        force: true, // Force recreate to fix column mapping issues
        alter: false
      });
      console.log('✅ Database models synchronized with correct schema');
      
    } else {
      console.log('⚠️  No database connection configured. Please set DATABASE_URL.');
      console.log('💡 This application requires PostgreSQL. MongoDB support has been removed.');
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

// Health check endpoint - Render compatible
app.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Test database connection if available
    if (process.env.DATABASE_URL) {
      try {
        await sequelize.authenticate();
        healthData.database = 'connected';
      } catch (dbError) {
        healthData.database = 'disconnected';
        healthData.databaseError = dbError.message;
      }
    }

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Define Routes - PostgreSQL only
app.use('/api/driveways', require('./routes/drivewaysPG'));
app.use('/api/bookings', require('./routes/bookingsPG'));
app.use('/api/auth', require('./routes/authPG'));
app.use('/api/payments', require('./routes/paymentsPG'));
app.use('/api/geocoding', require('./routes/geocoding'));
app.use('/api/upload', require('./routes/upload'));

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
    
    // Close database connection
    if (process.env.DATABASE_URL) {
      sequelize.close()
        .then(() => console.log('✅ PostgreSQL connection closed'))
        .catch(err => console.error('❌ Error closing PostgreSQL:', err));
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
