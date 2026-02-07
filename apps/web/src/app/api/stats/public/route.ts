import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Public stats endpoint - no authentication required
 * Returns platform-wide statistics for display on the home page
 */
export async function GET(request: NextRequest) {
  try {
    // Get platform-wide statistics (await aggregates so we get numbers, not Promises)
    const [
      totalUsers,
      totalDriveways,
      activeDriveways,
      totalBookings,
      completedBookings,
      earningsResult,
      ratingResult
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.driveway.count({ where: { isActive: true } }),
      prisma.driveway.count({
        where: { isActive: true, isAvailable: true }
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      }),
      prisma.review.aggregate({
        _avg: { rating: true }
      })
    ]);

    const totalEarnings = Number(earningsResult._sum?.totalPrice ?? 0);
    const avgRating = ratingResult._avg?.rating ?? 0;

    const stats = {
      totalUsers,
      totalDriveways,
      activeDriveways,
      totalBookings,
      completedBookings,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      averageRating: Number(Number(avgRating).toFixed(1))
    };

    const response = NextResponse.json(createApiResponse(stats, 'Public stats retrieved successfully'));
    
    // Cache public stats for 5 minutes (stale-while-revalidate for 10 minutes)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    logger.error('Public stats error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError('Failed to retrieve public stats', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

