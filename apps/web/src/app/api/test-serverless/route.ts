import { NextResponse } from 'next/server';
import { prisma } from '@parkway/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing serverless Prisma client...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    // Test driveway count
    const drivewayCount = await prisma.driveway.count();
    console.log(`✅ Driveway count: ${drivewayCount}`);
    
    // Test booking count
    const bookingCount = await prisma.booking.count();
    console.log(`✅ Booking count: ${bookingCount}`);
    
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
    console.error('❌ Serverless database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Serverless database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
