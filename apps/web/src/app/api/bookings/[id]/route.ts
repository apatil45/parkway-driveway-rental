import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    const { status } = body as { status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' };
    if (!status) {
      return NextResponse.json(createApiError('Missing status', 400, 'VALIDATION_ERROR'), { status: 400 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { driveway: { select: { ownerId: true } } },
    });
    if (!booking) {
      return NextResponse.json(createApiError('Booking not found', 404, 'NOT_FOUND'), { status: 404 });
    }

    const isDriver = booking.userId === userId;
    const isOwner = booking.driveway.ownerId === userId;

    // Role-based transitions
    if (isDriver) {
      // Driver may cancel PENDING/CONFIRMED before start
      if (status !== 'CANCELLED') {
        return NextResponse.json(createApiError('Driver can only cancel', 403, 'FORBIDDEN'), { status: 403 });
      }
    } else if (isOwner) {
      // Owner may CONFIRM or CANCEL
      if (status !== 'CONFIRMED' && status !== 'CANCELLED') {
        return NextResponse.json(createApiError('Owner can confirm or cancel', 403, 'FORBIDDEN'), { status: 403 });
      }
    } else {
      return NextResponse.json(createApiError('Not allowed', 403, 'FORBIDDEN'), { status: 403 });
    }

    // Ensure status and paymentStatus remain consistent
    const updateData: any = { status };
    
    // If cancelling, also mark payment as failed if pending
    if (status === 'CANCELLED' && booking.paymentStatus === 'PENDING') {
      updateData.paymentStatus = 'FAILED';
    }
    
    // If confirming, ensure payment is completed
    if (status === 'CONFIRMED' && booking.paymentStatus !== 'COMPLETED') {
      // Only allow if manually confirmed by owner (payment might be processed separately)
      // Don't auto-update paymentStatus here - let webhook handle it
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: updateData,
      include: {
        driveway: {
          select: {
            id: true,
            title: true,
            address: true,
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json(createApiResponse(updated, 'Booking updated')); 
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(createApiError('Failed to update booking', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}


