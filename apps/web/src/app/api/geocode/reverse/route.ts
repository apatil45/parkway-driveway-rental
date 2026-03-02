import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/rate-limit';
import { waitForNominatimThrottle } from '@/lib/nominatim-throttle';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NOMINATIM_USER_AGENT = 'Parkway Driveway Rental Platform (https://github.com/parkway)';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
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

/** Proxy reverse geocode (lat/lon → address) to avoid CORS and respect Nominatim usage policy */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.geocode(request as unknown as Request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error ?? 'Too many requests. Please try again in a moment.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    await waitForNominatimThrottle();

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required', code: 'MISSING_COORDS' },
        { status: 400 }
      );
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&countrycodes=us`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      const message =
        res.status === 429
          ? 'Too many requests. Please try again in a moment.'
          : res.status >= 500
            ? 'Geocoding temporarily unavailable. Please try again.'
            : 'Geocoding failed.';
      return NextResponse.json(
        { error: message, code: res.status === 429 ? 'RATE_LIMITED' : 'GEOCODE_FAILED' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Geocode reverse error:', e);
    return NextResponse.json(
      { error: 'Geocoding is temporarily unavailable. Please try again.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
