'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, ImageUpload, AddressAutocomplete, Textarea } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';

const CAR_SIZE_OPTIONS = ['small', 'medium', 'large', 'extra-large'] as const;

export default function EditDrivewayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: drivewayId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    pricePerHour: '',
    capacity: '',
    images: [] as string[],
    amenities: '',
    latitude: 0,
    longitude: 0,
    carSize: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/driveways/${drivewayId}/edit`)}`);
    }
  }, [authLoading, isAuthenticated, router, drivewayId]);

  useEffect(() => {
    if (!drivewayId || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{
          id: string;
          title: string;
          description?: string;
          address: string;
          latitude: number;
          longitude: number;
          pricePerHour: number;
          capacity: number;
          carSize: string[];
          amenities: string[];
          images: string[];
          ownerId?: string;
          owner?: { id: string };
        }>(`/driveways/${drivewayId}`);
        const d = res.data?.data;
        if (cancelled || !d) {
          if (!d) setNotFound(true);
          return;
        }
        const ownerId = d.ownerId ?? d.owner?.id;
        if (ownerId && user?.id && ownerId !== user.id) {
          if (!cancelled) setNotFound(true);
          return;
        }
        setForm({
          title: d.title ?? '',
          description: d.description ?? '',
          address: d.address ?? '',
          pricePerHour: String(d.pricePerHour ?? ''),
          capacity: String(d.capacity ?? ''),
          images: Array.isArray(d.images) ? d.images : [],
          amenities: Array.isArray(d.amenities) ? d.amenities.join(', ') : '',
          latitude: Number(d.latitude) || 0,
          longitude: Number(d.longitude) || 0,
          carSize: Array.isArray(d.carSize) && d.carSize.length > 0
            ? d.carSize
            : ['small', 'medium', 'large', 'extra-large'],
        });
      } catch (e: any) {
        if (!cancelled) {
          if (e.response?.status === 404) setNotFound(true);
          else setError(e.response?.data?.message || 'Failed to load driveway');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [drivewayId, isAuthenticated, user?.id]);

  const onCarSizeToggle = (size: string) => {
    setForm((prev) => {
      const next = prev.carSize.includes(size)
        ? prev.carSize.filter((s) => s !== size)
        : [...prev.carSize, size];
      return { ...prev, carSize: next.length ? next : prev.carSize };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (form.carSize.length === 0) {
        setError('Please select at least one vehicle size.');
        setSaving(false);
        return;
      }
      const updateData: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        address: form.address,
        pricePerHour: Number(form.pricePerHour),
        capacity: Number(form.capacity),
        images: form.images,
        amenities: form.amenities ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
        carSize: form.carSize,
      };
      if (form.latitude && form.longitude) {
        updateData.latitude = form.latitude;
        updateData.longitude = form.longitude;
      }
      await api.patch(`/driveways/${drivewayId}`, updateData);
      showToast('Driveway updated successfully!', 'success');
      router.push('/driveways');
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || 'Failed to update driveway';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) return null;

  if (notFound) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-gray-600 mb-4">Driveway not found or you don’t have permission to edit it.</p>
          <Link href="/driveways" className="text-primary-600 hover:underline">Back to My Driveways</Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/driveways" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">
          ← Back to My Driveways
        </Link>
        <h1 className="text-3xl font-bold mb-6">Edit Driveway</h1>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Textarea
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe your parking space..."
            />
            <AddressAutocomplete
              label="Address"
              value={form.address}
              onChange={(address) => setForm({ ...form, address })}
              onLocationSelect={(lat, lon) => setForm({ ...form, latitude: lat, longitude: lon })}
              placeholder="Start typing an address..."
              required
              disabled={saving}
            />
            <Input
              label="Price per hour (USD)"
              type="number"
              step="0.01"
              min="0"
              value={form.pricePerHour}
              onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
              required
            />
            <Input
              label="Capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle sizes accepted</label>
              <div className="flex flex-wrap gap-3">
                {CAR_SIZE_OPTIONS.map((size) => (
                  <label key={size} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.carSize.includes(size)}
                      onChange={() => onCarSizeToggle(size)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={saving}
                    />
                    <span className="text-sm text-gray-700 capitalize">{size.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select at least one.</p>
            </div>
            <ImageUpload
              value={form.images}
              onChange={(urls) => setForm({ ...form, images: urls })}
              maxImages={5}
              disabled={saving}
            />
            <Input
              label="Amenities (comma-separated)"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              placeholder="e.g. covered, security, ev_charging"
            />
            <div className="flex justify-end gap-2">
              <Link href="/driveways">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
              <Button type="submit" loading={saving} disabled={form.carSize.length === 0}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
