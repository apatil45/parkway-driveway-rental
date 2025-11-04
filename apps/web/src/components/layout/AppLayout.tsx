'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import FloatingActions from '@/components/ui/FloatingActions';
import { useOffline } from '@/hooks';

interface AppLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
  showFloatingActions?: boolean;
}

export default function AppLayout({
  children,
  showBreadcrumbs = true,
  showFooter = true,
  showFloatingActions = true,
}: AppLayoutProps) {
  // Detect offline status (shows toast automatically)
  useOffline();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {showBreadcrumbs && <Breadcrumbs />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
      {showFloatingActions && <FloatingActions />}
    </div>
  );
}

