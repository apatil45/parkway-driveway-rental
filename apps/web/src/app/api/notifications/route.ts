import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return NextResponse.json(createApiResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Notifications retrieved successfully'));
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve notifications', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { title, message, type = 'info' } = body;

    if (!title || !message) {
      return NextResponse.json(
        createApiError('Title and message are required', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });

    return NextResponse.json(
      createApiResponse(notification, 'Notification created successfully', 201),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      createApiError('Failed to create notification', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

