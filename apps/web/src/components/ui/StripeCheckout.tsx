'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';
import { useToast } from './Toast';
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
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    
    try {
      const result = await stripe.confirmPayment({ 
        elements, 
        redirect: 'if_required'
      });
      
      // Type guard: check if result has error
      if (result.error) {
        // Check if payment actually succeeded despite the error
        // This can happen if payment intent is already confirmed (race condition)
        const paymentIntent = result.error.payment_intent;
        if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Payment actually succeeded - treat as success (handles race condition)
          const paymentIntentId = paymentIntent.id;
          showToast('Payment confirmed! Your booking is now confirmed.', 'success');
          
          // Verify and update booking status in background
          if (bookingId && paymentIntentId) {
            setTimeout(() => {
              fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  paymentIntentId,
                  bookingId
                })
              }).catch(() => {
                // Silently ignore - webhook will handle it
              });
            }, 0);
          }
          
          if (onSuccess) {
            onSuccess();
          }
          setLoading(false);
          return;
        }
        
        // Real error - log and show to user
        console.error('[StripeCheckout] Payment error:', {
          message: result.error.message,
          type: result.error.type,
          code: result.error.code
        });
        
        const errorMsg = result.error.message 
          || result.error.code
          || 'A processing error occurred. Please try again.';
        
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setLoading(false);
        return;
      }
      
      // Payment succeeded - result.paymentIntent should exist when there's no error
      // Use type assertion to help TypeScript understand the discriminated union
      const successResult = result as { paymentIntent: { id: string } | string };
      if (!successResult.paymentIntent) {
        setError('Payment completed but no payment intent returned');
        showToast('Payment completed but verification failed. Please check your bookings.', 'warning');
        setLoading(false);
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      
      // Get payment intent ID
      const paymentIntentId = typeof successResult.paymentIntent === 'string' 
        ? successResult.paymentIntent 
        : successResult.paymentIntent.id;
      
      if (!paymentIntentId) {
        setError('Payment completed but no payment intent ID found');
        showToast('Payment completed but verification failed. Please check your bookings.', 'warning');
        setLoading(false);
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      
      showToast('Payment confirmed! Your booking is now confirmed.', 'success');
      
      // Verify and update booking status in background (completely non-blocking)
      // Webhook is the source of truth - this is just for instant feedback
      if (bookingId && paymentIntentId) {
        // Fire and forget - don't wait, don't catch errors
        // Use setTimeout to make it truly async and non-blocking
        setTimeout(() => {
          fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              paymentIntentId,
              bookingId
            })
          }).catch(() => {
            // Silently ignore - webhook will handle it
          });
        }, 0);
      }
      
      if (onSuccess) {
        // Redirect immediately - webhook will update booking status
        onSuccess();
      }
    } catch (err: any) {
      console.error('[StripeCheckout] Unexpected payment error:', err);
      console.error('[StripeCheckout] Error details:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        toString: err?.toString()
      });
      
      const errorMsg = err?.message 
        || err?.toString() 
        || (typeof err === 'string' ? err : 'Payment failed. Please try again.');
      
      setError(errorMsg);
      showToast(errorMsg, 'error');
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
      } catch (err: any) {
        // Handle authentication errors gracefully
        if (err.response?.status === 401) {
          // User is not authenticated - redirect to login
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }
          return;
        }
        console.error('Failed to create payment intent:', err);
      }
    })();
  }, [amount, bookingId]);

  if (!publishableKey) {
    const isDev = process.env.NODE_ENV === 'development';
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Payment Processing Not Available</h4>
        <p className="text-sm text-yellow-700 mb-2">
          Stripe payment gateway is not configured. Please contact support to complete your booking.
        </p>
        {isDev && (
          <p className="text-xs text-yellow-600 mt-2">
            Development: Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file.
          </p>
        )}
      </div>
    );
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


