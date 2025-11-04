import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiError, createApiResponse } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { createDrivewaySchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = createDrivewaySchema.partial().safeParse(body);
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

    const { id } = await params;
    // Check if driveway exists and user owns it
    const existing = await prisma.driveway.findUnique({ 
      where: { id }, 
      select: { id: true, ownerId: true } 
    });
    
    if (!existing) {
      return NextResponse.json(createApiError('Driveway not found', 404, 'NOT_FOUND'), { status: 404 });
    }
    
    if (existing.ownerId !== userId) {
      return NextResponse.json(createApiError('You can only update your own driveways', 403, 'FORBIDDEN'), { status: 403 });
    }

    const updateData: any = {};
    if (validationResult.data.title !== undefined) updateData.title = validationResult.data.title;
    if (validationResult.data.description !== undefined) updateData.description = validationResult.data.description;
    if (validationResult.data.address !== undefined) updateData.address = validationResult.data.address;
    if (validationResult.data.pricePerHour !== undefined) updateData.pricePerHour = validationResult.data.pricePerHour;
    if (validationResult.data.capacity !== undefined) updateData.capacity = validationResult.data.capacity;
    if (validationResult.data.amenities !== undefined) updateData.amenities = validationResult.data.amenities;
    if (validationResult.data.images !== undefined) updateData.images = validationResult.data.images;
    if (validationResult.data.latitude !== undefined) updateData.latitude = validationResult.data.latitude;
    if (validationResult.data.longitude !== undefined) updateData.longitude = validationResult.data.longitude;
    if (validationResult.data.carSize !== undefined) updateData.carSize = validationResult.data.carSize;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable);

    const updated = await prisma.driveway.update({
      where: { id },
      data: updateData,
      select: { 
        id: true, 
        title: true, 
        description: true,
        address: true, 
        pricePerHour: true, 
        capacity: true, 
        isActive: true,
        isAvailable: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(createApiResponse(updated, 'Driveway updated successfully'));
  } catch (error) {
    console.error('Update driveway error:', error);
    return NextResponse.json(createApiError('Failed to update driveway', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}

// imports already declared above

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
