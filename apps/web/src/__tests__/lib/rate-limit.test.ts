/**
 * Tests for rate limiting utilities
 */

import { rateLimit, rateLimiters } from '@/lib/rate-limit';

// Mock Request global for rate limiting tests
// The rate limit function uses request.headers.get(), so we create mock objects

describe('Rate Limiting', () => {
  // Import and clear the store before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the in-memory store by accessing it through the module
    // We need to reset the store since it's module-scoped
    const rateLimitModule = require('@/lib/rate-limit');
    // The store is not exported, so we'll use a different approach
    // Each test will use a unique key to avoid conflicts
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 5
      });

      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '127.0.0.1';
            if (name === 'x-real-ip') return null;
            return null;
          }
        }
      } as any;

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it('should block requests exceeding limit', async () => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 3
      });

      // Use unique IP for this test to avoid conflicts
      const uniqueIP = `127.0.0.${Math.floor(Math.random() * 255)}`;
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return uniqueIP;
            if (name === 'x-real-ip') return null;
            return null;
          }
        }
      } as any;

      // Make 3 requests (within limit)
      for (let i = 0; i < 3; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
      }

      // 4th request should be blocked
      const blockedResult = await limiter(request);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.error).toBeDefined();
      expect(blockedResult.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      jest.useFakeTimers();
      
      const limiter = rateLimit({
        windowMs: 1000,
        max: 2
      });

      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '127.0.0.1';
            if (name === 'x-real-ip') return null;
            return null;
          }
        }
      } as any;

      // Make 2 requests (at limit)
      await limiter(request);
      await limiter(request);

      // 3rd should be blocked
      let result = await limiter(request);
      expect(result.success).toBe(false);

      // Advance time past window
      jest.advanceTimersByTime(1001);

      // Should be allowed again
      result = await limiter(request);
      expect(result.success).toBe(true);

      jest.useRealTimers();
    });

    it('should use custom key generator', async () => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 5,
        keyGenerator: (req) => {
          return req.headers.get('x-custom-key') || 'default';
        }
      });

      const request1 = {
        headers: {
          get: (name: string) => {
            if (name === 'x-custom-key') return 'user1';
            return null;
          }
        }
      } as any;

      const request2 = {
        headers: {
          get: (name: string) => {
            if (name === 'x-custom-key') return 'user2';
            return null;
          }
        }
      } as any;

      // Exceed limit for user1
      for (let i = 0; i < 6; i++) {
        await limiter(request1);
      }

      // user2 should still be allowed
      const result = await limiter(request2);
      expect(result.success).toBe(true);
    });

    it('should return remaining count', async () => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 5
      });

      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '127.0.0.1';
            if (name === 'x-real-ip') return null;
            return null;
          }
        }
      } as any;

      const uniqueIP = `127.0.0.${Math.floor(Math.random() * 255)}`;
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return uniqueIP;
            if (name === 'x-real-ip') return null;
            return null;
          }
        }
      } as any;

      const result1 = await limiter(request);
      expect(result1.remaining).toBe(4);

      const result2 = await limiter(request);
      expect(result2.remaining).toBe(3);
    });
  });

  describe('rateLimiters', () => {
    it('should have login rate limiter configured', () => {
      expect(rateLimiters.login).toBeDefined();
    });

    it('should have api rate limiter configured', () => {
      expect(rateLimiters.api).toBeDefined();
    });

    it('should have registration rate limiter configured', () => {
      expect(rateLimiters.registration).toBeDefined();
    });

    it('should have booking rate limiter configured', () => {
      expect(rateLimiters.booking).toBeDefined();
    });

    it('should block after login limit', async () => {
      const uniqueIP = `127.0.0.${Math.floor(Math.random() * 255)}`;
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return uniqueIP;
            if (name === 'x-real-ip') return null;
            return null;
          }
        }
      } as any;

      // Make 10 requests (limit)
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiters.login(request);
        expect(result.success).toBe(true);
      }

      // 11th should be blocked
      const result = await rateLimiters.login(request);
      expect(result.success).toBe(false);
    });
  });
});

