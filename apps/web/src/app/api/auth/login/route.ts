import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { 
  AuthResponse, 
  createApiResponse, 
  createApiError 
} from '@parkway/shared';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { setAuthCookies } from '@/lib/cookie-utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn: '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or JWT_REFRESH_SECRET environment variable is not set');
  }
  return jwt.sign(
    { id: userId, type: 'refresh' },
    secret,
    { expiresIn: '30d' }
  );
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting using improved utility
    const { rateLimiters } = await import('@/lib/rate-limit');
    const rateLimitResult = await rateLimiters.login(request as any);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createApiError(rateLimitResult.error || 'Too many attempts, try again later', 429, 'RATE_LIMIT'),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const userMessage = firstError.message || 'Please check your login information and try again.';
      return NextResponse.json(
        createApiError(userMessage, 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    
    const { email, password }: LoginInput = validationResult.data;

    // Find user by email (password needed for comparison, so we fetch it)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // Needed for password comparison
        roles: true,
        isActive: true,
        phone: true,
        address: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }

    // Check password - bcryptjs is compatible with bcrypt hashes
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcryptjs.compare(password, user.password);
    } catch (compareError) {
      logger.error('[AUTH] Password comparison error', { email }, compareError as Error);
      return NextResponse.json(
        createApiError('Authentication error', 500, 'AUTH_ERROR'),
        { status: 500 }
      );
    }
    if (!isPasswordValid) {
      return NextResponse.json(
        createApiError('Invalid email or password. Please check your credentials and try again.', 401, 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Set httpOnly cookies using utility function
    const res = NextResponse.json(createApiResponse({ user: userData }, 'Login successful'));
    setAuthCookies(res, token, refreshToken, request);
    return res;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[AUTH] Login error', {
      message: errorMessage,
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL
      }
    }, error instanceof Error ? error : undefined);
    
    // In development, include error details; in production, keep it generic
    const isDev = process.env.NODE_ENV === 'development';
    const message = isDev
      ? `Internal server error: ${errorMessage}`
      : 'Unable to process your login request. Please try again in a moment.';
    
    // Create error response
    const errorResponse = createApiError(message, 500, 'INTERNAL_ERROR');
    
    // Include debug info only in development or preview
    if (isDev || process.env.VERCEL_ENV === 'preview') {
      (errorResponse as any).debug = {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: errorMessage,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
      };
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
