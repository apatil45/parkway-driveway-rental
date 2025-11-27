import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getCookieConfig } from '@/lib/cookie-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

// Issue new access token from refresh token cookie
export async function POST(request: NextRequest) {
  try {
    const refresh = request.cookies.get('refresh_token')?.value;
    if (!refresh) {
      console.error('[AUTH] Refresh: No refresh token cookie found');
      return NextResponse.json({ success: false, message: 'No refresh token', statusCode: 401 }, { status: 401 });
    }

    // Check if JWT secrets are configured
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const accessSecret = process.env.JWT_SECRET;
    
    if (!refreshSecret || !accessSecret) {
      console.error('[AUTH] Refresh: JWT secrets not configured', {
        hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET,
        vercel: process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV,
      });
      return NextResponse.json(
        { success: false, message: 'Server configuration error', statusCode: 500 },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refresh, refreshSecret);
    } catch (verifyError: any) {
      console.error('[AUTH] Refresh: Token verification failed', {
        error: verifyError.name,
        message: verifyError.message,
      });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token', statusCode: 401 },
        { status: 401 }
      );
    }

    if (!decoded?.id) {
      console.error('[AUTH] Refresh: Token missing user ID', { decoded });
      return NextResponse.json(
        { success: false, message: 'Invalid token format', statusCode: 401 },
        { status: 401 }
      );
    }

    const access = jwt.sign({ id: decoded.id }, accessSecret, { expiresIn: '15m' });
    const res = NextResponse.json({ success: true, message: 'Token refreshed', statusCode: 200 });
    
    // Set cookie with proper configuration
    const config = getCookieConfig(request);
    res.cookies.set('access_token', access, {
      httpOnly: true,
      secure: config.secure,
      sameSite: config.sameSite,
      path: '/',
      maxAge: 60 * 15,
    });
    
    return res;
  } catch (e: any) {
    console.error('[AUTH] Refresh: Unexpected error', {
      error: e.message,
      stack: e.stack,
      name: e.name,
    });
    return NextResponse.json(
      { success: false, message: 'Token refresh failed', statusCode: 401 },
      { status: 401 }
    );
  }
}

