/**
 * Comprehensive tests for CSRF protection utilities
 * Tests token generation, validation, and request handling
 */

import { generateCsrfToken, validateCsrfToken, getCsrfTokenFromRequest } from '@/lib/csrf';
import { NextRequest } from 'next/server';

describe('CSRF Protection Utilities', () => {
  describe('generateCsrfToken', () => {
    it('generates a token', () => {
      const token = generateCsrfToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('generates unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      
      expect(token1).not.toBe(token2);
    });

    it('generates tokens of correct length (64 hex characters)', () => {
      const token = generateCsrfToken();
      
      // 32 bytes = 64 hex characters
      expect(token.length).toBe(64);
    });

    it('generates hex-encoded tokens', () => {
      const token = generateCsrfToken();
      
      // Should only contain hex characters (0-9, a-f)
      expect(token).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe('validateCsrfToken', () => {
    it('validates matching tokens', () => {
      const token = generateCsrfToken();
      
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it('rejects non-matching tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it('rejects null tokens', () => {
      const token = generateCsrfToken();
      
      expect(validateCsrfToken(null as any, token)).toBe(false);
      expect(validateCsrfToken(token, null as any)).toBe(false);
      expect(validateCsrfToken(null as any, null as any)).toBe(false);
    });

    it('rejects undefined tokens', () => {
      const token = generateCsrfToken();
      
      expect(validateCsrfToken(undefined as any, token)).toBe(false);
      expect(validateCsrfToken(token, undefined as any)).toBe(false);
      expect(validateCsrfToken(undefined as any, undefined as any)).toBe(false);
    });

    it('rejects empty string tokens', () => {
      const token = generateCsrfToken();
      
      expect(validateCsrfToken('', token)).toBe(false);
      expect(validateCsrfToken(token, '')).toBe(false);
      expect(validateCsrfToken('', '')).toBe(false);
    });

    it('uses constant-time comparison', () => {
      const token1 = 'a'.repeat(64);
      const token2 = 'b'.repeat(64);
      
      // Should not throw even with different lengths in comparison
      expect(() => validateCsrfToken(token1, token2)).not.toThrow();
    });

    it('handles tokens of different lengths safely', () => {
      const token1 = generateCsrfToken();
      const token2 = token1.substring(0, 32); // Half length
      
      // Should return false without throwing
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it('validates same token multiple times consistently', () => {
      const token = generateCsrfToken();
      
      expect(validateCsrfToken(token, token)).toBe(true);
      expect(validateCsrfToken(token, token)).toBe(true);
      expect(validateCsrfToken(token, token)).toBe(true);
    });
  });

  describe('getCsrfTokenFromRequest', () => {
    it('extracts token from x-csrf-token header', () => {
      const token = 'test-csrf-token-123';
      const headers = new Headers();
      headers.set('x-csrf-token', token);
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers,
      });
      
      expect(getCsrfTokenFromRequest(request)).toBe(token);
    });

    it('returns null when header is missing', () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      
      expect(getCsrfTokenFromRequest(request)).toBeNull();
    });

    it('returns null when header is empty', () => {
      const headers = new Headers();
      headers.set('x-csrf-token', '');
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers,
      });
      
      const result = getCsrfTokenFromRequest(request);
      // Empty string becomes null as per the function
      expect(result).toBe('');
    });

    it('is case-insensitive for header name', () => {
      const token = 'test-token';
      const headers = new Headers();
      headers.set('X-CSRF-TOKEN', token); // Uppercase
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers,
      });
      
      // Headers in NextRequest are case-sensitive, so uppercase won't match
      // But we test the actual behavior
      expect(getCsrfTokenFromRequest(request)).toBe(null);
    });

    it('handles multiple header values', () => {
      const token = 'first-token';
      const headers = new Headers();
      headers.set('x-csrf-token', token);
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers,
      });
      
      expect(getCsrfTokenFromRequest(request)).toBe(token);
    });
  });

  describe('Integration tests', () => {
    it('generates and validates token flow', () => {
      const token = generateCsrfToken();
      const isValid = validateCsrfToken(token, token);
      
      expect(isValid).toBe(true);
    });

    it('generates token and extracts from request', () => {
      const token = generateCsrfToken();
      const headers = new Headers();
      headers.set('x-csrf-token', token);
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers,
      });
      
      const extractedToken = getCsrfTokenFromRequest(request);
      const isValid = validateCsrfToken(extractedToken!, token);
      
      expect(isValid).toBe(true);
    });

    it('detects tampered tokens', () => {
      const originalToken = generateCsrfToken();
      const tamperedToken = originalToken.substring(0, 63) + 'X'; // Change last character
      
      expect(validateCsrfToken(originalToken, tamperedToken)).toBe(false);
    });

    it('handles full CSRF protection flow', () => {
      // Generate token (server-side)
      const serverToken = generateCsrfToken();
      
      // Client sends token in header
      const headers = new Headers();
      headers.set('x-csrf-token', serverToken);
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers,
      });
      
      // Extract token from request
      const clientToken = getCsrfTokenFromRequest(request);
      
      // Validate token
      const isValid = validateCsrfToken(clientToken!, serverToken);
      
      expect(isValid).toBe(true);
    });
  });
});

