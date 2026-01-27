import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json(
      createApiResponse(null, 'All notifications marked as read', 200),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Mark all read error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError('Failed to mark notifications as read', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

