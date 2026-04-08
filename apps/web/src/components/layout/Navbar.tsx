'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';
import { NotificationCenter, Logo } from '@/components/ui';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('ADMIN'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navbar on login/register pages (they have their own headers)
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  /** Primary nav: keep the bar short; account-specific items also live in UserMenu (desktop) / drawer (mobile). */
  const navLinks = isAuthenticated
    ? [
        { href: '/search', label: 'Find parking' },
        { href: '/bookings', label: 'Bookings' },
        { href: '/driveways', label: 'My driveways' },
        { href: '/favorites', label: 'Favorites' },
        { href: '/pricing', label: 'Pricing' },
      ]
    : [
        { href: '/search', label: 'Find parking' },
        { href: '/driveways/new', label: 'List your driveway' },
        { href: '/about', label: 'About' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/contact', label: 'Contact' },
      ];

  return (
    <>
      <header className="sticky top-0 z-navbar bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] shadow-sm safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14 md:h-16 min-h-[3.5rem]">
            {/* Logo — left */}
            <Logo variant="full" size="md" href="/" className="flex shrink-0 items-center" />

            {/* Nav + account — right (desktop); hamburger only on small screens */}
            <div className="flex min-w-0 flex-1 items-center justify-end gap-6 lg:gap-8">
              <nav
                className="hidden lg:flex items-center gap-6"
                aria-label="Main"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`shrink-0 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden lg:flex items-center gap-4 border-l border-[rgb(var(--color-border))] pl-6 lg:pl-8">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin/verifications"
                        className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-800"
                      >
                        Verifications
                      </Link>
                    )}
                    <NotificationCenter />
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500 px-4 py-2.5"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                data-testid="mobile-menu-button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

