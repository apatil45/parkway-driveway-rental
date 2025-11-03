'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';
import api from '@/lib/api';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

function CheckoutInner({ 
  amount, 
  bookingId, 
  onSuccess 
}: { 
  amount: number; 
  bookingId?: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    
    try {
      const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
      
      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        // Payment succeeded
        if (onSuccess) {
          onSuccess();
        } else {
          alert('Payment confirmed! Your booking is now confirmed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button type="submit" loading={loading} disabled={!stripe}>
        Pay ${(amount / 100).toFixed(2)}
      </Button>
    </form>
  );
}

export default function StripeCheckout({ 
  amount = 1500, 
  bookingId,
  onSuccess 
}: { 
  amount?: number;
  bookingId?: string;
  onSuccess?: () => void;
}) {
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!publishableKey) return;
      setStripePromise(loadStripe(publishableKey));
      
      try {
        // If bookingId is provided, fetch payment intent for that booking
        // Otherwise create a new payment intent
        const res = await api.post('/payments/intent', bookingId ? { bookingId } : { amount });
        setClientSecret(res.data?.data?.clientSecret || '');
      } catch (err) {
        console.error('Failed to create payment intent:', err);
      }
    })();
  }, [amount, bookingId]);

  if (!publishableKey) {
    return <div className="text-sm text-gray-600">Stripe not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.</div>;
  }

  if (!clientSecret || !stripePromise) {
    return <div className="text-sm text-gray-600">Preparing checkout…</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutInner amount={amount} bookingId={bookingId} onSuccess={onSuccess} />
    </Elements>
  );
}


