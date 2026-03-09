import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';
import { rateLimiters } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_ROUTE_DISTANCE_KM = 200;

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.routing(request as unknown as Request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createApiError(rateLimitResult.error || 'Too many routing requests', 429, 'RATE_LIMIT'),
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!fromParam || !toParam) {
      return NextResponse.json(
        createApiError('Missing from or to (use from=lat,lng&to=lat,lng)', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const fromParts = fromParam.split(',').map((s) => s.trim());
    const toParts = toParam.split(',').map((s) => s.trim());

    if (fromParts.length !== 2 || toParts.length !== 2) {
      return NextResponse.json(
        createApiError('from and to must be lat,lng (e.g. 40.7128,-74.0060)', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const fromLat = Number(fromParts[0]);
    const fromLng = Number(fromParts[1]);
    const toLat = Number(toParts[0]);
    const toLng = Number(toParts[1]);

    if (
      Number.isNaN(fromLat) || Number.isNaN(fromLng) ||
      Number.isNaN(toLat) || Number.isNaN(toLng)
    ) {
      return NextResponse.json(
        createApiError('from and to must be numbers (lat,lng)', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (
      fromLat < -90 || fromLat > 90 || fromLng < -180 || fromLng > 180 ||
      toLat < -90 || toLat > 90 || toLng < -180 || toLng > 180
    ) {
      return NextResponse.json(
        createApiError('Latitude must be -90 to 90, longitude -180 to 180', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
    if (distanceKm > MAX_ROUTE_DISTANCE_KM) {
      return NextResponse.json(
        createApiError(`Route distance exceeds ${MAX_ROUTE_DISTANCE_KM} km limit`, 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const osrmBase = process.env.OSRM_URL || 'https://router.project-osrm.org';
    const osrmUrl = `${osrmBase}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const osrmResponse = await fetch(osrmUrl);
    const osrmData = await osrmResponse.json();

    if (osrmData.code !== 'Ok' || !Array.isArray(osrmData.routes) || osrmData.routes.length === 0) {
      return NextResponse.json(
        createApiError('No route found between the two points', 404, 'NO_ROUTE'),
        { status: 404 }
      );
    }

    const route = osrmData.routes[0];
    const coordinates = route.geometry?.coordinates ?? [];
    const distance = route.distance ?? 0;
    const duration = route.duration ?? 0;

    return NextResponse.json(
      createApiResponse(
        { coordinates, distance, duration },
        'Route retrieved successfully'
      )
    );
  } catch (err) {
    return NextResponse.json(
      createApiError('Failed to get route', 500, 'ROUTING_ERROR'),
      { status: 500 }
    );
  }
}