import { NextRequest, NextResponse } from 'next/server';
import { requireDevelopment } from '@/lib/api-protection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Only allow in development/preview
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;
  try {
    console.log('Environment test API route called');
    
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    };
    
    console.log('Environment variables:', envVars);
    
    return NextResponse.json({
      success: true,
      message: 'Environment test successful',
      data: envVars
    });
  } catch (error) {
    console.error('Environment test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Environment test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
