import { NextResponse } from 'next/server';
import { requireDevelopment } from '@/lib/api-protection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Only allow in development/preview
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;
  try {
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      message: 'Environment test successful',
      data: envVars
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Environment test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
