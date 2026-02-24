import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Proxy Nominatim search to avoid CORS and respect usage policy */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const bounded = searchParams.get('bounded') || '1';
    if (!q || !q.trim()) {
      return NextResponse.json({ error: 'q required' }, { status: 400 });
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim())}&limit=${limit}&addressdetails=1&bounded=${bounded}&countrycodes=us`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Parkway Driveway Rental Platform (https://github.com/parkway)' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Geocode search error:', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
