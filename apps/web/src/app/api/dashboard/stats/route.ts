import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'] as const;
const COMPLETED_OR_CONFIRMED = ['CONFIRMED', 'COMPLETED'] as const;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

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

    const bookingScope = {
      OR: [
        { userId },
        ...(isOwner ? [{ driveway: { ownerId: userId } }] : [])
      ]
    };

    const [
      totalBookings,
      activeBookings,
      completedOrConfirmedBookings,
      totalEarnings,
      averageRating
    ] = await Promise.all([
      prisma.booking.count({ where: bookingScope }),

      prisma.booking.count({
        where: {
          ...bookingScope,
          status: { in: ACTIVE_STATUSES }
        }
      }),

      prisma.booking.count({
        where: {
          ...bookingScope,
          status: { in: COMPLETED_OR_CONFIRMED }
        }
      }),

      isOwner
        ? prisma.booking.aggregate({
            where: {
              driveway: { ownerId: userId },
              paymentStatus: 'COMPLETED'
            },
            _sum: { totalPrice: true }
          }).then((r) => (r._sum?.totalPrice ?? 0) as number)
        : Promise.resolve(0),

      isOwner
        ? prisma.review
            .aggregate({
              where: { driveway: { ownerId: userId } },
              _avg: { rating: true },
              _count: { rating: true }
            })
            .then((r) => (r._count.rating > 0 && r._avg?.rating != null ? Number(r._avg.rating.toFixed(1)) : null))
        : (async () => {
            const completedBookings = await prisma.booking.findMany({
              where: { userId, status: 'COMPLETED' },
              select: { drivewayId: true }
            });
            const drivewayIds = [...new Set(completedBookings.map((b) => b.drivewayId))];
            if (drivewayIds.length === 0) return null;
            const r = await prisma.review.aggregate({
              where: { drivewayId: { in: drivewayIds } },
              _avg: { rating: true },
              _count: { rating: true }
            });
            return r._count.rating > 0 && r._avg?.rating != null ? Number(r._avg.rating.toFixed(1)) : null;
          })()
    ]);

    const stats = {
      totalBookings,
      activeBookings,
      completedOrConfirmedBookings,
      totalEarnings: isOwner ? totalEarnings : 0,
      totalEarningsScope: isOwner ? ('owner' as const) : null,
      averageRating
    };

    return NextResponse.json(createApiResponse(stats, 'Dashboard stats retrieved successfully'));
  } catch (error) {
    logger.error('Dashboard stats error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError('Failed to retrieve dashboard stats', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
