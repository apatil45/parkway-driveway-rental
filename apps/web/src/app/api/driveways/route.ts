import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { drivewaySearchSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = drivewaySearchSchema.safeParse(Object.fromEntries(searchParams));
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError(
          'Invalid query parameters: ' + validationResult.error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }
    
    const { page, limit, location, priceMin, priceMax, carSize, amenities } = validationResult.data as any;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
      isAvailable: true
    };

    if (priceMin) {
      where.pricePerHour = { ...where.pricePerHour, gte: priceMin };
    }

    if (priceMax) {
      where.pricePerHour = { ...where.pricePerHour, lte: priceMax };
    }

    if (carSize) {
      where.carSize = { has: carSize };
    }

    // Parse amenities CSV (e.g., "covered,security") and require all if provided
    if (amenities) {
      const list = String(amenities)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) {
        where.amenities = { hasEvery: list };
      }
    }

    // Optional: radius search if latitude/longitude + radius provided via query
    const lat = searchParams.get('latitude');
    const lon = searchParams.get('longitude');
    const rad = searchParams.get('radius'); // km

    // Fallback filtering in JS for radius if provided (simple post-filter)
    let drivewaysRaw: any[] = [];

    // Optional owner=me filter requires auth cookie
    const ownerFilter = searchParams.get('owner');
    let authUserId: string | undefined;
    if (ownerFilter === 'me') {
      const token = (request as any).cookies?.get?.('access_token')?.value;
      if (token) {
        try { authUserId = (jwt.verify(token, process.env.JWT_SECRET!) as any)?.id; } catch {}
      }
      if (authUserId) {
        (where as any).ownerId = authUserId;
      }
    }

    const [driveways, total] = await Promise.all([
      prisma.driveway.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.driveway.count({ where })
    ]);

    // Calculate average ratings
    let drivewaysWithRatings = driveways.map((driveway: any) => ({
      ...driveway,
      averageRating: driveway.reviews.length > 0 
        ? driveway.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / driveway.reviews.length
        : 0,
      reviewCount: driveway.reviews.length
    }));

    if (lat && lon && rad) {
      const R = 6371; // km
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const radNum = parseFloat(rad);
      if (Number.isFinite(latNum) && Number.isFinite(lonNum) && Number.isFinite(radNum) && radNum > 0) {
        drivewaysWithRatings = drivewaysWithRatings.filter((d: any) => {
          const dLat = (d.latitude - latNum) * Math.PI / 180;
          const dLon = (d.longitude - lonNum) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(latNum * Math.PI/180) * Math.cos(d.latitude * Math.PI/180) * Math.sin(dLon/2)**2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;
          return dist <= radNum;
        });
      }
    }

    return NextResponse.json(createApiResponse({
      driveways: drivewaysWithRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Driveways retrieved successfully'));
  } catch (error) {
    console.error('Get driveways error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve driveways', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json(createApiError('Unauthorized', 401, 'UNAUTHORIZED'), { status: 401 });
    let userId: string | undefined;
    try { userId = (jwt.verify(token, process.env.JWT_SECRET!) as any)?.id; } catch {}
    if (!userId) return NextResponse.json(createApiError('Unauthorized', 401, 'UNAUTHORIZED'), { status: 401 });

    const body = await request.json();
    const { title, address, pricePerHour, capacity, amenities = [], images = [], latitude, longitude, carSize } = body || {};
    if (!title || !address || !pricePerHour || !capacity) {
      return NextResponse.json(createApiError('Missing required fields', 400, 'VALIDATION_ERROR'), { status: 400 });
    }

    const created = await prisma.driveway.create({
      data: {
        title,
        address,
        pricePerHour: Number(pricePerHour),
        capacity: Number(capacity),
        amenities,
        images,
        latitude: latitude != null ? Number(latitude) : 37.7749,
        longitude: longitude != null ? Number(longitude) : -122.4194,
        carSize: Array.isArray(carSize) && carSize.length ? carSize : ['small','medium','large'],
        isActive: true,
        isAvailable: true,
        ownerId: userId,
      },
      select: { id: true, title: true, address: true, pricePerHour: true, capacity: true, isActive: true }
    });
    return NextResponse.json(createApiResponse(created, 'Driveway created', 201), { status: 201 });
  } catch (e) {
    console.error('Create driveway error', e);
    return NextResponse.json(createApiError('Failed to create driveway', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}
