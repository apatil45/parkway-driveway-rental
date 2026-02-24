'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';


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
  help: 'Help',
  earnings: 'Earnings',
  privacy: 'Privacy',
  'forgot-password': 'Forgot password',
  'reset-password': 'Reset password',
  'host-guide': 'Host guide',
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
  if (paths.length === 0) return null;

  const items: { href: string; label: string; isLast: boolean; isLink: boolean }[] = [
    { href: '/', label: 'Home', isLast: false, isLink: true },
  ];

  paths.forEach((segment, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/');
    const parent = index > 0 ? paths[index - 1] : null;
    const label = getSegmentLabel(segment, parent);
    const isLast = index === paths.length - 1;
    const nextSegment = index + 1 < paths.length ? paths[index + 1] : null;
    // Don't link ID segments when the next segment is a known child route with no detail page
    const isIdWithNoDetailPage = looksLikeId(segment) && (nextSegment === 'navigate' || nextSegment === 'edit');
    // Don't link "driveway" when next segment is an ID – /driveway has no page, only /driveway/[id]
    const isDrivewayWithIdChild = segment.toLowerCase() === 'driveway' && nextSegment && looksLikeId(nextSegment);
    const isLink = !isLast && !isIdWithNoDetailPage && !isDrivewayWithIdChild;
    items.push({
      href,
      label,
      isLast,
      isLink,
    });
  });

  return (
    <nav className="relative z-10 bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
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
              {crumb.isLast || !crumb.isLink ? (
                <span
                  className={crumb.isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}
                  aria-current={crumb.isLast ? 'page' : undefined}
                >
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
