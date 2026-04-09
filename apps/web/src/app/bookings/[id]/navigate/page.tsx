'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import { Button, LoadingSpinner } from '@/components/ui';

interface BookingDetail {
  id: string;
  driveway: {
    id: string;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface RouteData {
  coordinates: [number, number][]; // [lng, lat] from API
  distance: number;
  duration: number;
}

export default function NavigatePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const bookingId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [geoError, setGeoError] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  // Fetch booking details
  useEffect(() => {
    if (!bookingId || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<BookingDetail>(`/bookings/${bookingId}`);
        const data = res.data?.data;
        if (!cancelled && data?.driveway?.latitude != null && data?.driveway?.longitude != null) {
          setBooking(data);
        } else if (!cancelled) {
          setError('Booking or driveway location not found.');
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

  // Get driver position and then fetch route
  useEffect(() => {
    if (!booking || !navigator.geolocation) return;

    let cancelled = false;
    setGeoError('');

    const onPosition = (position: GeolocationPosition) => {
      if (cancelled) return;
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setDriverPosition([lat, lng]);

      const from = `${lat},${lng}`;
      const to = `${booking.driveway.latitude},${booking.driveway.longitude}`;

      fetch(`/api/routing?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .then((r) => r.json())
        .then((json) => {
          if (cancelled) return;
          if (json?.data?.coordinates?.length) {
            setRouteData({
              coordinates: json.data.coordinates,
              distance: json.data.distance ?? 0,
              duration: json.data.duration ?? 0,
            });
          }
        })
        .catch(() => {
          if (!cancelled) setRouteData(null);
        });
    };

    const onError = (err: GeolocationPositionError) => {
      if (cancelled) return;
      setGeoError(err.message === 'Permission denied' ? 'Location permission denied.' : 'Could not get your location.');
    };

    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => { cancelled = true; };
  }, [booking]);

  // Draw map when we have booking, driver position, and container
  useEffect(() => {
    if (!booking || !driverPosition || !mapContainerRef.current) return;

    let map: unknown = null;
    let polyline: unknown = null;
    const container = mapContainerRef.current;

    const init = async () => {
      const L = (await import('leaflet')).default;

      const dest: [number, number] = [booking.driveway.latitude, booking.driveway.longitude];

      map = L.map(container, {
        center: driverPosition,
        zoom: 14,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map as L.Map);

      const driverIcon = L.divIcon({
        className: 'driver-marker',
        html: `<div style="
          width:24px;height:24px;background:#2563eb;border:3px solid white;
          border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `<div style="
          background:white;border-radius:50%;width:40px;height:40px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid #2563eb;
          color:#2563eb;font-size:18px;font-weight:bold;
        ">P</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker(driverPosition, { icon: driverIcon }).addTo(map as L.Map).bindPopup('You are here');
      L.marker(dest, { icon: destIcon }).addTo(map as L.Map).bindPopup(booking.driveway.title);

      if (routeData?.coordinates?.length) {
        const latLngs = routeData.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        polyline = L.polyline(latLngs, { color: '#2563eb', weight: 5 }).addTo(map as L.Map);
        (map as L.Map).fitBounds((polyline as L.Polyline).getBounds(), { padding: [40, 40] });
      } else {
        (map as L.Map).fitBounds([driverPosition, dest], { padding: [40, 40] });
      }
    };

    init();
    return () => {
      if (mapRef.current && typeof (mapRef.current as L.Map).remove === 'function') {
        (mapRef.current as L.Map).remove();
      }
      mapRef.current = null;
    };
  }, [booking, driverPosition, routeData]);

  if (authLoading || (loading && !error)) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="xl" text="Loading..." />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent(`/bookings/${bookingId}/navigate`)}`);
    return null;
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-medium">{error}</p>
            <Link href="/bookings" className="mt-2 inline-block text-sm font-medium text-red-600 hover:underline">
              ← Back to bookings
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Directions to {booking?.driveway?.title}</h1>
            <p className="text-sm text-gray-600 truncate">{booking?.driveway?.address}</p>
            {routeData && (
              <p className="text-xs text-gray-500 mt-1">
                ~{(routeData.distance / 1000).toFixed(1)} km · ~{Math.round(routeData.duration / 60)} min
              </p>
            )}
          </div>
          <Link href="/bookings">
            <Button variant="secondary" size="sm">Back to bookings</Button>
          </Link>
        </div>

        {geoError && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {geoError}
          </div>
        )}

        <div
          ref={mapContainerRef}
          className="w-full rounded-lg border border-gray-200 overflow-hidden"
          style={{ height: 'calc(100vh - 12rem)', minHeight: 320 }}
          aria-label="Map with route to driveway"
        />
      </div>
    </AppLayout>
  );
}
