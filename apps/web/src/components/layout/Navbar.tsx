'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import { NotificationCenter } from '@/components/ui';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navbar on login/register pages (they have their own headers)
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const navLinks = isAuthenticated
    ? [
        { href: '/search', label: 'Search' },
        { href: '/driveways', label: 'My Driveways' },
        { href: '/bookings', label: 'Bookings' },
        { href: '/favorites', label: 'Favorites' },
      ]
    : [
        { href: '/search', label: 'Search' },
        { href: '/about', label: 'About' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/contact', label: 'Contact' },
      ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">Parkway</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 flex-1 mx-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Global Search Bar */}
              <div className="flex-1 max-w-md">
                <SearchBar />
              </div>
            </nav>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-4">
                  {/* Desktop Auth/Actions */}
                  <div className="hidden lg:flex items-center space-x-4">
                     {isAuthenticated ? (
                       <>
                         <Link
                           href="/dashboard"
                           className="text-sm font-medium text-gray-600 hover:text-gray-900"
                         >
                           Dashboard
                         </Link>
                         <Link
                           href="/profile"
                           className="text-sm font-medium text-gray-600 hover:text-gray-900"
                         >
                           Profile
                         </Link>
                         <NotificationCenter />
                         <UserMenu />
                       </>
                     ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
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

