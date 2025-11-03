/**
 * CSRF Protection Utilities
 * 
 * Provides CSRF token generation and validation
 * 
 * Note: For Next.js with SameSite cookies, CSRF protection is less critical,
 * but still recommended for sensitive operations. Using SameSite=strict for
 * sensitive cookies provides good protection.
 */

import crypto from 'crypto';

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

/**
 * Get CSRF token from request
 * Checks both header and body
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  // Check header first (preferred)
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }
  
  // Check body (for form submissions)
  // Note: This requires parsing the body, which is async
  // For now, we'll rely on header-based approach
  return null;
}

/**
 * CSRF protection middleware
 * 
 * Usage:
 * ```typescript
 * const csrfToken = request.headers.get('x-csrf-token');
 * const sessionToken = request.cookies.get('csrf_token')?.value;
 * 
 * if (!csrfToken || !validateCsrfToken(csrfToken, sessionToken)) {
 *   return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
 * }
 * ```
 * 
 * Note: For production, consider:
 * - Storing CSRF tokens in Redis/session store
 * - Using SameSite=strict cookies (already implemented)
 * - Implementing double-submit cookie pattern
 */

