import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { setAuthCookies } from '@/lib/cookie-utils';
import { generateToken, generateRefreshToken } from '@/lib/jwt';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Default role for new Google OAuth users
const DEFAULT_OAUTH_ROLE = ['DRIVER'] as const;

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback: exchanges code for tokens, finds/creates user, sets auth cookies.
 */
function getAppUrl(): string | undefined {
  let url: string | undefined;
  if (process.env.NEXT_PUBLIC_APP_URL) {
    url = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
  } else {
    return undefined;
  }
  return url.replace(/\/+$/, ''); // no trailing slash (Google redirect_uri must match exactly)
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = getAppUrl();

  if (!clientId || !clientSecret || !appUrl) {
    logger.error('[AUTH] Google OAuth: Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or NEXT_PUBLIC_APP_URL');
    const base = appUrl || new URL(request.url).origin;
    return NextResponse.redirect(new URL('/login?error=google_oauth_not_configured', base));
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state'); // redirect path
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    logger.warn('[AUTH] Google OAuth: User denied or error', { error });
    return NextResponse.redirect(new URL(`/login?error=google_${error}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', appUrl));
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const baseUrl = new URL(appUrl);

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      logger.error('[AUTH] Google OAuth: Token exchange failed', { error: tokens.error });
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', appUrl));
    }

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      logger.error('[AUTH] Google OAuth: Failed to fetch user info', { status: userRes.status });
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', appUrl));
    }

    const googleUser = await userRes.json();
    const { id: googleId, email, name } = googleUser;

    if (!email) {
      logger.error('[AUTH] Google OAuth: No email in profile');
      return NextResponse.redirect(new URL('/login?error=no_email', appUrl));
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (!user) {
      // New user: create account
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId,
          password: null,
          roles: [...DEFAULT_OAUTH_ROLE],
        },
      });
      logger.info('[AUTH] Google OAuth: Created new user', { userId: user.id, email });
    } else if (!user.googleId) {
      // Existing user with same email: link Google account
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
      logger.info('[AUTH] Google OAuth: Linked Google to existing user', { userId: user.id });
    }

    if (!user.isActive) {
      return NextResponse.redirect(new URL('/login?error=account_disabled', appUrl));
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const redirectPath = state && state.startsWith('/') ? state : '/search';
    const res = NextResponse.redirect(new URL(redirectPath, baseUrl));
    setAuthCookies(res, token, refreshToken, request);
    return res;
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger.error('[AUTH] Google OAuth: Unexpected error', {
      message: errorObj.message,
      name: errorObj.name,
    }, errorObj);
    // In development, pass error hint for debugging (e.g. "column does not exist" = run migration)
    const errorParam = process.env.NODE_ENV === 'development' && errorObj.message
      ? `oauth_failed&hint=${encodeURIComponent(errorObj.message.slice(0, 100))}`
      : 'oauth_failed';
    return NextResponse.redirect(new URL(`/login?error=${errorParam}`, appUrl));
  }
}
