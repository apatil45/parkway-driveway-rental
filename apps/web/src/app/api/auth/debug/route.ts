import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Debug endpoint to check auth environment setup
 * Remove this in production or protect with admin access
 */
export async function GET() {
  const env = {
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
    hasDbUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    // Don't expose actual values
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    dbUrlExists: !!process.env.DATABASE_URL,
  };

  return NextResponse.json({
    success: true,
    environment: env,
    allSet: env.hasJwtSecret && env.hasDbUrl,
    warnings: [
      !env.hasJwtSecret && 'JWT_SECRET is missing',
      !env.hasJwtRefreshSecret && 'JWT_REFRESH_SECRET is missing (will use JWT_SECRET)',
      !env.hasDbUrl && 'DATABASE_URL is missing',
    ].filter(Boolean),
  });
}

