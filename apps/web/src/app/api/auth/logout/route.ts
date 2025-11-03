import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ success: true, message: 'Logged out', statusCode: 200 });
  // Use secure cookies in production (HTTPS required)
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const isSecure = isProd || request.url.startsWith('https://');
  res.cookies.set('access_token', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

