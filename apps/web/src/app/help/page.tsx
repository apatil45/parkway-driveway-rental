'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <QuestionMarkCircleIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600">Find answers or get in touch with our team.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <Link href="/about">
            <Card className="h-full p-6 hover:shadow-md transition-shadow">
              <BookOpenIcon className="w-10 h-10 text-primary-600 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">How it works</h2>
              <p className="text-gray-600 text-sm">Learn how to find parking or list your driveway.</p>
            </Card>
          </Link>
          <Link href="/contact">
            <Card className="h-full p-6 hover:shadow-md transition-shadow">
              <EnvelopeIcon className="w-10 h-10 text-primary-600 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact us</h2>
              <p className="text-gray-600 text-sm">Send a message and we&apos;ll get back within 24 hours.</p>
            </Card>
          </Link>
        </div>
        <div className="text-center">
          <Link href="/contact">
            <Button>Contact support</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
