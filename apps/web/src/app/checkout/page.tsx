'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, ButtonLink } from '@/components/ui';
import StripeCheckout from '@/components/ui/StripeCheckout';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import { createAppError } from '@/lib/errors';

interface Booking {
  id: string;
  totalPrice: number;
  startTime: string;
  endTime: string;
  driveway: {
    id: string;
    title: string;
    address: string;
  };
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (bookingId && isAuthenticated) {
      fetchBooking();
    } else if (!bookingId) {
      setError('We’re missing your booking link. Go back to the spot and try reserving again.');
      setLoading(false);
    }
  }, [bookingId, isAuthenticated]);

  const fetchBooking = async () => {
    if (!bookingId) {
      setError('We’re missing your booking link. Go back to the spot and try reserving again.');
      setLoading(false);
      return;
    }

    try {
      // Fetch single booking directly by ID
      const response = await api.get<Booking>(`/bookings/${bookingId}`);
      setBooking(response.data.data);
    } catch (err: any) {
      // Handle network errors (no response)
      if (!err.response) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          setError('Request timed out. Please check your connection and try again.');
        } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError('Unable to connect to the server. Please try again.');
        }
        return;
      }

      // Handle HTTP status codes
      if (err.response?.status === 401) {
        // Not authenticated - redirect to login
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      } else if (err.response?.status === 404) {
        setError('This reservation isn’t available anymore. Pick another time or spot and try again.');
      } else if (err.response?.status === 403) {
        setError('You’re signed in with a different account than the one that holds this booking. Switch accounts or open your Bookings page.');
      } else if (err.response?.status >= 500) {
        setError('We couldn’t load this booking. Wait a moment and refresh, or open Bookings from your account.');
      } else {
        // Use createAppError for consistent user-friendly messages
        const appError = createAppError(err);
        setError(appError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render checkout if not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !booking) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout unavailable</h2>
              <p className="text-gray-600 mb-4">{error || 'We couldn’t find that booking.'}</p>
              <ButtonLink href="/search">Find parking</ButtonLink>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const amountInCents = Math.round(booking.totalPrice * 100);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Pay & confirm</h1>
        <p className="text-gray-600 mb-6 text-sm">
          One secure payment confirms your spot. Need help? We’re here if something looks wrong.
        </p>
        
        <div className="space-y-6">
          {/* Booking Summary */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Your reservation</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Spot</span>
                <span className="font-medium">{booking.driveway.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address</span>
                <span className="font-medium text-right max-w-xs">{booking.driveway.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Arrive</span>
                <span className="font-medium">
                  {new Date(booking.startTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leave by</span>
                <span className="font-medium">
                  {new Date(booking.endTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Length</span>
                <span className="font-medium">
                  {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} hours
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600">Parking:</span>
                  <span className="font-medium">${(booking.totalPrice / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-600">Platform fee (15%):</span>
                  <span className="font-medium">${(booking.totalPrice - booking.totalPrice / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-primary-600">
                    ${booking.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Form */}
          <Card>
            <h2 className="text-xl font-semibold mb-1">Payment</h2>
            <p className="text-sm text-gray-600 mb-4">Processed securely by Stripe. You’re charged once—no surprise fees.</p>
            <StripeCheckout 
              amount={amountInCents} 
              bookingId={booking.id}
              onSuccess={async () => {
                // Redirect to confirmation page for celebration moment
                await new Promise(resolve => setTimeout(resolve, 800));
                router.push(`/bookings/${booking.id}/confirmation`);
              }}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </AppLayout>
    }>
      <CheckoutContent />
    </Suspense>
  );
}


