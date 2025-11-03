import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    // Get user to check roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true }
    });

    if (!user) {
      return NextResponse.json(
        createApiError('User not found', 404, 'USER_NOT_FOUND'),
        { status: 404 }
      );
    }

    const isOwner = user.roles.includes('OWNER');
    const isDriver = user.roles.includes('DRIVER');

    // Get booking statistics
    const [
      totalBookings,
      activeBookings,
      totalEarnings,
      averageRating
    ] = await Promise.all([
      // Total bookings (as driver or owner)
      prisma.booking.count({
        where: {
          OR: [
            { userId }, // Bookings made by user
            ...(isOwner ? [{ driveway: { ownerId: userId } }] : []) // Bookings for user's driveways
          ]
        }
      }),

      // Active bookings (confirmed or pending)
      prisma.booking.count({
        where: {
          OR: [
            { userId, status: { in: ['PENDING', 'CONFIRMED'] as any } },
            ...(isOwner ? [{ driveway: { ownerId: userId }, status: { in: ['PENDING', 'CONFIRMED'] as any } }] : [])
          ]
        }
      }),

      // Total earnings (only for owners)
      isOwner ? prisma.booking.aggregate({
        where: {
          driveway: { ownerId: userId },
          paymentStatus: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      }).then((result: any) => result._sum.totalPrice || 0) : 0,

      // Average rating (from reviews)
      prisma.review.aggregate({
        where: {
          OR: [
            { userId }, // Reviews given by user
            ...(isOwner ? [{ driveway: { ownerId: userId } }] : []) // Reviews for user's driveways
          ]
        },
        _avg: { rating: true }
      }).then((result: any) => result._avg.rating || 0)
    ]);

    const stats = {
      totalBookings,
      activeBookings,
      totalEarnings: isOwner ? totalEarnings : 0,
      averageRating: Number(averageRating.toFixed(1))
    };

    return NextResponse.json(createApiResponse(stats, 'Dashboard stats retrieved successfully'));
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve dashboard stats', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
