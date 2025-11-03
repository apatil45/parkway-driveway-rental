import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (signingSecret && sig) {
    try {
      const raw = await request.text();
      const stripeModule = await import('stripe');
      // Use default API version for the key to avoid TS literal drift
      const stripe = new stripeModule.default(process.env.STRIPE_SECRET_KEY!);
      const event = stripe.webhooks.constructEvent(raw, sig, signingSecret);
      // Here we could act on event.type like payment_intent.succeeded
      return NextResponse.json({ received: true, type: event.type });
    } catch (err) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }
  // Stub fallback
  return NextResponse.json({ received: true, stub: true });
}


