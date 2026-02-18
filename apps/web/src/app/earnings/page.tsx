'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function EarningsPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CurrencyDollarIcon className="w-16 h-16 text-primary-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Earnings</h1>
          <p className="text-gray-600 mb-8">
            View your driveway earnings, payouts, and transaction history in your dashboard.
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </Card>
      </div>
    </AppLayout>
  );
}
