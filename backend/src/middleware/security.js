const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const httpStatus = require('http-status-codes');

// --- Helmet Configuration ---
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://maps.gstatic.com", "https://*.googleapis.com", "https://*.ggpht.com"],
      connectSrc: ["'self'", "ws://localhost:3000", "wss://your-production-websocket-url.com", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      workerSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null, // Allow HTTP for local dev, force HTTPS in prod
    },
  },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  xssFilter: true,
});

// --- CORS Configuration ---
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.split(',').map((s) => s.trim())] : ['http://localhost:5173', 'http://localhost:3000'];

const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn('CORS Blocked', { origin, message: msg });
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

// --- Rate Limiting ---
const commonRateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn('Rate Limit Exceeded', { ip: req.ip, path: req.path });
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      message: 'Too many requests, please try again after some time.',
    });
  },
};

const apiLimiter = rateLimit({
  ...commonRateLimitOptions,
  max: 100, // Max 100 requests per 15 minutes
  message: 'Too many API requests from this IP, please try again after 15 minutes.',
});

const authLimiter = rateLimit({
  ...commonRateLimitOptions,
  max: 5, // Max 5 login/registration attempts per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
});

const strictLimiter = rateLimit({
  ...commonRateLimitOptions,
  max: 20, // Max 20 requests per 15 minutes for sensitive endpoints
  message: 'Too many requests to this sensitive endpoint, please try again after 15 minutes.',
});

const uploadLimiter = rateLimit({
  ...commonRateLimitOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 uploads per hour
  message: 'Too many upload requests from this IP, please try again after an hour.',
});

// --- Custom Security Headers Middleware ---
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
};

// --- Request Validation Middleware (Example) ---
const validateRequest = (req, res, next) => {
  // Basic check for suspicious patterns in query or body
  const suspiciousPatterns = [/<script>/i, /eval\(/i, /UNION SELECT/i];
  const checkString = JSON.stringify({ ...req.body, ...req.query, ...req.params });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn('Suspicious Request Detected', { ip: req.ip, path: req.path, pattern: pattern.source, data: checkString });
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Suspicious request detected.' });
    }
  }
  next();
};

// --- Security Monitoring Middleware ---
const securityMonitor = (req, res, next) => {
  // Log all requests for audit purposes
  console.log(`Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user.id : 'guest', // Assuming req.user is set by auth middleware
    body: req.body,
    query: req.query,
  });

  // Monitor for common attack patterns (e.g., SQL injection, XSS in URLs)
  const url = req.originalUrl.toLowerCase();
  if (url.includes('select%20') || url.includes('union%20') || url.includes('<script>')) {
    console.error('Potential Injection Attack Detected in URL', { ip: req.ip, url });
    // Optionally, block the request or respond with an error
  }

  next();
};

module.exports = {
  helmetConfig,
  corsConfig,
  securityHeaders,
  validateRequest,
  securityMonitor,
  apiLimiter,
  authLimiter,
  strictLimiter,
  uploadLimiter,
};
