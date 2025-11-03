import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

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
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

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

