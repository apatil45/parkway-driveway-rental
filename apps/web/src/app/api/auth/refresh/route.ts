import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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
      return NextResponse.json({ success: false, message: 'No refresh token', statusCode: 401 }, { status: 401 });
    }
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as any;
    if (!decoded?.id) {
      return NextResponse.json({ success: false, message: 'Invalid token', statusCode: 401 }, { status: 401 });
    }
    const access = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const res = NextResponse.json({ success: true, message: 'Token refreshed', statusCode: 200 });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookies.set('access_token', access, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Invalid token', statusCode: 401 }, { status: 401 });
  }
}

