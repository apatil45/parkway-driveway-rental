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
    // Basic in-memory rate limit (dev/preview). Replace with Redis in prod.
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const key = `rl_${ip}`;
    const now = Date.now();
    // @ts-ignore
    globalThis.__rl = globalThis.__rl || new Map();
    // @ts-ignore
    const entry = globalThis.__rl.get(key) || [];
    const windowMs = 60_000; // 1 minute
    const limit = 10; // 10 attempts/min
    const recent = entry.filter((t: number) => now - t < windowMs);
    if (recent.length >= limit) {
      return NextResponse.json(createApiError('Too many attempts, try again later', 429, 'RATE_LIMIT'), { status: 429 });
    }
    // @ts-ignore
    globalThis.__rl.set(key, [...recent, now]);

    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError(
          'Validation failed: ' + validationResult.error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }
    
    const { email, password }: LoginInput = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
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
      console.error('[AUTH] Password comparison error:', compareError);
      return NextResponse.json(
        createApiError('Authentication error', 500, 'AUTH_ERROR'),
        { status: 500 }
      );
    }
    if (!isPasswordValid) {
      return NextResponse.json(
        createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'),
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

    // Set httpOnly cookies
    const res = NextResponse.json(createApiResponse({ user: userData }, 'Login successful'));
    // Use secure cookies in production (HTTPS required)
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const isSecure = isProd || request.url.startsWith('https://');
    res.cookies.set('access_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });
    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error in all environments for debugging
    console.error('[AUTH] Login error details:', {
      message: errorMessage,
      stack: errorStack,
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL
      }
    });
    
    // In development, include error details; in production, keep it generic
    const isDev = process.env.NODE_ENV === 'development';
    const message = isDev
      ? `Internal server error: ${errorMessage}`
      : 'Internal server error. Please check server logs.';
    
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
