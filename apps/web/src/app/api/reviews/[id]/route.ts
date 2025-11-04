import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const { id } = await params;
    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return NextResponse.json(
        createApiError('Review not found', 404, 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if (review.userId !== userId) {
      return NextResponse.json(
        createApiError('You can only delete your own reviews', 403, 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id }
    });

    return NextResponse.json(
      createApiResponse(null, 'Review deleted successfully', 200),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      createApiError('Failed to delete review', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

