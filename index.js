require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const { supabase, db, testConnection } = require('./models/supabase'); // Supabase connection
const SocketService = require('./services/socketService');
const cacheService = require('./services/cacheService');
const { 
  generalLimiter, 
  authLimiter, 
  bookingLimiter, 
  searchLimiter
} = require('./middleware/rateLimiting');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Make socket service available globally
global.socketService = socketService;

// Robust startup function
const startServer = async () => {
  try {
    console.log('🚀 Starting Parkway.com server...');
    
    // Initialize Redis Cache Service
    console.log('🔗 Initializing cache service...');
    await cacheService.initialize();
    
    // Database Connection - Supabase
    console.log('🔗 Connecting to Supabase...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Supabase');
    }
    
    console.log('✅ Supabase connection established');

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    // Don't exit on database errors in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://checkout.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://checkout.stripe.com", "ws://localhost:3000", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://checkout.stripe.com"],
      workerSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  permissionsPolicy: {
    geolocation: ["self"],
    microphone: [],
    camera: []
  }
}));

// CORS configuration for Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Local development
    'https://*.vercel.app', // Vercel preview deployments
    'https://parkwayai.vercel.app' // Your production Vercel domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting middleware
app.use('/api/', generalLimiter);

// Robust middleware setup with better error handling
app.use(express.json({ 
  extended: false,
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('JSON Parse Error:', e.message);
      console.error('Request body:', buf.toString());
      res.status(400).json({
        success: false,
        message: 'Invalid JSON format',
        error: e.message
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
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

    // Test Supabase connection
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        healthData.database = 'disconnected';
        healthData.databaseError = error.message;
      } else {
        healthData.database = 'connected';
      }
    } catch (dbError) {
      healthData.database = 'disconnected';
      healthData.databaseError = dbError.message;
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

// API-only backend - Frontend served by Vercel
console.log('🚀 Backend: API-only mode - Frontend served by Vercel');

// Define Routes - Supabase with rate limiting
app.use('/api/auth', authLimiter, require('./routes/authSupabase'));
app.use('/api/bookings', bookingLimiter, require('./routes/bookingsSupabase'));
app.use('/api/driveways', searchLimiter, require('./routes/drivewaysSupabase'));
// app.use('/api/payments', require('./routes/paymentsPG')); // TODO: Create Supabase version
// Temporarily disabled - requires node-geocoder dependency
// app.use('/api/geocoding', require('./routes/geocoding'));
// Temporarily disabled - requires cloudinary and sharp dependencies
// app.use('/api/upload', uploadLimiter, require('./routes/upload'));
app.use('/api/errors', require('./routes/errors')); // Add error reporting route
app.use('/api/notifications', require('./routes/notificationsSupabase')); // Add notifications route

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes (handled by individual route modules)

// API-only backend - Frontend served by Vercel
console.log('🚀 Backend: API-only mode - Frontend served by Vercel');

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close cache service
    cacheService.close()
      .then(() => console.log('✅ Cache service closed'))
      .catch(err => console.error('❌ Error closing cache service:', err));
    
    // Supabase connection doesn't need explicit closing
    console.log('✅ Supabase connection will be handled by the client');
    
    process.exit(0);
  });
};

// Start server with robust error handling
server.listen(PORT, async () => {
  console.log(`🌟 Parkway.com server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server initialized`);
  
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
