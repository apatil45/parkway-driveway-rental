import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing Prisma import...');
    
    // Test importing Prisma client
    let prisma;
    try {
      const { PrismaClient } = await import('@prisma/client');
      console.log('✅ PrismaClient imported successfully');
      
      prisma = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      console.log('✅ PrismaClient instance created');
      
      // Test connection
      await prisma.$connect();
      console.log('✅ Database connected');
      
      // Test query
      const userCount = await prisma.user.count();
      console.log(`✅ User count: ${userCount}`);
      
      await prisma.$disconnect();
      console.log('✅ Database disconnected');
      
      return NextResponse.json({
        success: true,
        message: 'Prisma import and connection test successful',
        data: {
          userCount,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (prismaError) {
      console.error('❌ Prisma error:', prismaError);
      return NextResponse.json({
        success: false,
        message: 'Prisma import/connection failed',
        error: prismaError instanceof Error ? prismaError.message : 'Unknown Prisma error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({
      success: false,
      message: 'General test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
