'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, ImageUpload, AddressAutocomplete, ErrorDisplay } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks';
import api from '@/lib/api-client';

export default function NewDrivewayPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { handleError } = useErrorHandler({ context: 'NewDrivewayPage' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [form, setForm] = useState({ 
    title: '', 
    address: '', 
    pricePerHour: '', 
    capacity: '', 
    images: [] as string[], 
    amenities: '',
    latitude: 0,
    longitude: 0
  });
  const [rightToListConfirmed, setRightToListConfirmed] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!form.latitude || !form.longitude) {
        throw new Error('Choose your address from the dropdown so we can pin the map.');
      }
      
      if (!rightToListConfirmed) {
        throw new Error('Confirm you’re allowed to rent out this space (owner, tenant, or manager).');
      }
      await api.post('/driveways', {
        title: form.title,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        pricePerHour: Number(form.pricePerHour),
        capacity: Number(form.capacity),
        images: form.images || [],
        amenities: form.amenities ? form.amenities.split(',').map(s => s.trim()) : [],
        carSize: ['small', 'medium', 'large', 'extra-large'], // Default to all sizes
        rightToListConfirmed: true,
      });
      showToast('Listing published—drivers can find it once it’s live.', 'success');
      router.push('/driveways');
    } catch (e: any) {
      // Use professional error handler - automatically shows toast and logs error
      const appError = handleError(e);
      setError(e); // Set error for inline display
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">List your spot</h1>
        <p className="text-gray-600 mb-6 text-sm max-w-2xl">
          Takes a few minutes. Set your price and hours—drivers book short stays, usually under two hours.
        </p>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <ErrorDisplay error={error} inline />}
            <Input label="Listing title" placeholder="e.g. Driveway near Main St" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <AddressAutocomplete
              label="Address"
              value={form.address}
              onChange={(address) => setForm({ ...form, address })}
              onLocationSelect={(lat, lon) => {
                setForm({ ...form, latitude: lat, longitude: lon });
              }}
              placeholder="Start typing an address..."
              required
              disabled={loading}
            />
            <Input label="Price per hour (USD)" type="number" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} required />
            <Input label="How many cars fit?" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <ImageUpload
              value={form.images}
              onChange={(urls) => setForm({ ...form, images: urls })}
              maxImages={5}
              disabled={loading}
            />
            <Input label="Amenities (optional, comma-separated)" placeholder="covered, EV charger…" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rightToListConfirmed}
                  onChange={(e) => setRightToListConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">
                  I’m allowed to offer this parking (owner, tenant, or authorized manager). I’ve read the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium underline">
                    terms
                  </Link>
                  {' '}and understand misleading listings may be removed.
                </span>
              </label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={loading} disabled={!rightToListConfirmed}>Publish listing</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}


