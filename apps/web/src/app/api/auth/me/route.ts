import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

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
      console.error('[AUTH] Me: No access token cookie found');
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AUTH] Me: JWT_SECRET not configured');
      return NextResponse.json(
        createApiError('Server configuration error', 500, 'SERVER_ERROR'),
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (verifyError: any) {
      console.error('[AUTH] Me: Token verification failed', {
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
    console.error('[AUTH] Me: Unexpected error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
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
}
