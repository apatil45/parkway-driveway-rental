'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/solid';

interface VerifiedBadgeProps {
  className?: string;
  /** Optional tooltip text (e.g. "Address verified by ParkwayAi") */
  title?: string;
}

export default function VerifiedBadge({ className = '', title = 'This listing\'s address was verified.' }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 ${className}`}
      title={title}
    >
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}
