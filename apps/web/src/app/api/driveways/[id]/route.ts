import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiError, createApiResponse } from '@parkway/shared';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json(createApiError('Unauthorized', 401, 'UNAUTHORIZED'), { status: 401 });
    let userId: string | undefined;
    try { userId = (jwt.verify(token, process.env.JWT_SECRET!) as any)?.id; } catch {}
    if (!userId) return NextResponse.json(createApiError('Unauthorized', 401, 'UNAUTHORIZED'), { status: 401 });

    const body = await request.json();
    const existing = await prisma.driveway.findUnique({ where: { id: params.id }, select: { id: true, ownerId: true } });
    if (!existing) return NextResponse.json(createApiError('Not found', 404, 'NOT_FOUND'), { status: 404 });
    if (existing.ownerId !== userId) return NextResponse.json(createApiError('Forbidden', 403, 'FORBIDDEN'), { status: 403 });

    const updated = await prisma.driveway.update({
      where: { id: params.id },
      data: {
        title: body.title,
        address: body.address,
        pricePerHour: body.pricePerHour != null ? Number(body.pricePerHour) : undefined,
        capacity: body.capacity != null ? Number(body.capacity) : undefined,
        amenities: body.amenities,
        images: body.images,
        isActive: body.isActive,
        isAvailable: body.isAvailable,
      },
      select: { id: true, title: true, address: true, pricePerHour: true, capacity: true, isActive: true }
    });
    return NextResponse.json(createApiResponse(updated, 'Driveway updated'));
  } catch (e) {
    console.error('Update driveway error', e);
    return NextResponse.json(createApiError('Failed to update driveway', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}

// imports already declared above

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
      ? driveway.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / driveway.reviews.length
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
