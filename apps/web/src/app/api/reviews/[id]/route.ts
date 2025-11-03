import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: params.id }
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
      where: { id: params.id }
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

