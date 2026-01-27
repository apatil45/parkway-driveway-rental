import { NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { requireDevelopment } from '@/lib/api-protection';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Only allow in development/preview
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;
  try {
    logger.debug('[TEST] Testing serverless Prisma client');
    
    // Test basic connection
    await prisma.$connect();
    logger.debug('[TEST] Database connected successfully');
    
    // Test user count
    const userCount = await prisma.user.count();
    logger.debug(`[TEST] User count: ${userCount}`);
    
    // Test driveway count
    const drivewayCount = await prisma.driveway.count();
    logger.debug(`[TEST] Driveway count: ${drivewayCount}`);
    
    // Test booking count
    const bookingCount = await prisma.booking.count();
    logger.debug(`[TEST] Booking count: ${bookingCount}`);
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Serverless database test successful',
      data: {
        userCount,
        drivewayCount,
        bookingCount,
        databaseConnected: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('[TEST] Serverless database test failed', {}, error instanceof Error ? error : undefined);
    return NextResponse.json({
      success: false,
      message: 'Serverless database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
