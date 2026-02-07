import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      // Return success with null user for unauthenticated users
      // This allows the endpoint to be called without auth and gracefully handle no token
      // No logging needed for expected unauthenticated state
      return NextResponse.json(
        createApiResponse(null, 'No authenticated user'),
        { status: 200 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('[AUTH] Me: JWT_SECRET not configured');
      return NextResponse.json(
        createApiError('Server configuration error', 500, 'SERVER_ERROR'),
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (verifyError: any) {
      logger.warn('[AUTH] Me: Token verification failed', {
        error: verifyError.name,
        message: verifyError.message,
      });
      
      if (verifyError.name === 'TokenExpiredError') {
        return NextResponse.json(
          createApiError('Token expired.', 401, 'TOKEN_EXPIRED'),
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        createApiError('Invalid token.', 401, 'INVALID_TOKEN'),
        { status: 401 }
      );
    }
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        phone: true,
        address: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        createApiError('Invalid token or user not found.', 401, 'INVALID_TOKEN'),
        { status: 401 }
      );
    }

    return NextResponse.json(createApiResponse(user, 'User data retrieved successfully'));
  } catch (error: any) {
    logger.error('[AUTH] Me: Unexpected error', {
      name: error?.name,
      message: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // JWT-related errors → 401
    if (error?.name === 'TokenExpiredError') {
      return NextResponse.json(
        createApiError('Token expired.', 401, 'TOKEN_EXPIRED'),
        { status: 401 }
      );
    }
    if (error?.name === 'JsonWebTokenError') {
      return NextResponse.json(
        createApiError('Invalid token.', 401, 'INVALID_TOKEN'),
        { status: 401 }
      );
    }

    // DB / server errors → 500 so client doesn't treat as auth failure
    return NextResponse.json(
      createApiError('Unable to verify session. Please try again.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
