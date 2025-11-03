import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Internal API Routes Protection
 * All routes under /api/_internal/* require development environment
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Internal API routes - Development only',
    available: [
      '/api/_internal/test-simple',
      '/api/_internal/test-db',
      '/api/_internal/test-db-connection',
      '/api/_internal/test-db-ssl',
      '/api/_internal/test-env',
      '/api/_internal/test-prisma-import',
      '/api/_internal/test-serverless',
    ]
  });
}

