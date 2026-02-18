'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Known path segments → friendly labels */
const SEGMENT_LABELS: Record<string, string> = {
  bookings: 'Bookings',
  booking: 'Booking',
  driveways: 'Driveways',
  driveway: 'Driveway',
  navigate: 'Directions',
  edit: 'Edit',
  new: 'New',
  search: 'Search',
  favorites: 'Favorites',
  checkout: 'Checkout',
  dashboard: 'Dashboard',
  profile: 'Profile',
  pricing: 'Pricing',
  about: 'About',
  contact: 'Contact',
};

/** Heuristic: segment looks like an ID (cuid/uuid style) */
function looksLikeId(segment: string): boolean {
  if (segment.length < 8 || segment.length > 40) return false;
  return /^[a-zA-Z0-9_-]+$/.test(segment);
}

/** Friendly label for a path segment given its parent segment */
function getSegmentLabel(segment: string, parentSegment: string | null): string {
  const lower = segment.toLowerCase();
  if (SEGMENT_LABELS[lower]) return SEGMENT_LABELS[lower];
  if (looksLikeId(segment)) {
    if (parentSegment === 'bookings') return 'Booking';
    if (parentSegment === 'driveway' || parentSegment === 'driveways') return 'Listing';
  }
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const paths = pathname.split('/').filter(Boolean);
  if (paths.length <= 1) return null;

  const items: { href: string; label: string; isLast: boolean }[] = [
    { href: '/', label: 'Home', isLast: false },
  ];

  paths.forEach((segment, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/');
    const parent = index > 0 ? paths[index - 1] : null;
    const label = getSegmentLabel(segment, parent);
    items.push({
      href,
      label,
      isLast: index === paths.length - 1,
    });
  });

  return (
    <nav className="bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {items.map((crumb, index) => (
            <li key={`${index}-${crumb.href}`} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-1 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {crumb.isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
