'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, SkeletonList } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import api from '@/lib/api';

interface DrivewayItem {
  id: string;
  title: string;
  address: string;
  pricePerHour: number;
  isActive: boolean;
}

export default function OwnerDrivewaysPage() {
  const [items, setItems] = useState<DrivewayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/driveways?owner=me&limit=50');
      const data = res.data?.data;
      const list = Array.isArray(data?.driveways) ? data.driveways : data;
      setItems(list || []);
    } catch (err: any) {
      console.error('Failed to load driveways:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load driveways. Please try again.';
      setError(errorMessage);
      setItems([]); // Clear items on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Driveways</h1>
        <Link href="/driveways/new" className="btn btn-primary">New Driveway</Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading driveways</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-sm underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <SkeletonList count={5} />
      ) : items.length === 0 && !error ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">You have not listed any driveways yet.</p>
        </Card>
      ) : !error ? (
        <div className="space-y-4">
          {items.map((d) => (
            <Card key={d.id} clickable>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{d.title}</h3>
                  <p className="text-gray-600 text-sm">{d.address}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">${d.pricePerHour.toFixed(2)}/hr</div>
                  <div className="text-sm text-gray-500">{d.isActive ? 'Active' : 'Inactive'}</div>
                  <div className="mt-2">
                    <Link href={`/driveways/${d.id}/edit`} className="text-primary-600 hover:text-primary-800 text-sm">Edit</Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  );
}


