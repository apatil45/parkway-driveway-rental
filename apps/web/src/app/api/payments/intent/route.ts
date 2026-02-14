import { NextRequest, NextResponse } from 'next/server';
import type { PrismaClient } from '@prisma/client';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Require authentication for all payment intent operations
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json().catch(() => ({}));
    const { amount, bookingId } = body;
    
    // If bookingId is provided, retrieve or create payment intent for that booking
    if (bookingId) {
      const { prisma } = await import('@parkway/database');
      
      // Use transaction to prevent race conditions and ensure data consistency
      const result = await prisma.$transaction(async (tx: TransactionClient) => {
        // Fetch booking with all necessary fields, including user ownership
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          select: { 
            userId: true,
            paymentIntentId: true, 
            totalPrice: true,
            paymentStatus: true,
            status: true
          },
        });
        
        if (!booking) {
          throw new Error('BOOKING_NOT_FOUND');
        }
        
        // Verify user owns the booking
        if (booking.userId !== userId) {
          throw new Error('FORBIDDEN');
        }
        
        // Check if booking is already paid
        if (booking.paymentStatus === 'COMPLETED') {
          throw new Error('ALREADY_PAID');
        }
        
        // Check if booking is cancelled or expired
        if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
          throw new Error('INVALID_BOOKING_STATUS');
        }
        
        const secret = process.env.STRIPE_SECRET_KEY;
        const amountInCents = Math.round(booking.totalPrice * 100);
        
        // If payment intent already exists, try to retrieve it
        if (secret && booking.paymentIntentId) {
          try {
            const stripe = (await import('stripe')).default;
            const client = new stripe(secret);
            const intent = await client.paymentIntents.retrieve(booking.paymentIntentId);
            
            if (intent.client_secret) {
              // Verify amount matches (use booking totalPrice as source of truth)
              const intentAmount = intent.amount;
              if (intentAmount !== amountInCents) {
                logger.warn('[PAYMENT] Amount mismatch', {
                  intentAmount,
                  bookingAmount: amountInCents,
                  bookingId
                });
                // Use booking amount as source of truth, but log the discrepancy
              }
              
              return {
                clientSecret: intent.client_secret,
                amount: amountInCents,
                retrieved: true
              };
            }
          } catch (error: any) {
            logger.error('[PAYMENT] Failed to retrieve payment intent', {
              type: error?.type,
              code: error?.code,
              message: error?.message,
              bookingId
            }, error instanceof Error ? error : undefined);
            // Fall through to create new intent if retrieval fails
          }
        }
        
        // Create new payment intent if none exists or retrieval failed
        if (secret) {
          try {
            const stripe = (await import('stripe')).default;
            const client = new stripe(secret);
            const intent = await client.paymentIntents.create({
              amount: amountInCents,
              currency: 'usd',
              automatic_payment_methods: { enabled: true },
              metadata: { 
                bookingId,
                userId,
                bookingTotalPrice: booking.totalPrice.toString()
              },
            });
            
            // Update booking with payment intent ID atomically
            await tx.booking.update({
              where: { id: bookingId },
              data: { paymentIntentId: intent.id },
            });
            
            return {
              clientSecret: intent.client_secret,
              amount: amountInCents,
              retrieved: false
            };
          } catch (error: any) {
            const stripeMessage = error?.message ?? '';
            logger.error('[PAYMENT] Failed to create payment intent', {
              type: error?.type,
              code: error?.code,
              message: stripeMessage,
              bookingId
            }, error instanceof Error ? error : undefined);
            
            if (error?.type === 'StripeCardError') {
              throw new Error('STRIPE_CARD_ERROR');
            }
            if (error?.type === 'StripeInvalidRequestError') {
              throw new Error('STRIPE_INVALID_REQUEST');
            }
            // Preserve Stripe message for API response (sanitize for invalid_api_key etc.)
            const safeMessage = typeof stripeMessage === 'string' && stripeMessage.length > 0 && stripeMessage.length < 200
              ? stripeMessage
              : 'Payment processing failed';
            throw Object.assign(new Error('STRIPE_ERROR'), { stripeMessage: safeMessage });
          }
        }
        
        // Stripe is REQUIRED for booking payments
        if (!secret) {
          logger.error('[PAYMENT] CRITICAL: STRIPE_SECRET_KEY is required for booking payments', { bookingId });
          throw new Error('STRIPE_NOT_CONFIGURED');
        }
        
        // This should never be reached if secret is properly validated above
        throw new Error('STRIPE_NOT_CONFIGURED');
      });
      
      return NextResponse.json(
        createApiResponse(
          { 
            clientSecret: result.clientSecret, 
            amount: result.amount 
          },
          result.retrieved ? 'Payment intent retrieved' : 'Payment intent created'
        )
      );
    }
    
    // Create new payment intent without booking (requires authentication)
    // Amount can come in as dollars (e.g., 15.00) or cents (e.g., 1500)
    // We need to determine which format it is
    let amountNum: number;
    
    if (!amount) {
      logger.error('[PAYMENT] Missing amount in request', { bookingId });
      return NextResponse.json(createApiError('Payment amount is required.', 400, 'VALIDATION_ERROR'), { status: 400 });
    }
    
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      logger.error('[PAYMENT] Invalid amount value', { amount, amountValue, bookingId });
      return NextResponse.json(createApiError('Please enter a valid payment amount.', 400, 'VALIDATION_ERROR'), { status: 400 });
    }
    
    // If amount is less than 100, assume it's in dollars and convert to cents
    // Otherwise assume it's already in cents
    if (amountValue < 100) {
      amountNum = Math.round(amountValue * 100);
      logger.debug('[PAYMENT] Amount converted from dollars to cents', { original: amountValue, converted: amountNum });
    } else {
      amountNum = Math.round(amountValue);
      logger.debug('[PAYMENT] Amount already in cents', { amount: amountNum });
    }
    
    // Stripe minimum is 50 cents ($0.50)
    if (amountNum < 50) {
      logger.error('[PAYMENT] Amount too small', { amountNum, original: amount });
      return NextResponse.json(createApiError('Payment amount must be at least $0.50.', 400, 'VALIDATION_ERROR'), { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (secret) {
      try {
        const stripe = (await import('stripe')).default;
        const client = new stripe(secret);
        const intent = await client.paymentIntents.create({
          amount: amountNum,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          metadata: { userId },
        });
        return NextResponse.json(createApiResponse({ clientSecret: intent.client_secret, amount: amountNum }, 'Payment intent created'));
      } catch (error: any) {
        logger.error('[PAYMENT] Failed to create payment intent', {
          type: error.type,
          code: error.code
        }, error instanceof Error ? error : undefined);
        
        if (error.type === 'StripeCardError') {
          return NextResponse.json(createApiError(error.message || 'Your card was declined. Please check your card details and try again.', 400, 'CARD_ERROR'), { status: 400 });
        }
        if (error.type === 'StripeInvalidRequestError') {
          logger.error('[PAYMENT] Stripe invalid request error', {
            code: error.code,
            param: error.param,
            amount: amountNum,
            bookingId
          }, error instanceof Error ? error : undefined);
          // Provide more specific error message based on Stripe's error
          let userMessage = 'Please check your payment information and try again.';
          if (error.message) {
            if (error.message.includes('amount')) {
              userMessage = 'Invalid payment amount. Please check the amount and try again.';
            } else if (error.message.includes('currency')) {
              userMessage = 'Invalid currency. Please contact support.';
            } else if (error.message.includes('api_key')) {
              userMessage = 'Payment processing configuration error. Please contact support.';
            }
          }
          return NextResponse.json(createApiError(userMessage, 400, 'INVALID_REQUEST'), { status: 400 });
        }
        return NextResponse.json(createApiError('Unable to process payment. Please try again in a moment.', 500, 'PAYMENT_ERROR'), { status: 500 });
      }
    }

    // Stripe is REQUIRED for booking payments
    logger.error('[PAYMENT] CRITICAL: STRIPE_SECRET_KEY is required for booking payments');
    return NextResponse.json(
      createApiError('Payment processing is not configured. Please contact support.', 503, 'SERVICE_UNAVAILABLE'),
      { status: 503 }
    );
  } catch (e: any) {
    // Handle transaction errors
    if (e.message === 'BOOKING_NOT_FOUND') {
      return NextResponse.json(createApiError('Booking not found', 404, 'BOOKING_NOT_FOUND'), { status: 404 });
    }
    if (e.message === 'FORBIDDEN') {
      return NextResponse.json(createApiError('Not authorized to access this booking', 403, 'FORBIDDEN'), { status: 403 });
    }
    if (e.message === 'ALREADY_PAID') {
      return NextResponse.json(createApiError('Booking already paid', 400, 'ALREADY_PAID'), { status: 400 });
    }
    if (e.message === 'INVALID_BOOKING_STATUS') {
      return NextResponse.json(createApiError('Booking is cancelled or expired', 400, 'INVALID_BOOKING_STATUS'), { status: 400 });
    }
    if (e.message === 'STRIPE_CARD_ERROR') {
      return NextResponse.json(createApiError('Card error occurred', 400, 'CARD_ERROR'), { status: 400 });
    }
    if (e.message === 'STRIPE_INVALID_REQUEST') {
      return NextResponse.json(createApiError('Invalid payment request', 400, 'INVALID_REQUEST'), { status: 400 });
    }
    if (e.message === 'STRIPE_ERROR') {
      const message = (e as Error & { stripeMessage?: string }).stripeMessage || 'Payment processing failed';
      return NextResponse.json(createApiError(message, 500, 'PAYMENT_ERROR'), { status: 500 });
    }
    if (e.message === 'STRIPE_NOT_CONFIGURED') {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        return NextResponse.json(
          createApiError('Payment processing is not configured. Please contact support.', 503, 'SERVICE_UNAVAILABLE'),
          { status: 503 }
        );
      }
      return NextResponse.json(
        createApiError('Payment processing is temporarily unavailable. Please try again later.', 503, 'SERVICE_UNAVAILABLE'),
        { status: 503 }
      );
    }
    
    logger.error('[PAYMENT] Payment intent error', {}, e instanceof Error ? e : undefined);
    return NextResponse.json(createApiError('Unable to set up payment. Please try again in a moment.', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}


