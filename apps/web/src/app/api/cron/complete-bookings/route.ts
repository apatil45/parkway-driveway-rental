import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse } from '@parkway/shared';

/**
 * Cron Job: Mark bookings as COMPLETED after endTime
 * 
 * This endpoint should be called by Vercel Cron Jobs every hour
 * Vercel Cron config: vercel.json
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
    console.error('[CRON] Complete bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to complete bookings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

