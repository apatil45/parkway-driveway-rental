import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Public stats endpoint - no authentication required
 * Returns platform-wide statistics for display on the home page
 */
export async function GET(request: NextRequest) {
  try {
    // Get platform-wide statistics
    const [
      totalUsers,
      totalDriveways,
      activeDriveways,
      totalBookings,
      completedBookings,
      totalEarnings,
      averageRating
    ] = await Promise.all([
      // Total registered users
      prisma.user.count({
        where: { isActive: true }
      }),

      // Total driveways
      prisma.driveway.count({
        where: { isActive: true }
      }),

      // Active and available driveways
      prisma.driveway.count({
        where: {
          isActive: true,
          isAvailable: true
        }
      }),

      // Total bookings
      prisma.booking.count(),

      // Completed bookings
      prisma.booking.count({
        where: { status: 'COMPLETED' }
      }),

      // Total earnings (from completed payments)
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      }).then((result: any) => result._sum.totalPrice || 0),

      // Average rating across all driveways
      prisma.review.aggregate({
        _avg: { rating: true }
      }).then((result: any) => result._avg.rating || 0)
    ]);

    const stats = {
      totalUsers,
      totalDriveways,
      activeDriveways,
      totalBookings,
      completedBookings,
      totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
      averageRating: Number(averageRating.toFixed(1))
    };

    return NextResponse.json(createApiResponse(stats, 'Public stats retrieved successfully'));
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve public stats', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

