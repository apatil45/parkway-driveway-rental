import { NextResponse } from 'next/server';

/**
 * Check if route should be accessible in current environment
 * Test/debug routes should only work in development/preview
 */
export function requireDevelopment() {
  const isDev = process.env.NODE_ENV === 'development';
  const isPreview = process.env.VERCEL_ENV === 'preview';
  
  if (!isDev && !isPreview) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
  
  return null;
}

