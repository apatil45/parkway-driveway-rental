'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import Button from './Button';

interface FloatingActionsProps {
  className?: string;
}

export default function FloatingActions({ className = '' }: FloatingActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Hide on certain pages
  const hideOnPages = ['/login', '/register', '/checkout'];
  const shouldHide = hideOnPages.some(page => pathname.startsWith(page));

  useEffect(() => {
    // Close when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-actions')) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isExpanded]);

  if (shouldHide) {
    return null;
  }

  const handleQuickSearch = () => {
    router.push('/search');
    setIsExpanded(false);
  };

  const handleListDriveway = () => {
    if (isAuthenticated) {
      router.push('/driveways/new');
    } else {
      router.push('/login?redirect=/driveways/new');
    }
    setIsExpanded(false);
  };

  const handleBookParking = () => {
    router.push('/search');
    setIsExpanded(false);
  };

  return (
    <>
      <div className={`fixed bottom-6 right-1 z-0 floating-actions ${className}`}>
        {/* Action Buttons */}
        <div
          className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${
            isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* Quick Search */}
          <div className="group relative">
            <button
              onClick={handleQuickSearch}
              className="flex items-center gap-3 bg-white text-gray-900 shadow-lg rounded-full px-4 py-3 hover:bg-gray-50 transition-all hover:shadow-xl min-w-[180px]"
              aria-label="Quick Search"
            >
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-sm font-medium">Quick Search</span>
            </button>
            <div className="relative right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Search for parking
              </div>
            </div>
          </div>

          {/* List Driveway (only if authenticated) */}
          {isAuthenticated && (
            <div className="group relative">
              <button
                onClick={handleListDriveway}
                className="flex items-center gap-4 bg-primary-600 text-white shadow-lg rounded-full px-4 py-3 hover:bg-primary-700 transition-all hover:shadow-xl min-w-[180px]"
                aria-label="List Driveway"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm font-medium">List Driveway</span>
              </button>
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  List your driveway
                </div>
              </div>
            </div>
          )}

          {/* Book Parking */}
          <div className="group relative">
            <button
              onClick={handleBookParking}
              className="flex items-center gap-3 bg-white text-gray-900 shadow-lg rounded-full px-4 py-3 hover:bg-gray-50 transition-all hover:shadow-xl min-w-[180px]"
              aria-label="Book Parking"
            >
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">Book Parking</span>
            </button>
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Find parking now
              </div>
            </div>
          </div>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all hover:shadow-xl flex items-center justify-center ${
            isExpanded ? 'rotate-45' : 'rotate-0'
          }`}
          aria-label="Toggle Quick Actions"
          aria-expanded={isExpanded}
          data-testid="fab-toggle"
        >
          <svg
            className="w-6 h-6 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isExpanded ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Backdrop (for mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

