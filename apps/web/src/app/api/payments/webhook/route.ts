import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (signingSecret && sig) {
    try {
      const raw = await request.text();
      const stripeModule = await import('stripe');
      const stripe = new stripeModule.default(process.env.STRIPE_SECRET_KEY!);
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
          console.error(`[WEBHOOK] Booking not found for payment intent: ${paymentIntentId}`);
          return NextResponse.json({ received: true, warning: 'Booking not found' });
        }

        // Only update if booking is in a valid state (not already cancelled or expired)
        if (existingBooking.status === 'CANCELLED' || existingBooking.status === 'EXPIRED') {
          console.warn(`[WEBHOOK] Payment succeeded but booking is ${existingBooking.status}: ${existingBooking.id`);
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
          console.warn(`[WEBHOOK] No bookings updated for payment intent: ${paymentIntentId}`);
          return NextResponse.json({ received: true, warning: 'No bookings updated' });
        }

        // Get booking details for email
        const booking = await prisma.booking.findFirst({
          where: { paymentIntentId },
          include: {
            user: { select: { email: true, name: true } },
            driveway: { select: { title: true, address: true, owner: { select: { email: true, name: true } } } }
          }
        });

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

          // Send payment received email to owner
          await sendEmail({
            to: booking.driveway.owner.email,
            ...emailTemplates.paymentReceived({
              drivewayTitle: booking.driveway.title,
              totalPrice: booking.totalPrice,
              bookingId: booking.id
            })
          });

          // Create notifications
          await prisma.notification.createMany({
            data: [
              {
                userId: booking.userId,
                title: 'Booking Confirmed',
                message: `Your booking for ${booking.driveway.title} has been confirmed!`,
                type: 'success'
              },
              {
                userId: booking.driveway.ownerId,
                title: 'Payment Received',
                message: `You received $${booking.totalPrice.toFixed(2)} for ${booking.driveway.title}`,
                type: 'success'
              }
            ]
          });
        }
        
        console.log(`[WEBHOOK] Payment succeeded for intent: ${paymentIntentId}`);
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
        
        console.log(`[WEBHOOK] Payment failed for intent: ${paymentIntentId}`);
      }
      
      return NextResponse.json({ received: true, type: event.type });
    } catch (err) {
      console.error('[WEBHOOK] Error:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }
  // Stub fallback
  return NextResponse.json({ received: true, stub: true });
}


