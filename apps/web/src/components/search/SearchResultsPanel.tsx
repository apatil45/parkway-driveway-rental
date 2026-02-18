'use client';

import { useRouter } from 'next/navigation';
import { Button, LoadingSpinner, Skeleton } from '@/components/ui';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { SearchDriveway, DrivewayPagination } from '@/types/driveway';

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
  onDrivewaySelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onShowFilters: () => void;
  formatPrice: (price: number) => string;
  renderStars: (rating: number) => React.ReactNode;
  calculateDistanceKm: (d: SearchDriveway) => number | null;
}

function ListingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse p-3 space-y-2">
      <div className="flex justify-between gap-2">
        <Skeleton variant="text" width="60%" height={14} />
        <Skeleton variant="rectangular" width={48} height={16} />
      </div>
      <Skeleton variant="text" width="90%" height={12} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={60} height={12} />
        <Skeleton variant="rectangular" width={40} height={12} />
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
  onDrivewaySelect,
  onPageChange,
  onShowFilters,
  formatPrice,
  renderStars,
  calculateDistanceKm,
}: SearchResultsPanelProps) {
  const router = useRouter();

  const handleCardClick = (id: string) => {
    onDrivewaySelect(id);
    router.push(`/driveway/${id}`);
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
          fixed right-0 z-[15]
          w-full sm:w-96 max-w-[calc(100vw-2rem)]
          h-auto
          bg-white shadow-xl overflow-hidden overflow-y-auto
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `
        }
        style={stacked ? undefined : { top: contentTopOffset, maxHeight: `calc(100vh - ${contentTopOffset})` }}
      >
        <div className="relative p-4 sm:p-6 pt-4 lg:pt-4">
          {emptyResults ? (
            <div className="text-center py-12">
              <div className="text-lg font-semibold text-gray-600 mb-4">DRIVEWAYS</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No driveways found</h3>
              <p className="text-sm text-gray-600 mb-4">Try adjusting your search filters</p>
              <Button onClick={onShowFilters} size="sm">
                Show Filters
              </Button>
            </div>
          ) : loading && driveways.length === 0 ? (
            <div className="space-y-4">
              <Skeleton variant="text" width={140} height={20} className="mb-4" />
              {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {loading ? 'Searching...' : `${pagination.total} driveways found`}
                </p>
              </div>
              {loading && driveways.length > 0 && (
                <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                  <LoadingSpinner size="md" text="" />
                </div>
              )}
              <div className="space-y-4">
                {driveways.map((driveway) => (
                  <div
                    key={driveway.id}
                    id={`driveway-${driveway.id}`}
                    role="button"
                    tabIndex={0}
                    className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                      selectedDrivewayId === driveway.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                    onClick={() => handleCardClick(driveway.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(driveway.id);
                      }
                    }}
                    onFocus={() => handleCardFocusOrMouseEnter(driveway.id)}
                    onMouseEnter={() => handleCardFocusOrMouseEnter(driveway.id)}
                    aria-label={`View ${driveway.title}, ${formatPrice(driveway.pricePerHour)} per hour`}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {driveway.title}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">{driveway.address}</p>
                          {driveway.owner?.name && (
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                              Host: {driveway.owner.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-primary-600">
                            {formatPrice(driveway.pricePerHour)}
                          </div>
                          <div className="text-[10px] text-gray-500">/hr</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600 flex-wrap">
                        <span className="flex items-center gap-0.5">
                          {renderStars(driveway.averageRating)}
                          <span>({driveway.reviewCount})</span>
                        </span>
                        {calculateDistanceKm(driveway) !== null && (
                          <span className="flex items-center gap-0.5">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            {calculateDistanceKm(driveway)} km
                          </span>
                        )}
                        <span>· {driveway.capacity} spots</span>
                      </div>
                      {driveway.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {driveway.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
                            >
                              {amenity.replace('_', ' ')}
                            </span>
                          ))}
                          {driveway.amenities.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                              +{driveway.amenities.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    size="sm"
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
                  >
                    Next
                  </Button>
                </div>
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
