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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        createApiError('User not found', 404, 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(createApiResponse(user, 'Profile retrieved successfully'));
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve profile', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { name, phone, address, avatar } = body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json(
        createApiError('Name must be at least 2 characters', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (avatar !== undefined) updateData.avatar = avatar?.trim() || null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(
      createApiResponse(user, 'Profile updated successfully', 200),
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      createApiError('Failed to update profile', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

