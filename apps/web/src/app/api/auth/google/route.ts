import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/auth/google
 * Redirects to Google OAuth consent screen.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.redirect(
      new URL('/login?error=google_oauth_not_configured', request.url)
    );
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const scope = 'openid email profile';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
  });

  // Preserve redirect param if user came from a protected page (Google returns state in callback)
  const redirect = request.nextUrl.searchParams.get('redirect');
  if (redirect && redirect.startsWith('/')) {
    params.set('state', redirect);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return NextResponse.redirect(authUrl);
}
