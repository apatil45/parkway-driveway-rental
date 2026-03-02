import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_ORIGIN = 'https://res.cloudinary.com';

/**
 * GET /api/admin/verification-document?url=<encoded-cloudinary-url>
 * Admin-only proxy for verification documents. Streams the file so the admin page
 * can display it in an iframe/img from same origin (avoids CSP and download prompt).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.error!;
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!decoded.startsWith(ALLOWED_ORIGIN)) {
    return NextResponse.json({ error: 'Invalid document url' }, { status: 400 });
  }

  try {
    const res = await fetch(decoded, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const body = await res.arrayBuffer();
    const isPdf =
      decoded.toLowerCase().includes('.pdf') ||
      decoded.includes('/raw/') ||
      (res.headers.get('content-type') || '').toLowerCase().includes('pdf');
    const contentType = isPdf ? 'application/pdf' : (res.headers.get('content-type') || 'application/octet-stream');

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('Verification document proxy error:', e);
    return NextResponse.json({ error: 'Failed to load document' }, { status: 502 });
  }
}
