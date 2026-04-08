'use client';

import { Button, Input, Select, AddressAutocomplete } from '@/components/ui';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface SearchFiltersFields {
  location: string;
  priceMin: string;
  priceMax: string;
  carSize: string;
  amenities: string[];
  latitude?: string;
  longitude?: string;
  radius?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc';
}

type FilterKey = keyof SearchFiltersFields;

export interface SearchFiltersPanelProps {
  filters: SearchFiltersFields;
  showMoreFilters: boolean;
  onShowMoreChange: (open: boolean) => void;
  onFilterChange: (key: FilterKey, value: string | string[]) => void;
  onApply: () => void;
  onClose: () => void;
  onUseMyLocation: () => void;
  loading: boolean;
  /** Narrow popover under search (map). Wider strip when full list is open. */
  layout: 'popover' | 'list';
}

export default function SearchFiltersPanel({
  filters,
  showMoreFilters,
  onShowMoreChange,
  onFilterChange,
  onApply,
  onClose,
  onUseMyLocation,
  loading,
  layout,
}: SearchFiltersPanelProps) {
  const isPopover = layout === 'popover';

  return (
    <div
      className={
        isPopover
          ? 'flex max-h-[min(52vh,28rem)] w-full max-w-[20rem] flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-lg ring-1 ring-black/5 sm:max-w-[22rem]'
          : 'flex max-h-[min(48vh,22rem)] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:max-h-none md:max-w-none'
      }
      role="dialog"
      aria-labelledby="search-filters-title"
      aria-modal="false"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <h2 id="search-filters-title" className="text-sm font-semibold text-gray-900">
          Filters
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close filters"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${isPopover ? 'px-3 py-2.5' : 'px-3 py-2'} space-y-2.5`}
      >
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="sf-min" className="mb-0.5 block text-[11px] font-medium text-gray-500">
              Min $/hr
            </label>
            <Input
              id="sf-min"
              type="number"
              inputMode="decimal"
              value={filters.priceMin}
              onChange={(e) => onFilterChange('priceMin', e.target.value)}
              placeholder="—"
              className="!h-9 !min-h-0 w-full py-1.5 text-sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="sf-max" className="mb-0.5 block text-[11px] font-medium text-gray-500">
              Max $/hr
            </label>
            <Input
              id="sf-max"
              type="number"
              inputMode="decimal"
              value={filters.priceMax}
              onChange={(e) => onFilterChange('priceMax', e.target.value)}
              placeholder="—"
              className="!h-9 !min-h-0 w-full py-1.5 text-sm"
            />
          </div>
        </div>

        <div className={isPopover ? 'space-y-2' : 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3'}>
          <div className="min-w-0">
            <label htmlFor="sf-car" className="mb-0.5 block text-[11px] font-medium text-gray-500">
              Size
            </label>
            <Select
              id="sf-car"
              value={filters.carSize}
              onChange={(e) => onFilterChange('carSize', e.target.value)}
              className="!h-9 !min-h-0 py-1 text-sm"
              options={[
                { value: '', label: 'Any' },
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
                { value: 'extra-large', label: 'XL' },
              ]}
            />
          </div>
          <div className="min-w-0 sm:col-span-1">
            <label htmlFor="sf-sort" className="mb-0.5 block text-[11px] font-medium text-gray-500">
              Sort
            </label>
            <Select
              id="sf-sort"
              value={filters.sort || ''}
              onChange={(e) => onFilterChange('sort', e.target.value)}
              className="!h-9 !min-h-0 py-1 text-sm"
              options={[
                { value: '', label: 'Relevance' },
                { value: 'price_asc', label: 'Price ↑' },
                { value: 'price_desc', label: 'Price ↓' },
                { value: 'rating_desc', label: 'Rating' },
                { value: 'distance_asc', label: 'Nearest' },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUseMyLocation}
            className="h-8 px-2.5 text-xs"
          >
            <MapPinIcon className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden />
            Near me
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onShowMoreChange(!showMoreFilters)}
            aria-expanded={showMoreFilters}
            className="h-8 px-2.5 text-xs"
          >
            {showMoreFilters ? 'Less' : 'More'}
          </Button>
        </div>

        {showMoreFilters && (
          <div className="space-y-2 border-t border-gray-100 pt-2.5" id="search-filters-more">
            <AddressAutocomplete
              label="Area"
              value={filters.location}
              onChange={(address) => onFilterChange('location', address)}
              onLocationSelect={(lat, lon) => {
                onFilterChange('latitude', String(lat));
                onFilterChange('longitude', String(lon));
              }}
              userLocationProp={
                filters.latitude && filters.longitude
                  ? { lat: Number(filters.latitude), lon: Number(filters.longitude) }
                  : undefined
              }
              placeholder="City or address"
              className="text-sm"
            />
            <div>
              <label htmlFor="sf-radius" className="mb-0.5 block text-[11px] font-medium text-gray-500">
                Radius (km)
              </label>
              <Input
                id="sf-radius"
                type="number"
                min="1"
                inputMode="numeric"
                value={filters.radius}
                onChange={(e) => onFilterChange('radius', e.target.value)}
                placeholder="5"
                className="!h-9 !min-h-0 py-1.5 text-sm"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-gray-500">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {['covered', 'security', 'ev_charging', 'easy_access'].map((amenity) => {
                  const on = filters.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => {
                        if (on) {
                          onFilterChange(
                            'amenities',
                            filters.amenities.filter((a) => a !== amenity)
                          );
                        } else {
                          onFilterChange('amenities', [...filters.amenities, amenity]);
                        }
                      }}
                      className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                        on
                          ? 'border-primary-500 bg-primary-50 text-primary-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="capitalize">{amenity.replace('_', ' ')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-3 py-2">
        <Button
          type="button"
          onClick={onApply}
          loading={loading}
          size="sm"
          className="h-9 w-full text-sm font-semibold"
        >
          Apply filters
        </Button>
      </div>
    </div>
  );
}
