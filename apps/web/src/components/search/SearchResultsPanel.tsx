'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, LoadingSpinner, Skeleton, Select } from '@/components/ui';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { SearchDriveway, DrivewayPagination } from '@/types/driveway';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'distance_asc', label: 'Nearest first' },
] as const;

export interface SearchResultsPanelProps {
  open: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLElement | null>;
  contentTopOffset: string;
  isMobileView: boolean;
  /** When true, panel is in document flow (stacked above/below map on mobile) instead of fixed overlay */
  stacked?: boolean;
  emptyResults: boolean;
  loading: boolean;
  driveways: SearchDriveway[];
  pagination: DrivewayPagination;
  selectedDrivewayId: string | null;
  hoveredDrivewayId: string | null;
  onDrivewaySelect: (id: string) => void;
  onDrivewayHover: (id: string | null) => void;
  onPageChange: (page: number) => void;
  onShowFilters: () => void;
  /** Current sort value; empty string = default */
  sort?: string;
  /** Called when user changes sort in list header */
  onSortChange?: (value: string) => void;
  formatPrice: (price: number) => string;
  renderStars: (rating: number) => React.ReactNode;
  calculateDistanceKm: (d: SearchDriveway) => number | null;
}

function ListingCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 gap-3 bg-white rounded-[12px] shadow-[0_1px_6px_rgba(0,0,0,0.08)] animate-pulse">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="85%" height={12} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={56} height={12} />
          <Skeleton variant="rectangular" width={72} height={12} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <Skeleton variant="rectangular" width={48} height={14} />
        <Skeleton variant="rectangular" width={72} height={32} className="rounded-lg" />
      </div>
    </div>
  );
}

export default function SearchResultsPanel({
  open,
  onClose,
  panelRef,
  contentTopOffset,
  isMobileView,
  stacked = false,
  emptyResults,
  loading,
  driveways,
  pagination,
  selectedDrivewayId,
  hoveredDrivewayId,
  onDrivewaySelect,
  onDrivewayHover,
  onPageChange,
  onShowFilters,
  sort = '',
  onSortChange,
  formatPrice,
  renderStars,
  calculateDistanceKm,
}: SearchResultsPanelProps) {
  const router = useRouter();

  const formatDistance = (d: SearchDriveway) => {
    const km = calculateDistanceKm(d);
    if (km === null) return null;
    if (km < 0.1) return '< 100 m';
    return `${km.toFixed(1)} km`;
  };

  const handleCardFocusOrMouseEnter = (id: string) => {
    router.prefetch(`/driveway/${id}`);
  };

  return (
    <>
      {!stacked && open && (
        <div
          className="fixed inset-0 bg-black/15 z-10 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={panelRef as React.RefObject<HTMLElement>}
        role="region"
        aria-label="Search results"
        aria-modal={!stacked && open && isMobileView ? true : undefined}
        className={
          stacked
            ? 'relative w-full bg-white border-b border-gray-200 overflow-hidden overflow-y-auto'
            : `
          fixed right-0 z-[25]
          w-full sm:w-96 max-w-[calc(100vw-2rem)]
          h-auto
          bg-white shadow-xl overflow-hidden overflow-y-auto
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `
        }
        style={stacked ? undefined : { top: contentTopOffset, maxHeight: `calc(100vh - ${contentTopOffset})` }}
      >
        <div className="relative p-3 sm:p-4 pt-3 lg:pt-4">
          {emptyResults ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No spots match your search</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                Try expanding your search area or adjusting filters to see more options.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={onShowFilters} size="sm">
                  Change filters
                </Button>
                <Button variant="outline" onClick={onShowFilters} size="sm">
                  Expand search area
                </Button>
              </div>
            </div>
          ) : loading && driveways.length === 0 ? (
            <div className="space-y-4">
              <Skeleton variant="text" width={140} height={20} className="mb-4" />
              {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3" aria-live="polite" aria-atomic="true">
                <p className="text-sm text-gray-600">
                  {loading ? 'Searching...' : `${pagination.total} driveways found`}
                </p>
                {onSortChange && (
                  <Select
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value)}
                    options={[...SORT_OPTIONS]}
                    className="min-w-[140px] text-sm"
                    aria-label="Sort results"
                  />
                )}
              </div>
              {loading && driveways.length > 0 && (
                <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                  <LoadingSpinner size="md" text="" />
                </div>
              )}
              <div className="space-y-2">
                {driveways.map((driveway) => {
                  const isSelected = selectedDrivewayId === driveway.id;
                  const isHighlighted = isSelected || hoveredDrivewayId === driveway.id;
                  const distanceStr = formatDistance(driveway);
                  const hasReviews = (driveway.reviewCount ?? 0) > 0;
                  return (
                    <article
                      key={driveway.id}
                      id={`driveway-${driveway.id}`}
                      onMouseEnter={() => { handleCardFocusOrMouseEnter(driveway.id); onDrivewayHover(driveway.id); }}
                      onMouseLeave={() => onDrivewayHover(null)}
                      onFocus={() => { handleCardFocusOrMouseEnter(driveway.id); onDrivewayHover(driveway.id); }}
                      onBlur={() => onDrivewayHover(null)}
                      className={`rounded-[12px] bg-white overflow-hidden transition-shadow duration-200 ${
                        isHighlighted ? 'ring-2 ring-primary-500 shadow-[0_4px_12px_rgba(0,0,0,0.12)]' : 'shadow-[0_1px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-[#111827] truncate">
                            {driveway.title}
                          </h3>
                          <p className="text-[12px] font-normal text-[#6B7280] truncate mt-0.5">
                            {driveway.address}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] flex-wrap mt-1">
                            {distanceStr !== null && (
                              <span className="flex items-center gap-0.5">
                                <MapPinIcon className="w-3.5 h-3.5" />
                                {distanceStr}
                              </span>
                            )}
                            {(driveway.capacity ?? 0) > 0 && (
                              <span>{driveway.capacity} capacity</span>
                            )}
                            {hasReviews ? (
                              <span className="flex items-center gap-0.5">
                                {renderStars(driveway.averageRating)}
                                <span>({driveway.reviewCount})</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-xs font-medium text-[#9CA3AF] bg-gray-100 rounded">New</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary-600">{formatPrice(driveway.pricePerHour)}</span>
                            <span className="text-xs text-[#9CA3AF] align-baseline">/hr</span>
                          </div>
                          <Link
                            href={`/driveway/${driveway.id}`}
                            onClick={() => onDrivewaySelect(driveway.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white font-semibold text-xs sm:text-sm py-1.5 px-4 hover:bg-primary-700 hover:shadow-md transition-colors w-full md:w-auto md:min-w-0"
                          >
                            Reserve
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {pagination.totalPages > 1 && (
                <nav className="mt-6" aria-label="Search results pagination">
                  <p className="text-center text-sm text-gray-600 mb-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => onPageChange(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                      size="sm"
                      aria-label="Go to previous page"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const page = pagination.page <= 3 ? i + 1 : pagination.page - 2 + i;
                      if (page > pagination.totalPages) return null;
                      return (
                        <Button
                          key={page}
                          variant={page === pagination.page ? 'primary' : 'outline'}
                          onClick={() => onPageChange(page)}
                          disabled={loading}
                          size="sm"
                          aria-label={`Go to page ${page}`}
                          aria-current={page === pagination.page ? 'page' : undefined}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages || loading}
                      size="sm"
                      aria-label="Go to next page"
                    >
                      Next
                    </Button>
                  </div>
                </nav>
              )}
              {stacked && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <a
                    href="#search-list-mobile"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('search-list-mobile')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Back to top ↑
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
