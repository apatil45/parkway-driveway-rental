'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <AppLayout showFooter={true}>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
            <Link href="/search">
              <Button variant="outline">Search Driveways</Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

