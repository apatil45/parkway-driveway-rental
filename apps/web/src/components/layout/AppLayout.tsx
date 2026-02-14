'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import { useOffline } from '@/hooks';

interface AppLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
}

export default function AppLayout({
  children,
  showBreadcrumbs = true,
  showFooter = true,
}: AppLayoutProps) {
  // Detect offline status (shows toast automatically)
  useOffline();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <Navbar />
      {showBreadcrumbs && <Breadcrumbs />}
      <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

