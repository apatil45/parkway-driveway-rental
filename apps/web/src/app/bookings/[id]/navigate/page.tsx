'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import { Button, LoadingSpinner, AddressAutocomplete } from '@/components/ui';

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
  const [manualStartAddress, setManualStartAddress] = useState('');
  const [manualStartPosition, setManualStartPosition] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [geoError, setGeoError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const lastRouteFromRef = useRef<[number, number] | null>(null);
  const routeDataRef = useRef<RouteData | null>(null);
  const mapRef = useRef<unknown>(null);
  const driverMarkerRef = useRef<{ setLatLng: (latlng: [number, number]) => void } | null>(null);
  const routeFetchedRef = useRef(false);
  const polylineAddedRef = useRef(false);

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

  const fetchRoute = useCallback((fromLat: number, fromLng: number) => {
    if (!booking) return;
    const from = `${fromLat},${fromLng}`;
    const to = `${booking.driveway.latitude},${booking.driveway.longitude}`;
    lastRouteFromRef.current = [fromLat, fromLng];
    fetch(`/api/routing?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.coordinates?.length) {
          setRouteData({
            coordinates: json.data.coordinates,
            distance: json.data.distance ?? 0,
            duration: json.data.duration ?? 0,
          });
          polylineAddedRef.current = false;
        }
      })
      .catch(() => setRouteData(null));
  }, [booking]);

  const fromPosition = driverPosition ?? manualStartPosition;
  routeDataRef.current = routeData;

  // Watch driver position continuously (live updates) and fetch/re-fetch route
  useEffect(() => {
    if (!booking || !navigator.geolocation) return;

    let cancelled = false;
    setGeoError('');
    routeFetchedRef.current = false;

    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const minDistanceToRouteKm = (lat: number, lng: number, coords: [number, number][]) => {
      let min = Infinity;
      for (const [lonP, latP] of coords) {
        const d = haversineKm(lat, lng, latP, lonP);
        if (d < min) min = d;
      }
      return min;
    };

    const onPosition = (position: GeolocationPosition) => {
      if (cancelled) return;
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setDriverPosition([lat, lng]);

      if (!routeFetchedRef.current) {
        routeFetchedRef.current = true;
        fetchRoute(lat, lng);
      } else if (routeDataRef.current?.coordinates?.length) {
        const offRouteKm = minDistanceToRouteKm(lat, lng, routeDataRef.current.coordinates);
        if (offRouteKm > 0.5) {
          routeFetchedRef.current = true;
          fetchRoute(lat, lng);
        }
      }
    };

    const onError = (err: GeolocationPositionError) => {
      if (cancelled) return;
      if (err.code === 1) {
        setGeoError('Location permission denied. Enable it in your browser or device settings.');
      } else if (err.code === 2) {
        setGeoError('Location unavailable. Turn on GPS/location services and try again.');
      } else if (err.code === 3) {
        setGeoError('Location request timed out. Move to an area with better GPS signal.');
      } else if (typeof window !== 'undefined' && !window.isSecureContext) {
        setGeoError('Location requires HTTPS. Use a secure URL (e.g. ngrok, Vercel) or localhost.');
      } else {
        setGeoError('Could not get your location. Check that location services are on and try again.');
      }
    };

    const watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [booking, fetchRoute]);

  // Fetch route when manual start is set (only when we don't have live GPS)
  useEffect(() => {
    if (!booking || !manualStartPosition || driverPosition) return;
    routeFetchedRef.current = true;
    fetchRoute(manualStartPosition[0], manualStartPosition[1]);
  }, [booking, manualStartPosition, driverPosition, fetchRoute]);

  // Clean up map when leaving page or switching booking
  useEffect(() => {
    return () => {
      const map = mapRef.current as { remove?: () => void } | null;
      if (map && typeof map.remove === 'function') {
        map.remove();
      }
      mapRef.current = null;
      driverMarkerRef.current = null;
      polylineAddedRef.current = false;
    };
  }, [bookingId]);

  // Draw map when we have booking and container - show even without location (destination only)
  useEffect(() => {
    if (!booking || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    const dest: [number, number] = [booking.driveway.latitude, booking.driveway.longitude];

    // Map already exists: update or add start marker, add polyline if route arrived
    if (mapRef.current) {
      const mapInstance = mapRef.current;
      if (fromPosition) {
        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng(fromPosition);
        } else {
          // Add driver marker when position arrives after map was created without it
          import('leaflet').then(({ default: L }) => {
            const driverIcon = L.divIcon({
              className: 'driver-marker',
              html: `<div style="width:24px;height:24px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            const m = L.marker(fromPosition, { icon: driverIcon }).addTo(mapInstance as L.Map).bindPopup('You are here');
            driverMarkerRef.current = m;
          });
        }
      }
      if (routeData?.coordinates?.length && !polylineAddedRef.current) {
        polylineAddedRef.current = true;
        import('leaflet').then(({ default: L }) => {
          const map = mapRef.current as L.Map;
          if (!map || !map.getPane) return;
          const latLngs = routeData!.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
          const polyline = L.polyline(latLngs, { color: '#2563eb', weight: 5 }).addTo(map);
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        });
      }
      return;
    }

    let map: unknown = null;
    const init = async () => {
      const L = (await import('leaflet')).default;

      // Center on destination (or driver/manual start + dest if we have position)
      const center = fromPosition || dest;

      map = L.map(container, {
        center,
        zoom: 14,
        zoomControl: false,
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

      if (fromPosition) {
        const driverMarker = L.marker(fromPosition, { icon: driverIcon }).addTo(map as L.Map).bindPopup('You are here');
        driverMarkerRef.current = driverMarker;
      } else {
        driverMarkerRef.current = null;
      }
      L.marker(dest, { icon: destIcon }).addTo(map as L.Map).bindPopup(booking.driveway.title);

      if (routeData?.coordinates?.length) {
        polylineAddedRef.current = true;
        const latLngs = routeData.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        const polyline = L.polyline(latLngs, { color: '#2563eb', weight: 5 }).addTo(map as L.Map);
        (map as L.Map).fitBounds((polyline as L.Polyline).getBounds(), { padding: [40, 40] });
      } else if (fromPosition) {
        (map as L.Map).fitBounds([fromPosition, dest], { padding: [40, 40] });
      } else {
        (map as L.Map).setView(dest, 15);
      }
    };

    init();
  }, [booking, driverPosition, manualStartPosition, routeData]);

  // When toggling full-screen, tell Leaflet to recalc size so the map fills the new container
  useEffect(() => {
    const map = mapRef.current as { invalidateSize?: () => void } | null;
    if (!map?.invalidateSize) return;
    requestAnimationFrame(() => {
      map.invalidateSize?.();
    });
  }, [isFullScreen]);

  useEffect(() => {
    if (!isFullScreen || !driverPosition || !mapRef.current) return;
    const map = mapRef.current as { panTo: (latlng: [number, number]) => void };
    if (map.panTo) map.panTo(driverPosition);
  }, [isFullScreen, driverPosition]);

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
      <div className={isFullScreen ? 'fixed inset-0 z-50 flex flex-col bg-gray-900' : 'container mx-auto px-4 py-4'}>
        {!isFullScreen && (
          <>
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
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => setIsFullScreen(true)}>
                  Full screen
                </Button>
                <Link href="/bookings">
                  <Button variant="secondary" size="sm">Back to bookings</Button>
                </Link>
              </div>
            </div>

        {geoError && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-2">
            <p>{geoError} Map below shows the destination.</p>
            {booking?.driveway && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.driveway.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-amber-700 hover:text-amber-900"
              >
                Also open in Google Maps →
              </a>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start from address</label>
          <p className="text-xs text-gray-500 mb-2">
            {geoError ? 'Enter where you are to get directions.' : 'Or enter a different start address.'}
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <AddressAutocomplete
                value={manualStartAddress}
                onChange={setManualStartAddress}
                onLocationSelect={(lat, lon) => {
                  setManualStartPosition([lat, lon]);
                }}
                placeholder="Where are you? Enter address"
                minimal
                className="min-w-0"
              />
            </div>
            {manualStartPosition && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setManualStartAddress('');
                  setManualStartPosition(null);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

            <p className="text-xs text-gray-500 mb-2">
              We use your location only for directions and nearby search. We do not store or share it.
            </p>
          </>
        )}

        <div
          ref={mapContainerRef}
          className={isFullScreen ? 'flex-1 w-full min-h-0' : 'w-full rounded-lg border border-gray-200 overflow-hidden'}
          style={isFullScreen ? {} : { height: 'calc(100vh - 12rem)', minHeight: 320 }}
          aria-label="Map with route to driveway"
        />

        {isFullScreen && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none">
            <div className="pointer-events-auto">
              <Button variant="secondary" size="sm" onClick={() => setIsFullScreen(false)}>
                Exit full screen
              </Button>
            </div>
            {routeData && (
              <div className="pointer-events-auto bg-black/70 text-white rounded-lg px-4 py-2 text-sm font-medium">
                ~{(routeData.distance / 1000).toFixed(1)} km · ~{Math.round(routeData.duration / 60)} min
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
