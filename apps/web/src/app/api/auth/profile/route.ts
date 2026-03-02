import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

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
    logger.error('Get profile error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError('Failed to retrieve profile', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    const { name, phone, address, avatar, roles: rolesBody } = body;

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

    // Roles: allow only DRIVER and OWNER (never ADMIN via self-service). At least one role required.
    if (rolesBody !== undefined) {
      const allowed = ['DRIVER', 'OWNER'];
      const raw = Array.isArray(rolesBody) ? rolesBody : [rolesBody];
      const roles = raw.filter((r: string) => allowed.includes(r));
      if (roles.length === 0) {
        return NextResponse.json(
          createApiError('Select at least one role (Driver or Owner)', 400, 'VALIDATION_ERROR'),
          { status: 400 }
        );
      }
      const existing = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
      const existingRoles = (existing?.roles as string[]) ?? [];
      const hasAdmin = existingRoles.includes('ADMIN');
      updateData.roles = hasAdmin ? Array.from(new Set([...roles, 'ADMIN'])) : Array.from(new Set(roles));
    }

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
    logger.error('Update profile error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError('Failed to update profile', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

