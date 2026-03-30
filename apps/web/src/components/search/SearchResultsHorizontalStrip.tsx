'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Select, VerifiedBadge, ImageWithPlaceholder } from '@/components/ui';
import { MapPinIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import type { SearchDriveway, DrivewayPagination } from '@/types/driveway';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'distance_asc', label: 'Nearest first' },
] as const;

export interface SearchResultsHorizontalStripProps {
  emptyResults: boolean;
  loading: boolean;
  driveways: SearchDriveway[];
  pagination: DrivewayPagination;
  selectedDrivewayId: string | null;
  hoveredDrivewayId: string | null;
  onDrivewayHover: (id: string | null) => void;
  onPageChange: (page: number) => void;
  sort: string;
  onSortChange: (value: string) => void;
  radiusKm?: string;
  hasLocation?: boolean;
  searchLocationName?: string;
  formatPrice: (price: number) => string;
  renderStars: (rating: number) => React.ReactNode;
  calculateDistanceKm: (d: SearchDriveway) => number | null;
  isMobileView: boolean;
  /** When provided, shows a "See full list" control that calls this (list view with navbar). */
  onExpandList?: () => void;
  /** Called when the currently visible (on-screen) slot changes after scroll/slide. Use to highlight that slot on the map. */
  onVisibleDrivewayChange?: (id: string | null) => void;
}

const CARD_ROW_HEIGHT = 160;
const CARD_MIN_WIDTH_DESKTOP = 280;
const STRIP_HEADER_HEIGHT = 44;
const STRIP_PAGINATION_HEIGHT = 44;
const STRIP_HEIGHT = STRIP_HEADER_HEIGHT + CARD_ROW_HEIGHT + STRIP_PAGINATION_HEIGHT;
/** Mobile: fixed card height; no header row (search/filter/full list live in top bar). Increased for better visibility. */
const MOBILE_CARD_HEIGHT = 200;
const STRIP_HEIGHT_MOBILE = MOBILE_CARD_HEIGHT + STRIP_PAGINATION_HEIGHT;

