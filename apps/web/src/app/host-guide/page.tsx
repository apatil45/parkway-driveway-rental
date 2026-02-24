'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import {
  HomeIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function HostGuidePage() {
  const steps = [
    { icon: HomeIcon, title: 'List your space', text: 'Add your driveway with photos, address, and availability.' },
    { icon: PhotoIcon, title: 'Set your rate', text: 'Choose your hourly or daily price. You keep 85–90% of each booking.' },
    { icon: CalendarIcon, title: 'Manage bookings', text: 'Accept or decline requests. You stay in control of your calendar.' },
    { icon: CurrencyDollarIcon, title: 'Get paid', text: 'Receive payouts after each completed booking.' },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Host Guide</h1>
          <p className="text-gray-600">How to list your driveway and start earning on Parkway.</p>
        </div>
        <div className="space-y-6 mb-12">
          {steps.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex gap-4 items-start">
              <Icon className="w-10 h-10 text-primary-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
                <p className="text-gray-600">{text}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Link href="/driveways/new">
            <Button>List driveway</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
