import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { amount, bookingId } = body;
    
    // If bookingId is provided, retrieve the booking's payment intent
    if (bookingId) {
      const { prisma } = await import('@parkway/database');
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { paymentIntentId: true, totalPrice: true },
      });
      
      if (!booking) {
        return NextResponse.json(createApiError('Booking not found', 404, 'BOOKING_NOT_FOUND'), { status: 404 });
      }
      
      const secret = process.env.STRIPE_SECRET_KEY;
      if (secret && booking.paymentIntentId) {
        try {
          // Retrieve existing payment intent
          const stripe = (await import('stripe')).default;
          const client = new stripe(secret);
          const intent = await client.paymentIntents.retrieve(booking.paymentIntentId);
          
          if (intent.client_secret) {
            return NextResponse.json(
              createApiResponse(
                { clientSecret: intent.client_secret, amount: Math.round(booking.totalPrice * 100) },
                'Payment intent retrieved'
              )
            );
          }
        } catch (error) {
          console.error('Failed to retrieve payment intent:', error);
          // Fall through to create new intent
        }
      }
      
      // Create new payment intent if retrieval failed or doesn't exist
      const amountInCents = Math.round(booking.totalPrice * 100);
      if (secret) {
        const stripe = (await import('stripe')).default;
        const client = new stripe(secret);
        const intent = await client.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          metadata: { bookingId },
        });
        
        // Update booking with new payment intent ID
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentIntentId: intent.id },
        });
        
        return NextResponse.json(
          createApiResponse(
            { clientSecret: intent.client_secret, amount: amountInCents },
            'Payment intent created'
          )
        );
      }
      
      // Fallback stub
      const fakeClientSecret = `pi_test_${Math.random().toString(36).slice(2)}_secret_${Math.random().toString(36).slice(2)}`;
      return NextResponse.json(
        createApiResponse(
          { clientSecret: fakeClientSecret, amount: amountInCents },
          'Payment intent created (stub)'
        )
      );
    }
    
    // Create new payment intent without booking
    const amountNum = Number(amount ?? 1000);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json(createApiError('Invalid amount', 400, 'VALIDATION_ERROR'), { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (secret) {
      // Real Stripe flow if key present
      const stripe = (await import('stripe')).default;
      // Let Stripe SDK use the default API version for the key to avoid TS literal drift
      const client = new stripe(secret);
      const intent = await client.paymentIntents.create({
        amount: amountNum,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
      });
      return NextResponse.json(createApiResponse({ clientSecret: intent.client_secret, amount: amountNum }, 'Payment intent created'));
    }

    // Fallback stub in dev without secret
    const fakeClientSecret = `pi_test_${Math.random().toString(36).slice(2)}_secret_${Math.random().toString(36).slice(2)}`;
    return NextResponse.json(createApiResponse({ clientSecret: fakeClientSecret, amount: amountNum }, 'Payment intent created (stub)'));
  } catch (e) {
    console.error('Payment intent error:', e);
    return NextResponse.json(createApiError('Failed to create payment intent', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}


