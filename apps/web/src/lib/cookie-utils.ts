import { NextRequest, NextResponse } from 'next/server';

/**
 * Cookie utility functions for consistent cookie handling across the app
 * Handles Vercel production environment correctly
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  maxAge?: number;
  domain?: string;
}

/**
 * Get cookie configuration for the current environment
 * Optimized for Vercel production deployment
 */
export function getCookieConfig(request: NextRequest): {
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
} {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const isHttps = request.url.startsWith('https://');
  const isSecure = isProd || isHttps;
  
  // For Vercel/production with HTTPS, use 'lax' for same-origin requests
  // This works well for same-domain API calls
  const sameSite: 'lax' = 'lax';
  
  return {
    secure: isSecure,
    sameSite,
  };
}

/**
 * Set authentication cookies on a response
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  request: NextRequest
): void {
  const config = getCookieConfig(request);
  
  // Set access token cookie (short-lived)
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });
  
  // Set refresh token cookie (long-lived)
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  const config = getCookieConfig(request);
  
  response.cookies.set('access_token', '', {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 0,
  });
  
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 0,
  });
}

