import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const driveway = await prisma.driveway.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!driveway) {
      return NextResponse.json(
        createApiError('Driveway not found', 404, 'DRIVEWAY_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = driveway.reviews.length > 0 
      ? driveway.reviews.reduce((sum, review) => sum + review.rating, 0) / driveway.reviews.length
      : 0;

    const drivewayWithRating = {
      ...driveway,
      averageRating,
      reviewCount: driveway.reviews.length
    };

    return NextResponse.json(createApiResponse(drivewayWithRating, 'Driveway retrieved successfully'));
  } catch (error) {
    console.error('Get driveway error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve driveway', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
