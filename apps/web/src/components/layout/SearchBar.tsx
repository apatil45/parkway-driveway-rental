'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('parkway_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('parkway_recent_searches', JSON.stringify(updated));

    // Navigate to search page
    router.push(`/search?location=${encodeURIComponent(searchQuery)}`);
    setQuery('');
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('parkway_recent_searches');
  };

  // Hide search bar on search page itself
  if (pathname === '/search') {
    return null;
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div
        className={`relative flex items-center rounded-xl border bg-gray-50 transition-colors duration-150 ${
          isFocused
            ? 'border-primary-300 bg-white ring-2 ring-primary-500/20'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80'
        }`}
      >
        <span className="pointer-events-none pl-3.5 text-gray-400" aria-hidden>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search locations..."
          aria-label="Search for parking locations"
          className="w-full bg-transparent py-2.5 pl-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsFocused(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 max-h-[min(24rem,70vh)] overflow-y-auto">
          {recentSearches.length > 0 && (
            <div className="border-b border-gray-100 py-2">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recent</span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
                >
                  Clear
                </button>
              </div>
              <div className="px-1">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleRecentClick(recent)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="truncate">{recent}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="py-2">
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick actions</span>
            </div>
            <div className="px-1 space-y-0.5">
              <button
                type="button"
                onClick={() => { setQuery(''); router.push('/search'); setIsFocused(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                Browse all driveways
              </button>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); router.push('/driveways/new'); setIsFocused(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  List driveway
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

