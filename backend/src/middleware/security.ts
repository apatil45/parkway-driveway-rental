// Enhanced Security Middleware for Parkway.com
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Enhanced Helmet configuration
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://maps.googleapis.com",
        "https://unpkg.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://images.unsplash.com",
        "https://res.cloudinary.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://maps.googleapis.com",
        "wss:",
        "ws:"
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Expect CT
  expectCt: {
    maxAge: 86400,
    enforce: true
  },

  // Feature Policy (now Permissions Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: ["'self'"],
    payment: ["'self'"],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
    ambientLightSensor: [],
    autoplay: [],
    battery: [],
    displayCapture: [],
    documentDomain: [],
    encryptedMedia: [],
    executionWhileNotRendered: [],
    executionWhileOutOfViewport: [],
    fullscreen: ["'self'"],
    layoutAnimations: [],
    legacyImageFormats: [],
    midi: [],
    oversizedImages: [],
    pictureInPicture: [],
    publickeyCredentialsGet: [],
    syncXhr: [],
    unoptimizedImages: [],
    unsizedMedia: [],
    verticalScroll: [],
    wakeLock: [],
    webShare: [],
    xrSpatialTracking: []
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS Filter
  xssFilter: true
});

// Rate limiting configurations
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(options.windowMs / 1000)
      });
    }
  });
};

// Specific rate limiters
export const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true
});

export const apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again after 15 minutes.'
});

export const strictLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: 'Rate limit exceeded, please slow down your requests.'
});

export const uploadLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again after 1 hour.'
});

// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://parkway-driveway-rental.vercel.app',
      'https://parkway-driveway-rental-git-main-apatil45.vercel.app'
    ];

    // Add production domains
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        'https://parkway-driveway-rental.vercel.app',
        'https://parkway.com',
        'https://www.parkway.com'
      );
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Add server identification
  res.setHeader('Server', 'Parkway-API/1.0.0');

  // Add cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /expression\(/i,
    /url\(/i,
    /@import/i,
    /\.\.\//,
    /\.\.\\/,
    /union.*select/i,
    /select.*from/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i,
    /update.*set/i
  ];

  const checkString = (str: string) => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  // Check URL parameters
  if (checkString(req.url)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request parameters'
    });
  }

  // Check request body
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    if (checkString(bodyStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body'
      });
    }
  }

  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    const queryStr = JSON.stringify(req.query);
    if (checkString(queryStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters'
      });
    }
  }

  next();
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.includes(clientIP || '')) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
  };
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseInt(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }

    next();
  };
};

// Security monitoring middleware
export const securityMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  // Log suspicious requests
  if (req.url.includes('..') || req.url.includes('<script') || req.url.includes('union')) {
    console.warn(`🚨 Suspicious request detected: ${req.method} ${req.url} from ${clientIP}`);
  }

  // Monitor for potential attacks
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => req.get(header));

  if (hasSuspiciousHeaders && !req.get('x-forwarded-for')) {
    console.warn(`🚨 Potential IP spoofing attempt from ${clientIP}`);
  }

  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log slow requests
    if (duration > 5000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }

    // Log error responses
    if (statusCode >= 400) {
      console.warn(`❌ Error response: ${statusCode} for ${req.method} ${req.url} from ${clientIP}`);
    }
  });

  next();
};

export default {
  helmetConfig,
  corsConfig,
  securityHeaders,
  validateRequest,
  ipWhitelist,
  requestSizeLimiter,
  securityMonitor,
  createRateLimit,
  authLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter
};
