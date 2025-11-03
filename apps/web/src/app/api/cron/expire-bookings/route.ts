import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse } from '@parkway/shared';

/**
 * Cron Job: Expire PENDING bookings that haven't been paid
 * 
 * This endpoint should be called by Vercel Cron Jobs every 15 minutes
 * Vercel Cron config: vercel.json
 * 
 * Expires bookings that:
 * - Are PENDING status
 * - Were created more than 15 minutes ago
 * - Have not been paid (paymentStatus is PENDING)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const expirationTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

    // Find and expire old pending bookings
    const expiredBookings = await prisma.booking.updateMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: {
          lt: expirationTime
        }
      },
      data: {
        status: 'EXPIRED',
        paymentStatus: 'FAILED'
      }
    });

    // Create notifications for expired bookings
    if (expiredBookings.count > 0) {
      const expiredBookingIds = await prisma.booking.findMany({
        where: {
          status: 'EXPIRED',
          paymentStatus: 'FAILED',
          updatedAt: {
            gte: new Date(now.getTime() - 1000) // Just updated
          }
        },
        select: {
          id: true,
          userId: true,
          driveway: {
            select: {
              ownerId: true,
              title: true
            }
          }
        }
      });

      await prisma.notification.createMany({
        data: expiredBookingIds.flatMap(booking => [
          {
            userId: booking.userId,
            title: 'Booking Expired',
            message: `Your booking for ${booking.driveway.title} has expired due to non-payment.`,
            type: 'warning'
          },
          {
            userId: booking.driveway.ownerId,
            title: 'Booking Expired',
            message: `A booking request for ${booking.driveway.title} has expired.`,
            type: 'info'
          }
        ])
      });
    }

    return NextResponse.json(
      createApiResponse(
        {
          expiredCount: expiredBookings.count,
          timestamp: now.toISOString()
        },
        `Expired ${expiredBookings.count} booking(s)`
      )
    );
  } catch (error) {
    console.error('[CRON] Expire bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to expire bookings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

