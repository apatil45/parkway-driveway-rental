/**
 * Logger Utility
 * 
 * Provides structured logging with different log levels.
 * In development: logs to console with formatting
 * In production: logs as JSON for log aggregation services
 * 
 * Future: Can integrate with Sentry, LogRocket, or other monitoring services
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: any;
}

interface ErrorDetails {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
  statusCode?: number;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Log an error
   * Always logged in both development and production
   */
  error(message: string, context?: LogContext, error?: Error | ErrorDetails) {
    const logData = {
      level: 'error' as LogLevel,
      message,
      context,
      error: error ? {
        name: error instanceof Error ? error.name : error.name,
        message: error instanceof Error ? error.message : error.message,
        stack: this.isDevelopment && error instanceof Error ? error.stack : undefined,
        code: 'code' in error ? error.code : undefined,
        statusCode: 'statusCode' in error ? error.statusCode : undefined,
      } : undefined,
      timestamp: new Date().toISOString(),
    };
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, logData);
    } else {
      // In production, log as JSON for log aggregation
      console.error(JSON.stringify(logData));
      // TODO: Send to Sentry/LogRocket in production
      // Example: Sentry.captureException(error, { extra: logData });
    }
  }
  
  /**
   * Log a warning
   * Logged in both development and production
   */
  warn(message: string, context?: LogContext) {
    const logData = {
      level: 'warn' as LogLevel,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      console.warn(JSON.stringify(logData));
    }
  }
  
  /**
   * Log informational message
   * Only logged in development
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context);
    }
    // In production, only log errors and warnings to reduce noise
  }
  
  /**
   * Log debug message
   * Only logged in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
    // Never log debug in production
  }
}

export const logger = new Logger();
