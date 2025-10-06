// Comprehensive Logging System for Parkway.com
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'parkway-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),

    // File transports
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true
    })
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Add HTTP request logging
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
      tailable: true
    })
  ]
});

// Add security event logging
export const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add performance logging
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
      tailable: true
    })
  ]
});

// Add audit logging
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      tailable: true
    })
  ]
});

// Enhanced logging methods
export const enhancedLogger = {
  // Standard logging methods
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },

  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },

  // HTTP request logging
  http: (req: any, res: any, responseTime: number) => {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || null,
      timestamp: new Date().toISOString()
    };

    httpLogger.http('HTTP Request', logData);
  },

  // Security event logging
  security: {
    loginAttempt: (email: string, success: boolean, ip: string, userAgent: string) => {
      securityLogger.warn('Login Attempt', {
        email,
        success,
        ip,
        userAgent,
        timestamp: new Date().toISOString()
      });
    },

    unauthorizedAccess: (resource: string, ip: string, userAgent: string, userId?: number) => {
      securityLogger.warn('Unauthorized Access', {
        resource,
        ip,
        userAgent,
        userId,
        timestamp: new Date().toISOString()
      });
    },

    suspiciousActivity: (activity: string, details: any, ip: string) => {
      securityLogger.warn('Suspicious Activity', {
        activity,
        details,
        ip,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Performance logging
  performance: {
    apiCall: (endpoint: string, method: string, duration: number, statusCode: number) => {
      performanceLogger.info('API Call', {
        endpoint,
        method,
        duration: `${duration}ms`,
        statusCode,
        timestamp: new Date().toISOString()
      });
    },

    databaseQuery: (query: string, duration: number, rowsAffected: number) => {
      performanceLogger.info('Database Query', {
        query: query.substring(0, 200), // Truncate long queries
        duration: `${duration}ms`,
        rowsAffected,
        timestamp: new Date().toISOString()
      });
    },

    slowQuery: (query: string, duration: number, threshold: number = 1000) => {
      if (duration > threshold) {
        performanceLogger.warn('Slow Query Detected', {
          query: query.substring(0, 500),
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // Audit logging
  audit: {
    userAction: (userId: number, action: string, resource: string, details?: any) => {
      auditLogger.info('User Action', {
        userId,
        action,
        resource,
        details,
        timestamp: new Date().toISOString()
      });
    },

    dataChange: (userId: number, table: string, operation: string, recordId: string, changes?: any) => {
      auditLogger.info('Data Change', {
        userId,
        table,
        operation,
        recordId,
        changes,
        timestamp: new Date().toISOString()
      });
    },

    systemEvent: (event: string, details: any) => {
      auditLogger.info('System Event', {
        event,
        details,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Business logic logging
  business: {
    bookingCreated: (bookingId: number, userId: number, drivewayId: number, amount: number) => {
      logger.info('Booking Created', {
        bookingId,
        userId,
        drivewayId,
        amount,
        timestamp: new Date().toISOString()
      });
    },

    paymentProcessed: (paymentId: string, amount: number, status: string, userId: number) => {
      logger.info('Payment Processed', {
        paymentId,
        amount,
        status,
        userId,
        timestamp: new Date().toISOString()
      });
    },

    drivewayCreated: (drivewayId: number, ownerId: number, price: number, location: string) => {
      logger.info('Driveway Created', {
        drivewayId,
        ownerId,
        price,
        location,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Log rotation and cleanup
export const logMaintenance = {
  // Clean up old log files
  cleanup: () => {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();

    fs.readdir(logsDir, (err, files) => {
      if (err) {
        logger.error('Failed to read logs directory', { error: err.message });
        return;
      }

      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlink(filePath, (err) => {
              if (err) {
                logger.error('Failed to delete old log file', { file, error: err.message });
              } else {
                logger.info('Deleted old log file', { file });
              }
            });
          }
        });
      });
    });
  },

  // Get log statistics
  getStats: () => {
    return new Promise((resolve, reject) => {
      fs.readdir(logsDir, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        const stats = {
          totalFiles: files.length,
          totalSize: 0,
          files: [] as any[]
        };

        let processed = 0;
        if (files.length === 0) {
          resolve(stats);
          return;
        }

        files.forEach(file => {
          const filePath = path.join(logsDir, file);
          fs.stat(filePath, (err, stat) => {
            if (!err) {
              stats.totalSize += stat.size;
              stats.files.push({
                name: file,
                size: stat.size,
                modified: stat.mtime
              });
            }

            processed++;
            if (processed === files.length) {
              resolve(stats);
            }
          });
        });
      });
    });
  }
};

// Initialize log maintenance
setInterval(logMaintenance.cleanup, 24 * 60 * 60 * 1000); // Run daily

export default enhancedLogger;
