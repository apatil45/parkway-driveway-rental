/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and ensures fair usage
 */

const rateLimit = require('express-rate-limit');
const { cacheService } = require('../services/cacheService');

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // Higher limit in development
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the authentication rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Moderate rate limiter for booking endpoints
 */
const bookingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many booking requests from this IP, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many booking requests',
      message: 'You have exceeded the booking rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Search rate limiter for driveway search endpoints
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: {
    error: 'Too many search requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many search requests',
      message: 'You have exceeded the search rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Upload rate limiter for file upload endpoints
 */
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 uploads per 10 minutes
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many upload requests',
      message: 'You have exceeded the upload rate limit. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicLimiter = (req, res, next) => {
  // Get user role from request (if authenticated)
  const userRole = req.user?.roles || [];
  
  let limiter;
  
  if (userRole.includes('admin')) {
    // Admins get higher limits
    limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      message: { error: 'Admin rate limit exceeded' }
    });
  } else if (userRole.includes('owner')) {
    // Owners get moderate limits
    limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: { error: 'Owner rate limit exceeded' }
    });
  } else {
    // Regular users get standard limits
    limiter = generalLimiter;
  }
  
  return limiter(req, res, next);
};

/**
 * IP-based rate limiter with whitelist
 */
const createIPLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    whitelist = [],
    message = 'Rate limit exceeded'
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs
      return whitelist.includes(req.ip);
    }
  });
};

/**
 * Rate limiter with Redis store for distributed systems
 */
const createRedisLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Rate limit exceeded'
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Use Redis store if available
    store: cacheService.isConnected ? {
      incr: async (key, cb) => {
        try {
          const current = await cacheService.get(key) || 0;
          const newValue = current + 1;
          await cacheService.set(key, newValue, Math.ceil(windowMs / 1000));
          cb(null, newValue, Date.now() + windowMs);
        } catch (error) {
          cb(error);
        }
      },
      decrement: async (key, cb) => {
        try {
          const current = await cacheService.get(key) || 0;
          const newValue = Math.max(0, current - 1);
          await cacheService.set(key, newValue, Math.ceil(windowMs / 1000));
          cb(null, newValue);
        } catch (error) {
          cb(error);
        }
      },
      resetKey: async (key, cb) => {
        try {
          await cacheService.del(key);
          cb(null);
        } catch (error) {
          cb(error);
        }
      }
    } : undefined
  });
};

/**
 * Rate limiter for specific endpoints with custom logic
 */
const endpointLimiter = (endpoint, options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: `Rate limit exceeded for ${endpoint}`
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
    keyGenerator: (req) => {
      // Include endpoint in the key for endpoint-specific limiting
      return `${endpoint}:${req.ip}`;
    }
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  bookingLimiter,
  searchLimiter,
  uploadLimiter,
  dynamicLimiter,
  createIPLimiter,
  createRedisLimiter,
  endpointLimiter
};
