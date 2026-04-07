'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import { Button, Card } from '@/components/ui';
import { CheckCircleIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  driveway: {
    id: string;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    owner?: { name: string; phone?: string };
  };
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const bookingId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Booking>(`/bookings/${bookingId}`);
        const data = res.data?.data;
        if (!cancelled && data) {
          setBooking(data);
        } else if (!cancelled) {
          setError('Booking not found.');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setError(message || 'Failed to load booking.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId, user]);

  if (authLoading || (loading && !error)) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent(`/bookings/${bookingId}/confirmation`)}`);
    return null;
  }

  if (error || !booking) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking not found</h2>
              <p className="text-gray-600 mb-4">{error || 'This booking may have been cancelled or does not exist.'}</p>
              <Link href="/bookings">
                <Button>View my bookings</Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) * 10) / 10;

  // Google Calendar add event URL
  const calendarUrl = (() => {
    const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`Parking: ${booking.driveway.title}`);
    const details = encodeURIComponent(`${booking.driveway.address}\n\nBooked via ParkwayAi`);
    const location = encodeURIComponent(booking.driveway.address);
    const start = format(startDate);
    const end = format(endDate);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  })();

  // Google Maps directions
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.driveway.address)}`;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-xl">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re booked!</h1>
          <p className="text-gray-600 mt-1">Your parking is confirmed. Here are the details.</p>
        </div>

        {/* Booking summary */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{booking.driveway.title}</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-gray-900">{booking.driveway.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-medium text-gray-700">When</p>
                <p className="text-gray-900">
                  {startDate.toLocaleString()} – {endDate.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total paid</span>
                <span className="text-lg font-bold text-primary-600">${booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button className="w-full" size="lg">
              Get directions
            </Button>
          </a>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button variant="outline" className="w-full" size="lg">
              Add to calendar
            </Button>
          </a>
          <Link href="/bookings" className="block w-full">
            <Button variant="secondary" className="w-full" size="lg">
              View all bookings
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          A confirmation email has been sent to your account.
        </p>
      </div>
    </AppLayout>
  );
}
