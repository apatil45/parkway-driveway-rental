import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { drivewaySearchSchema, createDrivewaySchema, type CreateDrivewayInput } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-middleware';
import { PricingService } from '@/services/PricingService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = drivewaySearchSchema.safeParse(Object.fromEntries(searchParams));
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError(
          'Please check your search filters and try again.',
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

    // Optional owner=me filter requires auth cookie
    const ownerFilter = searchParams.get('owner');
    let authUserId: string | undefined;
    if (ownerFilter === 'me') {
      const { optionalAuth } = await import('@/lib/auth-middleware');
      const auth = await optionalAuth(request);
      authUserId = auth.userId;
      if (authUserId) {
        (where as any).ownerId = authUserId;
      }
    }

    // Optional: radius search if latitude/longitude + radius provided via query
    const lat = searchParams.get('latitude');
    const lon = searchParams.get('longitude');
    const rad = searchParams.get('radius'); // km

    // If radius search is requested, we need to fetch more results and filter
    // For better performance with PostGIS, but for now we'll optimize the JS filtering
    const fetchLimit = lat && lon && rad ? limit * 3 : limit; // Fetch more if radius search

    const [driveways, total] = await Promise.all([
      prisma.driveway.findMany({
        where,
        skip,
        take: fetchLimit,
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

    // Calculate average ratings (using aggregation when possible)
    let drivewaysWithRatings = driveways.map((driveway: any) => {
      const reviewCount = driveway.reviews.length;
      const averageRating = reviewCount > 0
        ? driveway.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewCount
        : 0;
      
      return {
        ...driveway,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount
      };
    });

    // Apply radius filter if provided (optimized calculation)
    if (lat && lon && rad) {
      const R = 6371; // Earth radius in km
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const radNum = parseFloat(rad);
      
      if (Number.isFinite(latNum) && Number.isFinite(lonNum) && Number.isFinite(radNum) && radNum > 0) {
        // Pre-calculate constants for better performance
        const latRad = latNum * Math.PI / 180;
        const cosLat = Math.cos(latRad);
        
        drivewaysWithRatings = drivewaysWithRatings.filter((d: any) => {
          // Haversine formula (optimized)
          const dLat = (d.latitude - latNum) * Math.PI / 180;
          const dLon = (d.longitude - lonNum) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                   cosLat * Math.cos(d.latitude * Math.PI / 180) * 
                   Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = R * c;
          return dist <= radNum;
        });
        
        // Re-slice to limit after filtering
        drivewaysWithRatings = drivewaysWithRatings.slice(0, limit);
      }
    } else {
      // If no radius search, ensure we respect the limit
      drivewaysWithRatings = drivewaysWithRatings.slice(0, limit);
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
      createApiError('Unable to load parking spaces. Please try again in a moment.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = createDrivewaySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError(
          'Validation failed: ' + validationResult.error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    const { title, description, address, pricePerHour, capacity, amenities, images, latitude, longitude, carSize }: CreateDrivewayInput = validationResult.data;

    // Validate minimum price per hour
    // To ensure 10-minute bookings meet $0.50 minimum, pricePerHour must be at least ~$3.00/hour
    const minimumPricePerHour = PricingService.calculateMinimumPricePerHour();
    if (pricePerHour < minimumPricePerHour) {
      return NextResponse.json(
        createApiError(
          `Minimum price per hour is $${minimumPricePerHour.toFixed(2)}/hr to ensure bookings meet the $${PricingService.MIN_PRICE_DOLLARS.toFixed(2)} minimum payment requirement (for 10-minute bookings).`,
          400,
          'PRICE_TOO_LOW'
        ),
        { status: 400 }
      );
    }

    const created = await prisma.driveway.create({
      data: {
        title,
        description: description || undefined,
        address,
        pricePerHour,
        capacity,
        amenities: amenities || [],
        images: images || [],
        latitude,
        longitude,
        carSize,
        isActive: true,
        isAvailable: true,
        ownerId: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        pricePerHour: true,
        capacity: true,
        isActive: true,
        isAvailable: true,
        createdAt: true
      }
    });
    
    return NextResponse.json(createApiResponse(created, 'Driveway created successfully', 201), { status: 201 });
  } catch (error) {
    console.error('Create driveway error:', error);
    return NextResponse.json(createApiError('Unable to create your listing. Please try again in a moment.', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}
