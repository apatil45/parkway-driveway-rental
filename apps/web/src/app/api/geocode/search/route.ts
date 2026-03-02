import { NextRequest, NextResponse } from 'next/server';
import { resolveViewbox } from '@/lib/market-config';
import { rateLimiters } from '@/lib/rate-limit';
import { waitForNominatimThrottle } from '@/lib/nominatim-throttle';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NOMINATIM_USER_AGENT = 'Parkway Driveway Rental Platform (https://github.com/parkway)';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES
): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': NOMINATIM_USER_AGENT },
  });
  const shouldRetry =
    retries > 0 &&
    (res.status === 429 || (res.status >= 500 && res.status < 600));
  if (shouldRetry) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return fetchWithRetry(url, retries - 1);
  }
  return res;
}

/** Proxy Nominatim search to avoid CORS and respect usage policy. Optional viewbox for Jersey City. */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.geocode(request as unknown as Request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error ?? 'Too many searches. Please wait a moment and try again.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    await waitForNominatimThrottle();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const bounded = searchParams.get('bounded') ?? '1';
    const viewboxParam = searchParams.get('viewbox'); // optional: market slug (e.g. "jersey") or raw "minlon,minlat,maxlon,maxlat"
    if (!q || !q.trim()) {
      return NextResponse.json(
        { error: 'Search query is required', code: 'MISSING_QUERY' },
        { status: 400 }
      );
    }
    const params = new URLSearchParams({
      format: 'json',
      q: q.trim(),
      limit,
      addressdetails: '1',
      bounded,
      countrycodes: 'us',
    });
    const box = viewboxParam ? resolveViewbox(viewboxParam) : undefined;
    if (box) {
      params.set('viewbox', box);
      params.set('bounded', '1');
    }
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      const message =
        res.status === 429
          ? 'Too many requests. Please try again in a moment.'
          : res.status >= 500
            ? 'Search service temporarily unavailable. Please try again.'
            : 'Search failed.';
      return NextResponse.json(
        { error: message, code: res.status === 429 ? 'RATE_LIMITED' : 'SEARCH_FAILED' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Geocode search error:', e);
    return NextResponse.json(
      { error: 'Search is temporarily unavailable. Please try again.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
