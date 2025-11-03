/**
 * Tests for centralized authentication middleware
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyAuth, requireAuth, optionalAuth } from '@/lib/auth-middleware';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, status: options?.status || 200 }))
  }
}));

// Mock createApiError
jest.mock('@parkway/shared', () => ({
  createApiError: jest.fn((message, status, code) => ({
    error: { message, status, code }
  }))
}));

describe('Auth Middleware', () => {
  const JWT_SECRET = 'test-secret-key';
  const userId = 'test-user-id';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('verifyAuth', () => {
    it('should return success with userId for valid token', async () => {
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === 'access_token') {
              return { value: token };
            }
            return undefined;
          })
        }
      } as unknown as NextRequest;

      const result = await verifyAuth(request);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.error).toBeUndefined();
    });

    it('should return error when no token is provided', async () => {
      const request = {
        cookies: {
          get: jest.fn(() => undefined)
        }
      } as unknown as NextRequest;

      const result = await verifyAuth(request);

      expect(result.success).toBe(false);
      expect(result.userId).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it('should return error when JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;
      const token = jwt.sign({ id: userId }, 'temp-secret', { expiresIn: '1h' });
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: token }))
        }
      } as unknown as NextRequest;

      const result = await verifyAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for expired token', async () => {
      // Create an expired token by using a past expiration time
      const token = jwt.sign({ id: userId, exp: Math.floor(Date.now() / 1000) - 3600 }, JWT_SECRET);
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: token }))
        }
      } as unknown as NextRequest;

      const result = await verifyAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for invalid token', async () => {
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: 'invalid-token' }))
        }
      } as unknown as NextRequest;

      const result = await verifyAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when token has no id field', async () => {
      const token = jwt.sign({ email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: token }))
        }
      } as unknown as NextRequest;

      const result = await verifyAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('requireAuth', () => {
    it('should return success with userId for valid token', async () => {
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: token }))
        }
      } as unknown as NextRequest;

      const result = await requireAuth(request);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(userId);
    });

    it('should return error when token is missing', async () => {
      const request = {
        cookies: {
          get: jest.fn(() => undefined)
        }
      } as unknown as NextRequest;

      const result = await requireAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('optionalAuth', () => {
    it('should return userId when token is valid', async () => {
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: token }))
        }
      } as unknown as NextRequest;

      const result = await optionalAuth(request);

      expect(result.userId).toBe(userId);
    });

    it('should return empty object when token is missing', async () => {
      const request = {
        cookies: {
          get: jest.fn(() => undefined)
        }
      } as unknown as NextRequest;

      const result = await optionalAuth(request);

      expect(result.userId).toBeUndefined();
      expect(Object.keys(result).length).toBe(0);
    });

    it('should return empty object when token is invalid', async () => {
      const request = {
        cookies: {
          get: jest.fn(() => ({ value: 'invalid-token' }))
        }
      } as unknown as NextRequest;

      const result = await optionalAuth(request);

      expect(result.userId).toBeUndefined();
      expect(Object.keys(result).length).toBe(0);
    });
  });
});

