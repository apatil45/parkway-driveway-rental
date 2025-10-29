import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing database connection with SSL...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL not found',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Add SSL parameters to the database URL
    const sslDbUrl = dbUrl + '?sslmode=require';
    console.log('Testing with SSL URL:', sslDbUrl.replace(/:[^:@]+@/, ':***@'));
    
    // Test Prisma with SSL
    const { PrismaClient } = await import('@prisma/client');
    
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: sslDbUrl,
        },
      },
    });
    
    console.log('✅ PrismaClient created with SSL');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected with SSL');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection with SSL successful',
      data: {
        userCount,
        sslEnabled: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ SSL database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'SSL database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
