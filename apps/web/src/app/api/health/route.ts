import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@parkway/database';

export async function GET(request: NextRequest) {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
