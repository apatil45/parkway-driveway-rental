import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    const { isRead } = body;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!notification) {
      return NextResponse.json(
        createApiError('Notification not found', 404, 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if (notification.userId !== userId) {
      return NextResponse.json(
        createApiError('Access denied', 403, 'FORBIDDEN'),
        { status: 403 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: isRead === true || isRead === 'true' }
    });

    return NextResponse.json(
      createApiResponse(updated, 'Notification updated successfully', 200),
      { status: 200 }
    );
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      createApiError('Failed to update notification', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!notification) {
      return NextResponse.json(
        createApiError('Notification not found', 404, 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if (notification.userId !== userId) {
      return NextResponse.json(
        createApiError('Access denied', 403, 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await prisma.notification.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      createApiResponse(null, 'Notification deleted successfully', 200),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      createApiError('Failed to delete notification', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

