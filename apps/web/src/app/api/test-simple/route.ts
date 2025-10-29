import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing simple API route...');
    
    // Test basic functionality without database
    const testData = {
      message: 'Simple API test successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    };
    
    console.log('✅ Simple test completed');
    
    return NextResponse.json({
      success: true,
      message: 'Simple API test successful',
      data: testData
    });
  } catch (error) {
    console.error('❌ Simple test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Simple test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
