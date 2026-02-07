'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import StripeCheckout from '@/components/ui/StripeCheckout';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import { createAppError } from '@/lib/errors';
import Link from 'next/link';

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
      setError('Booking information is missing. Please try creating a new booking.');
      setLoading(false);
    }
  }, [bookingId, isAuthenticated]);

  const fetchBooking = async () => {
    if (!bookingId) {
      setError('Booking information is missing. Please try creating a new booking.');
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
        setError('This booking is no longer available. Please create a new booking.');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this booking');
      } else if (err.response?.status >= 500) {
        setError('Unable to load booking details. Please try again in a moment.');
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
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
              <Link href="/search" className="btn btn-primary">
                Back to Search
              </Link>
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
        <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>
        
        <div className="space-y-6">
          {/* Booking Summary */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Driveway:</span>
                <span className="font-medium">{booking.driveway.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-right max-w-xs">{booking.driveway.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-medium">
                  {new Date(booking.startTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Time:</span>
                <span className="font-medium">
                  {new Date(booking.endTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} hours
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${booking.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
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
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            <StripeCheckout 
              amount={amountInCents} 
              bookingId={booking.id}
              onSuccess={async () => {
                // Wait a moment for webhook to process, then redirect
                // The bookings page will auto-refresh if webhook hasn't processed yet
                await new Promise(resolve => setTimeout(resolve, 1000));
                router.push(`/bookings`);
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


