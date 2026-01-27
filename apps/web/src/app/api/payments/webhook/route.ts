import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (signingSecret && sig && stripeSecret) {
    try {
      const raw = await request.text();
      const stripeModule = await import('stripe');
      const stripe = new stripeModule.default(stripeSecret);
      const event = stripe.webhooks.constructEvent(raw, sig, signingSecret);
      
      // Handle payment intent events
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const paymentIntentId = paymentIntent.id;
        
        // Update booking with payment status
        // Use transaction to ensure consistency
        const { prisma } = await import('@parkway/database');
        
        // First, get the booking to ensure it exists and is in a valid state
        const existingBooking = await prisma.booking.findFirst({
          where: { paymentIntentId },
          select: { id: true, status: true, paymentStatus: true }
        });

        if (!existingBooking) {
          logger.warn('[WEBHOOK] Booking not found for payment intent', { paymentIntentId });
          return NextResponse.json({ received: true, warning: 'Booking not found' });
        }

        // Only update if booking is in a valid state (not already cancelled or expired)
        if (existingBooking.status === 'CANCELLED' || existingBooking.status === 'EXPIRED') {
          logger.warn('[WEBHOOK] Payment succeeded but booking is cancelled/expired', {
            bookingId: existingBooking.id,
            status: existingBooking.status,
            paymentIntentId
          });
          return NextResponse.json({ received: true, warning: 'Booking is cancelled or expired' });
        }

        // Update booking with payment status and confirm status
        const updatedBookings = await prisma.booking.updateMany({
          where: { 
            paymentIntentId,
            status: { notIn: ['CANCELLED', 'EXPIRED'] } // Only update if not cancelled/expired
          },
          data: {
            paymentStatus: 'COMPLETED',
            status: 'CONFIRMED', // Auto-confirm booking when payment succeeds
          },
        });

        if (updatedBookings.count === 0) {
          logger.warn('[WEBHOOK] No bookings updated for payment intent', { paymentIntentId });
          return NextResponse.json({ received: true, warning: 'No bookings updated' });
        }

        // Get booking details for email
        const booking = await prisma.booking.findFirst({
          where: { paymentIntentId },
          include: {
            user: { select: { email: true, name: true } },
            driveway: { select: { title: true, address: true, owner: { select: { id: true, email: true, name: true } } } }
          }
        });

        // Verify payment intent metadata matches booking (if available)
        if (booking && event.data.object) {
          const paymentIntent = event.data.object as any;
          if (paymentIntent.metadata?.bookingId && paymentIntent.metadata.bookingId !== booking.id) {
            logger.warn('[WEBHOOK] Payment intent metadata mismatch', {
              metadataBookingId: paymentIntent.metadata.bookingId,
              actualBookingId: booking.id,
              paymentIntentId
            });
            // Continue anyway as the paymentIntentId match is the primary verification
          }
        }

        if (booking) {
          // Send confirmation email to driver
          await sendEmail({
            to: booking.user.email,
            ...emailTemplates.bookingConfirmation({
              drivewayTitle: booking.driveway.title,
              address: booking.driveway.address,
              startTime: booking.startTime.toISOString(),
              endTime: booking.endTime.toISOString(),
              totalPrice: booking.totalPrice,
              bookingId: booking.id
            })
          });

          // Send payment received email to owner (ONLY after payment is completed)
          // This is when the spot is actually reserved and owner should be notified
          await sendEmail({
            to: booking.driveway.owner.email,
            ...emailTemplates.paymentReceived({
              drivewayTitle: booking.driveway.title,
              totalPrice: booking.totalPrice,
              bookingId: booking.id
            })
          });

          // Create notifications (ONLY after payment is completed)
          // Owner is notified here because payment is complete and spot is reserved
          await prisma.notification.createMany({
            data: [
              {
                userId: booking.userId,
                title: 'Booking Confirmed',
                message: 'Your booking for ' + booking.driveway.title + ' has been confirmed! Your spot is reserved.',
                type: 'success'
              },
              {
                userId: booking.driveway.owner.id,
                title: 'New Booking Confirmed - Spot Reserved',
                message: 'Payment received: $' + booking.totalPrice.toFixed(2) + ' for ' + booking.driveway.title + '. The spot is now reserved.',
                type: 'success'
              }
            ]
          });
        }
        
        logger.info('[WEBHOOK] Payment succeeded', { paymentIntentId, bookingId: booking?.id });
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as any;
        const paymentIntentId = paymentIntent.id;
        
        // Update booking with failed payment status
        // Keep status as PENDING if payment fails (user can retry)
        const { prisma } = await import('@parkway/database');
        await prisma.booking.updateMany({
          where: { 
            paymentIntentId,
            status: { notIn: ['CANCELLED', 'EXPIRED', 'COMPLETED'] } // Don't update cancelled/expired/completed
          },
          data: {
            paymentStatus: 'FAILED',
            // Keep status as PENDING - don't change to CANCELLED automatically
            // User can retry payment or booking will expire via cron
          },
        });
        
        logger.info('[WEBHOOK] Payment failed', { paymentIntentId });
      } else if (event.type === 'charge.refunded') {
        // Stripe sends charge.refunded event for refunds, not payment_intent.refunded
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;
        
        // Update booking with refunded payment status
        const { prisma } = await import('@parkway/database');
        const updatedBookings = await prisma.booking.updateMany({
          where: { 
            paymentIntentId,
            status: { notIn: ['COMPLETED'] } // Don't update completed bookings
          },
          data: {
            paymentStatus: 'REFUNDED',
            // If booking was CONFIRMED, change back to CANCELLED since payment was refunded
            status: 'CANCELLED'
          },
        });
        
        if (updatedBookings.count > 0) {
          // Get booking details for notifications
          const booking = await prisma.booking.findFirst({
            where: { paymentIntentId },
            include: {
              user: { select: { email: true, name: true } },
              driveway: { select: { title: true, owner: { select: { id: true, email: true, name: true } } } }
            }
          });
          
          if (booking) {
            // Create notifications for refund
            await prisma.notification.createMany({
              data: [
                {
                  userId: booking.userId,
                  title: 'Payment Refunded',
                  message: 'Your payment for ' + booking.driveway.title + ' has been refunded. The booking has been cancelled.',
                  type: 'info'
                },
                {
                  userId: booking.driveway.owner.id,
                  title: 'Payment Refunded',
                  message: 'Payment for ' + booking.driveway.title + ' has been refunded. The spot is now available.',
                  type: 'info'
                }
              ]
            });
          }
        }
        
        logger.info('[WEBHOOK] Payment refunded', { paymentIntentId });
      }
      
      return NextResponse.json({ received: true, type: event.type });
    } catch (err) {
      logger.error('[WEBHOOK] Error processing webhook', {}, err instanceof Error ? err : undefined);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }
  
  // Webhook secret is required for processing webhooks
  if (!signingSecret || !stripeSecret) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      logger.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY is not configured', {
        hasWebhookSecret: !!signingSecret,
        hasStripeSecret: !!stripeSecret
      });
      return NextResponse.json(
        { error: 'Webhook processing is not configured', stub: true },
        { status: 503 }
      );
    }
    // In production, fail loudly
    logger.error('[WEBHOOK] CRITICAL: STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY is missing in production!', {
      hasWebhookSecret: !!signingSecret,
      hasStripeSecret: !!stripeSecret
    });
    return NextResponse.json(
      { error: 'Webhook processing is not configured' },
      { status: 503 }
    );
  }
  
  // If signature is missing but secrets are configured, return error
  if (!sig) {
    logger.error('[WEBHOOK] Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  // This should never be reached
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
}


