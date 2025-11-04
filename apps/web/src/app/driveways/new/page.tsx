'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, ImageUpload, AddressAutocomplete } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

export default function NewDrivewayPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!form.latitude || !form.longitude) {
        throw new Error('Please select an address from the suggestions');
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
      });
      showToast('Driveway created successfully!', 'success');
      router.push('/driveways');
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || 'Failed to create driveway';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">New Driveway</h1>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
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
            <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <ImageUpload
              value={form.images}
              onChange={(urls) => setForm({ ...form, images: urls })}
              maxImages={5}
              disabled={loading}
            />
            <Input label="Amenities (comma-separated)" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>Create</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}


