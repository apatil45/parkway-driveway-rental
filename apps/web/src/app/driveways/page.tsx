'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, SkeletonList } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import api from '@/lib/api-client';

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
      const res = await api.get<{ driveways?: any[] }>('/driveways?owner=me&limit=50');
      const data = res.data?.data;
      const list = Array.isArray(data?.driveways) ? data.driveways : (Array.isArray(data) ? data : []);
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
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Driveways</h1>
        <Link
          href="/driveways/new"
          className="btn btn-primary inline-flex items-center justify-center w-12 h-12 min-w-[3rem] min-h-[3rem] p-0 rounded-xl text-xl font-medium leading-none shrink-0"
          aria-label="New Driveway"
        >
          +
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading driveways</p>
          <p className="text-sm mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={load} className="mt-3">
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <SkeletonList count={5} />
      ) : items.length === 0 && !error ? (
        <Card className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No driveways yet</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">List your first driveway to start earning. It only takes a few minutes.</p>
          <Link href="/driveways/new" className="btn btn-primary inline-flex items-center justify-center min-h-[44px] px-6">
            List driveway
          </Link>
        </Card>
      ) : !error ? (
        <div className="space-y-3">
          {items.map((d) => (
            <Card key={d.id} clickable padding="sm">
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
      ) : null}
      </div>
    </AppLayout>
  );
}


