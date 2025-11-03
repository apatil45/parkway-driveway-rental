/**
 * Centralized Authentication Middleware
 * 
 * Provides reusable authentication utilities for API routes
 * Eliminates code duplication across all endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createApiError } from '@parkway/shared';

export interface AuthenticatedRequest {
  userId: string;
  token: string;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: NextResponse;
}

/**
 * Verify JWT token and extract user ID
 * Returns standardized auth result
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get('access_token')?.value;
  
  if (!token) {
    return {
      success: false,
      error: NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      )
    };
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[AUTH] JWT_SECRET is not set');
      return {
        success: false,
        error: NextResponse.json(
          createApiError('Server configuration error', 500, 'SERVER_ERROR'),
          { status: 500 }
        )
      };
    }

    const decoded = jwt.verify(token, secret) as { id: string };
    
    if (!decoded.id) {
      return {
        success: false,
        error: NextResponse.json(
          createApiError('Invalid token format', 401, 'INVALID_TOKEN'),
          { status: 401 }
        )
      };
    }

    return {
      success: true,
      userId: decoded.id
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: NextResponse.json(
          createApiError('Token expired. Please refresh your session.', 401, 'TOKEN_EXPIRED'),
          { status: 401 }
        )
      };
    }
    
    if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        error: NextResponse.json(
          createApiError('Invalid token', 401, 'INVALID_TOKEN'),
          { status: 401 }
        )
      };
    }

    console.error('[AUTH] Token verification error:', error);
    return {
      success: false,
      error: NextResponse.json(
        createApiError('Authentication error', 401, 'AUTH_ERROR'),
        { status: 401 }
      )
    };
  }
}

/**
 * Require authentication middleware
 * Returns error response if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  return await verifyAuth(request);
}

/**
 * Optional authentication
 * Returns userId if authenticated, but doesn't fail if not
 */
export async function optionalAuth(request: NextRequest): Promise<{ userId?: string }> {
  const result = await verifyAuth(request);
  if (result.success) {
    return { userId: result.userId };
  }
  return {};
}

