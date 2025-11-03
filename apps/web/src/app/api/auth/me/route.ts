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
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
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
  } catch (error) {
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
