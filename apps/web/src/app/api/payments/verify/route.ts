import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify payment status and update booking immediately after payment success
 * This provides immediate feedback while webhook processes in background
 */
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch block
  let bookingId: string | undefined;
  let paymentIntentId: string | undefined;
  
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    bookingId = body.bookingId;
    paymentIntentId = body.paymentIntentId;

    if (!paymentIntentId || !bookingId) {
      return NextResponse.json(
        createApiError('Payment information is missing. Please try completing payment again.', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { prisma } = await import('@parkway/database');
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecret) {
      return NextResponse.json(
        createApiError('Payment processing is temporarily unavailable. Please try again later.', 503, 'SERVICE_UNAVAILABLE'),
        { status: 503 }
      );
    }

    // Verify payment intent with Stripe
    const stripe = (await import('stripe')).default;
    const client = new stripe(stripeSecret);
    
    let paymentIntent;
    try {
      paymentIntent = await client.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError: any) {
      logger.error('[PAYMENT VERIFY] Stripe error', { paymentIntentId }, stripeError instanceof Error ? stripeError : undefined);
      return NextResponse.json(
        createApiError('Failed to retrieve payment intent from Stripe', 400, 'STRIPE_ERROR'),
        { status: 400 }
      );
    }

    // Check if payment is actually succeeded or processing
    // Sometimes payment is "processing" immediately after confirmation
    if (paymentIntent.status === 'processing') {
      // Payment is processing - webhook will handle it when it succeeds
      return NextResponse.json(
        createApiResponse(
          { bookingId, status: 'PROCESSING', message: 'Payment is processing. Webhook will update booking when complete.' },
          'Payment is processing'
        )
      );
    }
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        createApiError('Your payment is still being processed. Please wait a moment and check your bookings page.', 400, 'PAYMENT_PENDING'),
        { status: 400 }
      );
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        paymentIntentId: true,
        status: true,
        paymentStatus: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        createApiError('This booking is no longer available.', 404, 'BOOKING_NOT_FOUND'),
        { status: 404 }
      );
    }

    if (booking.userId !== userId) {
      return NextResponse.json(
        createApiError('You do not have permission to verify this payment.', 403, 'FORBIDDEN'),
        { status: 403 }
      );
    }

    // Verify payment intent matches (allow if booking doesn't have paymentIntentId yet)
    if (booking.paymentIntentId && booking.paymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        createApiError('Payment information does not match this booking. Please contact support if you believe this is an error.', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    
    // Update paymentIntentId if it's not set yet
    const updateData: any = {
      paymentStatus: 'COMPLETED',
      status: 'CONFIRMED'
    };
    
    if (!booking.paymentIntentId) {
      updateData.paymentIntentId = paymentIntentId;
    }

    // If already confirmed, return success
    if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        createApiResponse({ bookingId, status: 'CONFIRMED' }, 'Booking already confirmed')
      );
    }

    // Update booking status immediately (webhook will also update, but this provides instant feedback)
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      select: {
        id: true,
        status: true,
        paymentStatus: true
      }
    });

    return NextResponse.json(
      createApiResponse({ bookingId, status: updated.status }, 'Payment verified and booking confirmed')
    );
  } catch (error: any) {
    // Log error but don't fail loudly - webhook will handle it
    logger.warn('[PAYMENT VERIFY] Error (webhook will handle)', {
      message: error.message,
      type: error.type,
      bookingId,
      paymentIntentId
    });
    
    // Return success even if verify fails - webhook is the source of truth
    // This prevents blocking the payment flow
    return NextResponse.json(
      createApiResponse(
        { bookingId: bookingId || 'unknown', status: 'PENDING', message: 'Webhook will process payment confirmation' },
        'Payment received, webhook will confirm booking'
      )
    );
  }
}

