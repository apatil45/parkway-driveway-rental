'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';

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
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {showBreadcrumbs && <Breadcrumbs />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

