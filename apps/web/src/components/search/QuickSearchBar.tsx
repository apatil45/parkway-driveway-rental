'use client';

import { Button, Input, AddressAutocomplete } from '@/components/ui';
import { MapPinIcon, FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getDateTimeLocalMin } from '@/lib/date-utils';

export interface QuickSearchBarProps {
  locationValue: string;
  onLocationChange: (value: string) => void;
  onLocationSelect: (lat: number, lon: number) => void;
  startValue: string;
  onStartChange: (value: string) => void;
  endValue: string;
  onEndChange: (value: string) => void;
  onSearch: () => void;
  onUseMyLocation: () => void;
  onFiltersClick?: () => void;
  filterCount?: number;
  loading?: boolean;
  /** When set, shows a close button to collapse the form (e.g. when opened from trigger). */
  onClose?: () => void;
}

export default function QuickSearchBar({
  locationValue,
  onLocationChange,
  onLocationSelect,
  startValue,
  onStartChange,
  endValue,
  onEndChange,
  onSearch,
  onUseMyLocation,
  onFiltersClick,
  filterCount = 0,
  loading = false,
  onClose,
}: QuickSearchBarProps) {
  const minDateTime = getDateTimeLocalMin();

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-md rounded-b-xl overflow-hidden w-full max-w-lg mx-auto">
      <div className="px-4 py-3 space-y-4">
        {/* Header: title + close — SpotHero-style search form */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">Find parking</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close search form"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Where — SpotHero: "Where are you going?" */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500">Where are you going?</label>
          <AddressAutocomplete
            value={locationValue}
            onChange={onLocationChange}
            onLocationSelect={onLocationSelect}
            onSubmit={onSearch}
            minimal
            placeholder="Address, city, or venue"
            className="text-sm w-full"
          />
        </div>

        {/* When — SpotHero: Start time / End time */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-500">When</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="sr-only" htmlFor="quick-start">Start time</label>
              <Input
                id="quick-start"
                type="datetime-local"
                value={startValue}
                onChange={(e) => onStartChange(e.target.value)}
                min={minDateTime}
                className="w-full min-w-0 text-sm sm:text-base pr-2"
                aria-label="Start time"
              />
            </div>
            <div className="min-w-0">
              <label className="sr-only" htmlFor="quick-end">End time</label>
              <Input
                id="quick-end"
                type="datetime-local"
                value={endValue}
                onChange={(e) => onEndChange(e.target.value)}
                min={startValue || minDateTime}
                className="w-full min-w-0 text-sm sm:text-base pr-2"
                aria-label="End time"
              />
            </div>
          </div>
        </div>

        {/* Actions: aligned row */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUseMyLocation}
            className="flex-1 min-w-0 sm:flex-none"
            aria-label="Use my location"
          >
            <MapPinIcon className="w-4 h-4 sm:mr-1.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline truncate">Location</span>
          </Button>
          {onFiltersClick && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onFiltersClick}
              className="shrink-0 inline-flex items-center gap-1.5"
              aria-label="Filters"
            >
              <FunnelIcon className="w-4 h-4 shrink-0" aria-hidden />
              {filterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-semibold bg-primary-600 text-white">
                  {filterCount}
                </span>
              )}
            </Button>
          )}
          <Button onClick={onSearch} size="sm" loading={loading} className="shrink-0 min-w-[100px]">
            Find Parking
          </Button>
        </div>
      </div>
    </div>
  );
}
