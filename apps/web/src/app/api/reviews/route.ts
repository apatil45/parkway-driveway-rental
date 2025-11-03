import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const drivewayId = searchParams.get('drivewayId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (drivewayId) where.drivewayId = drivewayId;
    if (userId) where.userId = userId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          driveway: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.review.count({ where })
    ]);

    // Calculate average rating for driveway if drivewayId provided (using aggregation)
    let averageRating = 0;
    if (drivewayId) {
      const avgResult = await prisma.review.aggregate({
        where: { drivewayId },
        _avg: { rating: true },
        _count: true
      });
      if (avgResult._avg.rating !== null) {
        averageRating = avgResult._avg.rating;
      }
    }

    return NextResponse.json(createApiResponse({
      reviews,
      averageRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Reviews retrieved successfully'));
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve reviews', 500, 'INTERNAL_ERROR'),
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
    
    // Validate input
    const validationResult = createReviewSchema.safeParse(body);
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
    
    const { drivewayId, rating, comment }: CreateReviewInput = validationResult.data;

    // Check if user has a completed booking for this driveway
    const hasBooking = await prisma.booking.findFirst({
      where: {
        userId,
        drivewayId,
        status: 'COMPLETED'
      }
    });

    if (!hasBooking) {
      return NextResponse.json(
        createApiError('You can only review driveways you have booked and completed', 403, 'NO_BOOKING'),
        { status: 403 }
      );
    }

    // Try to create or update review
    // Use upsert to handle unique constraint
    const review = await prisma.review.upsert({
      where: {
        userId_drivewayId: {
          userId,
          drivewayId
        }
      },
      update: {
        rating,
        comment: comment || null
      },
      create: {
        userId,
        drivewayId,
        rating,
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json(
      createApiResponse(review, 'Review submitted successfully', 201),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      createApiError('Failed to create review', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