export default function SearchResultsHorizontalStrip({
  emptyResults,
  loading,
  driveways,
  pagination,
  selectedDrivewayId,
  hoveredDrivewayId,
  onDrivewayHover,
  onPageChange,
  sort,
  onSortChange,
  radiusKm,
  hasLocation,
  searchLocationName,
  formatPrice,
  renderStars,
  calculateDistanceKm,
  isMobileView,
  onExpandList,
  onVisibleDrivewayChange,
}: SearchResultsHorizontalStripProps) {
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVisibleIndexRef = useRef<number>(-1);

  const updateVisibleDriveway = useCallback(() => {
    const el = scrollRef.current;
    if (!el || driveways.length === 0 || !onVisibleDrivewayChange || !isMobileView) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const index = Math.round(el.scrollLeft / width);
    const clamped = Math.max(0, Math.min(index, driveways.length - 1));
    if (clamped !== lastVisibleIndexRef.current) {
      lastVisibleIndexRef.current = clamped;
      onVisibleDrivewayChange(driveways[clamped].id);
    }
  }, [driveways, onVisibleDrivewayChange, isMobileView]);

  useEffect(() => {
    if (!isMobileView) return;
    const el = scrollRef.current;
    if (!el || !onVisibleDrivewayChange || driveways.length === 0) return;
    updateVisibleDriveway();
    const onScroll = () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(updateVisibleDriveway, 100);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [isMobileView, driveways, onVisibleDrivewayChange, updateVisibleDriveway]);

  useEffect(() => {
    if (isMobileView && driveways.length > 0 && onVisibleDrivewayChange) lastVisibleIndexRef.current = -1;
  }, [isMobileView, driveways, onVisibleDrivewayChange]);

  const formatDistance = (d: SearchDriveway) => {
    const km = calculateDistanceKm(d);
    if (km === null) return null;
    if (km < 0.1) return '< 100 m';
    return `${km.toFixed(1)} km`;
  };

  if (emptyResults) {
    return (
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-8 text-center">
        <p className="text-gray-600">No spots match your search</p>
      </div>
    );
  }

  const countText = loading
    ? 'Searching...'
    : (() => {
        const n = pagination.total;
        const spots = n === 1 ? 'spot' : 'spots';
        if (radiusKm && Number(radiusKm) > 0) return `${n} ${spots} within ${radiusKm} km`;
        if (hasLocation && searchLocationName) return `${n} ${spots} near ${searchLocationName}`;
        if (hasLocation) return `${n} ${spots} nearby`;
        return `${n} ${spots} found`;
      })();

  const stripHeight = isMobileView ? STRIP_HEIGHT_MOBILE : STRIP_HEIGHT;

  return (
    <div
      className={`flex flex-col overflow-hidden ${isMobileView ? 'flex-shrink-0 bg-transparent' : 'flex-1 min-h-0 bg-white'}`}
      style={isMobileView ? { height: stripHeight } : undefined}
      aria-label="Search results"
    >
      {/* Header: count + sort + See full list — desktop only; on mobile these live in the top search bar. */}
      {!isMobileView && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-600 truncate">{countText}</p>
          <div className="flex items-center gap-2 shrink-0">
            {onExpandList && (
              <button
                type="button"
                onClick={onExpandList}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
              >
                See full list
              </button>
            )}
            <div className="relative" ref={sortMenuRef}>
              <Select
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                options={[...SORT_OPTIONS]}
                className="min-w-[130px] text-xs"
                aria-label="Sort results"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile: horizontal strip at bottom. Desktop: vertical list, top-down scroll on right. */}
      {isMobileView ? (
        <div
          ref={scrollRef}
          className="flex-shrink-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-[env(safe-area-inset-bottom,0)] snap-x snap-mandatory scroll-smooth"
          style={{ height: MOBILE_CARD_HEIGHT }}
          role="list"
          aria-label="Parking spots"
        >
          {loading && driveways.length === 0 ? (
            <div className="flex h-full">
              <div className="animate-pulse rounded-xl bg-gray-100 flex-shrink-0 snap-center w-[100vw] max-w-[100vw] box-border mx-2" style={{ height: MOBILE_CARD_HEIGHT - 16 }} />
            </div>
          ) : (
            <div className="flex h-full" style={{ width: 'max-content', minWidth: '100%' }}>
              {driveways.map((driveway) => {
                const isHighlighted = selectedDrivewayId === driveway.id || hoveredDrivewayId === driveway.id;
                const distanceStr = formatDistance(driveway);
                const hasReviews = (driveway.reviewCount ?? 0) > 0;
                return (
                  <Link
                    key={driveway.id}
                    id={`driveway-card-${driveway.id}`}
                    href={`/driveway/${driveway.id}`}
                    role="listitem"
                    className="flex-shrink-0 w-[100vw] max-w-[100vw] snap-center snap-always box-border flex flex-col justify-end"
                    style={{ minWidth: '100vw', height: MOBILE_CARD_HEIGHT }}
                    onMouseEnter={() => onDrivewayHover(driveway.id)}
                    onMouseLeave={() => onDrivewayHover(null)}
                  >
                    <div
                      className={`mx-2 mb-1.5 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 flex flex-row ${
                        isHighlighted ? 'ring-2 ring-primary-500 border-primary-300 shadow-md' : 'hover:shadow-md hover:border-gray-300'
                      }`}
                    >
                      <div className="w-20 flex-shrink-0 bg-gray-100 self-stretch">
                        <ImageWithPlaceholder
                          src={driveway.images?.length ? driveway.images[0] : ''}
                          alt={driveway.title}
                          className="w-full h-full object-cover min-h-[80px]"
                          placeholderClassName="min-h-[80px]"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col py-2.5 pr-3 pl-2">
                        <div className="flex flex-col items-end text-right">
                          <span className="text-base font-bold text-primary-600">{formatPrice(driveway.pricePerHour)}<span className="text-sm font-bold text-gray-500">/hr</span></span>
                        </div>
                        <div className="mt-1 flex flex-col items-end">
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <h3 className="text-sm font-semibold text-gray-900 truncate max-w-full">{driveway.title}</h3>
                            {driveway.verificationStatus === 'VERIFIED' && <VerifiedBadge className="shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5 w-full text-right">{driveway.address}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap justify-end mt-1">
                            {driveway.isAvailable && (
                              <span className="px-1.5 py-0.5 font-medium text-green-700 bg-green-50 rounded">Available</span>
                            )}
                            {distanceStr !== null && (
                              <span className="flex items-center gap-0.5">
                                <MapPinIcon className="w-3 h-3" />
                                {distanceStr}
                              </span>
                            )}
                            {hasReviews ? (
                              <span className="flex items-center gap-0.5">
                                {renderStars(driveway.averageRating)}
                                <span>({driveway.reviewCount})</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">New</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1.5 flex justify-end">
                          <span className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm py-1.5 px-3 hover:bg-primary-700 transition-colors">Book →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Desktop: vertical list, top-down scroll, right-aligned sidebar */
        <div className="flex-1 min-h-[200px] overflow-y-auto overflow-x-hidden overscroll-y-contain">
          {loading && driveways.length === 0 ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-gray-100 animate-pulse" style={{ height: 120 }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              {driveways.map((driveway) => {
                const isHighlighted = selectedDrivewayId === driveway.id || hoveredDrivewayId === driveway.id;
                const distanceStr = formatDistance(driveway);
                const hasReviews = (driveway.reviewCount ?? 0) > 0;
                return (
                  <Link
                    key={driveway.id}
                    id={`driveway-card-${driveway.id}`}
                    href={`/driveway/${driveway.id}`}
                    className={`w-full rounded-xl bg-white border shadow-sm overflow-hidden transition-all duration-200 flex flex-row ${
                      isHighlighted ? 'ring-2 ring-primary-500 border-primary-300' : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                    }`}
                    style={{ minHeight: CARD_ROW_HEIGHT - 24 }}
                    onMouseEnter={() => onDrivewayHover(driveway.id)}
                    onMouseLeave={() => onDrivewayHover(null)}
                  >
                    <div className="w-24 flex-shrink-0 bg-gray-100 self-stretch">
                      <ImageWithPlaceholder
                        src={driveway.images?.length ? driveway.images[0] : ''}
                        alt={driveway.title}
                        className="w-full h-full object-cover min-h-[90px]"
                        placeholderClassName="min-h-[90px]"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col py-3 pr-3 pl-2 justify-between">
                      <div className="flex flex-col items-end text-right">
                        <span className="text-base font-bold text-primary-600">{formatPrice(driveway.pricePerHour)}<span className="text-sm font-bold text-gray-500">/hr</span></span>
                      </div>
                      <div className="flex flex-col items-end mt-1">
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <h3 className="text-sm font-semibold text-gray-900 truncate max-w-full">{driveway.title}</h3>
                          {driveway.verificationStatus === 'VERIFIED' && <VerifiedBadge className="shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5 w-full text-right">{driveway.address}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap justify-end mt-1.5">
                          {driveway.isAvailable && (
                            <span className="px-1.5 py-0.5 font-medium text-green-700 bg-green-50 rounded">Available</span>
                          )}
                          {distanceStr !== null && (
                            <span className="flex items-center gap-0.5">
                              <MapPinIcon className="w-3 h-3" />
                              {distanceStr}
                            </span>
                          )}
                          {hasReviews ? (
                            <span className="flex items-center gap-0.5">
                              {renderStars(driveway.averageRating)}
                              <span>({driveway.reviewCount})</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">New</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1.5 flex justify-end">
                        <span className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm py-1.5 px-3 hover:bg-primary-700 transition-colors">Book →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 ${isMobileView ? 'bg-transparent' : 'border-t border-gray-100'}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-xs text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
