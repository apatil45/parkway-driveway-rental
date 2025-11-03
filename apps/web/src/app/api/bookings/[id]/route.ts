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
      return NextResponse.json(createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'), { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id as string;

    const body = await request.json();
    const { status } = body as { status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' };
    if (!status) {
      return NextResponse.json(createApiError('Missing status', 400, 'VALIDATION_ERROR'), { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
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


