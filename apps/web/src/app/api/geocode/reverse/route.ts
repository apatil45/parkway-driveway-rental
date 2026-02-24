import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Proxy reverse geocode (lat/lon → address) to avoid CORS and respect Nominatim usage policy */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&countrycodes=us`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Parkway Driveway Rental Platform (https://github.com/parkway)' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Geocode reverse error:', e);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
