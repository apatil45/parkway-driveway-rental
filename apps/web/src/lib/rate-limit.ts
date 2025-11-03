/**
 * Rate Limiting Utility
 * 
 * Provides rate limiting for API endpoints.
 * 
 * For production, consider using:
 * - Vercel's built-in rate limiting
 * - Redis for distributed rate limiting
 * - Upstash Redis (serverless-friendly)
 */

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  keyGenerator?: (request: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (resets on serverless function restart)
// For production, use Redis or external store
const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * Note: This resets on serverless function restart and doesn't work across instances
 * For production, use Redis or Vercel's rate limiting
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later', keyGenerator } = options;

  return async (request: Request): Promise<{ success: boolean; remaining: number; resetTime: number; error?: string }> => {
    const now = Date.now();
    
    // Generate key (default: IP address)
    const key = keyGenerator 
      ? keyGenerator(request)
      : request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        request.headers.get('x-real-ip') || 
        'unknown';

    const storeKey = `rl_${key}`;
    const entry = store[storeKey];

    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      Object.keys(store).forEach(k => {
        if (store[k].resetTime < now) {
          delete store[k];
        }
      });
    }

    // Check if entry exists and is still valid
    if (entry && entry.resetTime > now) {
      if (entry.count >= max) {
        return {
          success: false,
          remaining: 0,
          resetTime: entry.resetTime,
          error: message
        };
      }
      
      entry.count++;
      return {
        success: true,
        remaining: max - entry.count,
        resetTime: entry.resetTime
      };
    }

    // Create new entry
    store[storeKey] = {
      count: 1,
      resetTime: now + windowMs
    };

    return {
      success: true,
      remaining: max - 1,
      resetTime: now + windowMs
    };
  };
}

/**
 * Standard rate limiters for common use cases
 */
export const rateLimiters = {
  // Login attempts: 10 per minute
  login: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many login attempts, please try again later'
  }),

  // API requests: 100 per minute
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many API requests, please try again later'
  }),

  // Registration: 5 per hour
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many registration attempts, please try again later'
  }),

  // Booking creation: 20 per hour
  booking: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Too many booking attempts, please try again later'
  })
};

/**
 * Redis-based rate limiter (for production)
 * Uncomment and use when Redis is available
 */
/*
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function redisRateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later', keyGenerator } = options;

  return async (request: Request) => {
    const key = keyGenerator 
      ? keyGenerator(request)
      : request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        request.headers.get('x-real-ip') || 
        'unknown';

    const storeKey = `rl:${key}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const redisKey = `${storeKey}:${windowStart}`;

    // Increment counter
    const count = await redis.incr(redisKey);
    await redis.expire(redisKey, Math.ceil(windowMs / 1000));

    if (count > max) {
      return {
        success: false,
        remaining: 0,
        resetTime: windowStart + windowMs,
        error: message
      };
    }

    return {
      success: true,
      remaining: max - count,
      resetTime: windowStart + windowMs
    };
  };
}
*/

