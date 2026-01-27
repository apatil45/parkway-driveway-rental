import { NextResponse } from 'next/server';
import { requireDevelopment } from '@/lib/api-protection';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Only allow in development/preview
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;
  try {
    logger.debug('[TEST] Testing simple API route');
    
    // Test basic functionality without database
    const testData = {
      message: 'Simple API test successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    };
    
    logger.debug('[TEST] Simple test completed');
    
    return NextResponse.json({
      success: true,
      message: 'Simple API test successful',
      data: testData
    });
  } catch (error) {
    logger.error('[TEST] Simple test failed', {}, error instanceof Error ? error : undefined);
    return NextResponse.json({
      success: false,
      message: 'Simple test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
