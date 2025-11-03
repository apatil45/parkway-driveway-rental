import { NextResponse } from 'next/server';
import { requireDevelopment } from '@/lib/api-protection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Only allow in development/preview
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;
  try {
    console.log('[TEST] Testing Prisma import...');
    
    // Test importing Prisma client
    let prisma;
    try {
      const { PrismaClient } = await import('@prisma/client');
      console.log('[TEST] PrismaClient imported successfully');
      
      prisma = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      console.log('[TEST] PrismaClient instance created');
      
      // Test connection
      await prisma.$connect();
      console.log('[TEST] Database connected');
      
      // Test query
      const userCount = await prisma.user.count();
      console.log(`[TEST] User count: ${userCount}`);
      
      await prisma.$disconnect();
      console.log('[TEST] Database disconnected');
      
      return NextResponse.json({
        success: true,
        message: 'Prisma import and connection test successful',
        data: {
          userCount,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (prismaError) {
      console.error('[TEST] Prisma error:', prismaError);
      return NextResponse.json({
        success: false,
        message: 'Prisma import/connection failed',
        error: prismaError instanceof Error ? prismaError.message : 'Unknown Prisma error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[TEST] General error:', error);
    return NextResponse.json({
      success: false,
      message: 'General test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
