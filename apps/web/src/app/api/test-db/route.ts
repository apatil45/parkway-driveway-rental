import { NextResponse } from 'next/server';
import { prisma } from '@parkway/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const userCount = await prisma.user.count();
    const drivewayCount = await prisma.driveway.count();
    
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      data: {
        userCount,
        drivewayCount,
        databaseConnected: true
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
