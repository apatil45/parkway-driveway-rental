'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, ImageUpload } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import api from '@/lib/api';

export default function EditDrivewayPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', address: '', pricePerHour: '', capacity: '', images: [] as string[], amenities: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/driveways?owner=me&limit=200');
        const list = res.data?.data?.driveways || res.data?.data || [];
        const d = list.find((x: any) => x.id === params.id);
        if (d) setForm({
          title: d.title,
          address: d.address,
          pricePerHour: String(d.pricePerHour),
          capacity: String(d.capacity),
          images: d.images || [],
          amenities: (d.amenities || []).join(', '),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/driveways/${params.id}`, {
        title: form.title,
        address: form.address,
        pricePerHour: Number(form.pricePerHour),
        capacity: Number(form.capacity),
        images: form.images || [],
        amenities: form.amenities ? form.amenities.split(',').map(s => s.trim()) : [],
      });
      router.push('/driveways');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update driveway');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="h-36 skeleton" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Driveway</h1>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            <Input label="Price per hour (USD)" type="number" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} required />
            <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <ImageUpload
              value={form.images}
              onChange={(urls) => setForm({ ...form, images: urls })}
              maxImages={5}
              disabled={saving}
            />
            <Input label="Amenities (comma-separated)" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}


