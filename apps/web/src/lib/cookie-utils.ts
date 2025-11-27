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
  domain?: string;
} {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const isHttps = request.url.startsWith('https://');
  const isSecure = isProd || isHttps;
  
  // For Vercel/production with HTTPS, use 'lax' for same-origin requests
  // This works well for same-domain API calls
  const sameSite: 'lax' = 'lax';
  
  // Extract domain from request URL for Vercel
  let domain: string | undefined;
  if (isProd) {
    try {
      const url = new URL(request.url);
      // For Vercel, don't set domain explicitly - let browser handle it
      // This ensures cookies work across *.vercel.app subdomains
      // Only set domain if it's a custom domain
      if (url.hostname && !url.hostname.endsWith('.vercel.app')) {
        // For custom domains, extract root domain
        const parts = url.hostname.split('.');
        if (parts.length >= 2) {
          domain = '.' + parts.slice(-2).join('.');
        }
      }
    } catch (e) {
      // If URL parsing fails, don't set domain
    }
  }
  
  return {
    secure: isSecure,
    sameSite,
    ...(domain && { domain }),
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
  const accessCookieOptions: any = {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  };
  if (config.domain) {
    accessCookieOptions.domain = config.domain;
  }
  response.cookies.set('access_token', accessToken, accessCookieOptions);
  
  // Set refresh token cookie (long-lived)
  const refreshCookieOptions: any = {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
  if (config.domain) {
    refreshCookieOptions.domain = config.domain;
  }
  response.cookies.set('refresh_token', refreshToken, refreshCookieOptions);
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  const config = getCookieConfig(request);
  
  const clearCookieOptions: any = {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/',
    maxAge: 0,
  };
  if (config.domain) {
    clearCookieOptions.domain = config.domain;
  }
  
  response.cookies.set('access_token', '', clearCookieOptions);
  response.cookies.set('refresh_token', '', clearCookieOptions);
}

