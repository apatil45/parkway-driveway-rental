import { NextRequest, NextResponse } from 'next/server';
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
    
    const { page, limit, location, priceMin, priceMax, carSize } = validationResult.data;
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

    // Get driveways with pagination
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
    const drivewaysWithRatings = driveways.map((driveway: any) => ({
      ...driveway,
      averageRating: driveway.reviews.length > 0 
        ? driveway.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / driveway.reviews.length
        : 0,
      reviewCount: driveway.reviews.length
    }));

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
