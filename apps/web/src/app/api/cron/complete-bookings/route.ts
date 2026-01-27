import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse } from '@parkway/shared';
import { logger } from '@/lib/logger';

/**
 * Cron Job: Mark bookings as COMPLETED after endTime
 * 
 * This endpoint is called by Vercel Cron Jobs once per day (Hobby plan limitation)
 * Vercel Cron config: vercel.json
 * Schedule: Daily at 1 AM (0 1 * * *)
 * 
 * Note: Due to Vercel Hobby plan limitations, this runs once per day instead of hourly.
 * Bookings are marked as completed when their endTime has passed.
 * 
 * Completes bookings that:
 * - Are CONFIRMED status
 * - Have endTime in the past
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

    // Find and complete bookings that have ended
    const completedBookings = await prisma.booking.updateMany({
      where: {
        status: 'CONFIRMED',
        endTime: {
          lt: now
        }
      },
      data: {
        status: 'COMPLETED'
      }
    });

    return NextResponse.json(
      createApiResponse(
        {
          completedCount: completedBookings.count,
          timestamp: now.toISOString()
        },
        `Marked ${completedBookings.count} booking(s) as completed`
      )
    );
  } catch (error) {
    logger.error('[CRON] Complete bookings error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Failed to complete bookings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

