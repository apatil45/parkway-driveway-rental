import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { requireDevelopment } from '@/lib/api-protection';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Only allow in development/preview
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;

  try {
    logger.debug('Test API route called');
    
    // Test basic Prisma query
    const userCount = await prisma.user.count();
    logger.debug(`Found ${userCount} users`);
    
    // Test driveways query
    const driveways = await prisma.driveway.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      take: 5
    });
    
    logger.debug(`Found ${driveways.length} driveways`);
    
    return NextResponse.json({
      success: true,
      message: 'Test successful',
      data: {
        userCount,
        drivewayCount: driveways.length,
        sampleDriveway: driveways[0] || null
      }
    });
  } catch (error) {
    logger.error('Test API error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
