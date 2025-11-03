import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body?.amount ?? 1000);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(createApiError('Invalid amount', 400, 'VALIDATION_ERROR'), { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (secret) {
      // Real Stripe flow if key present
      const stripe = (await import('stripe')).default;
      // Let Stripe SDK use the default API version for the key to avoid TS literal drift
      const client = new stripe(secret);
      const intent = await client.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
      });
      return NextResponse.json(createApiResponse({ clientSecret: intent.client_secret, amount }, 'Payment intent created'));
    }

    // Fallback stub in dev without secret
    const fakeClientSecret = `pi_test_${Math.random().toString(36).slice(2)}_secret_${Math.random().toString(36).slice(2)}`;
    return NextResponse.json(createApiResponse({ clientSecret: fakeClientSecret, amount }, 'Payment intent created (stub)'));
  } catch (e) {
    return NextResponse.json(createApiError('Failed to create payment intent', 500, 'INTERNAL_ERROR'), { status: 500 });
  }
}


