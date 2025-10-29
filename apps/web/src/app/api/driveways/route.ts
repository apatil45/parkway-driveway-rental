import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const location = searchParams.get('location');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const carSize = searchParams.get('carSize');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
      isAvailable: true
    };

    if (priceMin) {
      where.pricePerHour = { ...where.pricePerHour, gte: parseFloat(priceMin) };
    }

    if (priceMax) {
      where.pricePerHour = { ...where.pricePerHour, lte: parseFloat(priceMax) };
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
    const drivewaysWithRatings = driveways.map(driveway => ({
      ...driveway,
      averageRating: driveway.reviews.length > 0 
        ? driveway.reviews.reduce((sum, review) => sum + review.rating, 0) / driveway.reviews.length
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
