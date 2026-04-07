'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import { useOffline } from '@/hooks';

interface AppLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
  /** When "marketing", footer uses gray-900 and guest-oriented links (e.g. Sign Up, Host Guide). */
  footerVariant?: 'default' | 'marketing';
}

export default function AppLayout({
  children,
  showNavbar = true,
  showBreadcrumbs = true,
  showFooter = true,
  footerVariant = 'default',
}: AppLayoutProps) {
  // Detect offline status (shows toast automatically)
  useOffline();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      {showNavbar && <Navbar />}
      {showBreadcrumbs && <Breadcrumbs />}
      <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
      {showFooter && <Footer variant={footerVariant} />}
    </div>
  );
}

