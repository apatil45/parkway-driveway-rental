'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driveways?owner=me&limit=50');
      const data = res.data?.data;
      const list = Array.isArray(data?.driveways) ? data.driveways : data;
      setItems(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Driveways</h1>
        <Link href="/driveways/new" className="btn btn-primary">New Driveway</Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 skeleton" />
          <div className="h-20 skeleton" />
          <div className="h-20 skeleton" />
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">You have not listed any driveways yet.</p>
        </Card>
      ) : (
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
  );
}


