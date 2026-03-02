'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';

/** Earnings page redirects to dashboard until full earnings UI is implemented. */
export default function EarningsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(isAuthenticated ? '/dashboard' : '/login?redirect=' + encodeURIComponent('/earnings'));
    }
  }, [loading, isAuthenticated, router]);

  return (
    <AppLayout>
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    </AppLayout>
  );
}
