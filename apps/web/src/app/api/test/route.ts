import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Test API route called');
    
    // Test basic Prisma query
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users`);
    
    // Test driveways query
    const driveways = await prisma.driveway.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      take: 5
    });
    
    console.log(`Found ${driveways.length} driveways`);
    
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
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
