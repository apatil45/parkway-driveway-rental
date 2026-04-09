'use client';

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LoadingSpinner, ErrorMessage, Button, SkeletonList } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import MapViewDirect from '@/components/ui/MapViewDirect';
import { useDriveways } from '@/hooks';
import { FunnelIcon, ArrowLeftIcon, MagnifyingGlassIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { SearchDriveway } from '@/types/driveway';
import { formatPrice as formatPriceUtil, distanceKm } from '@/lib/format';
import SearchResultsHorizontalStrip from '@/components/search/SearchResultsHorizontalStrip';
import SearchResultsPanel from '@/components/search/SearchResultsPanel';
import QuickSearchBar from '@/components/search/QuickSearchBar';
import SearchFiltersPanel from '@/components/search/SearchFiltersPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getDefaultStartEnd, clampStartTimeToNow } from '@/lib/date-utils';

interface SearchFilters {
  location: string;
  priceMin: string;
  priceMax: string;
  carSize: string;
  amenities: string[];
  latitude?: string;
  longitude?: string;
  radius?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc';
  start?: string;  // datetime-local string for UI
  end?: string;    // datetime-local string for UI
}

function SearchPageContent() {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    priceMin: '',
    priceMax: '',
    carSize: '',
    amenities: [],
    latitude: '',
    longitude: '',
    radius: '',
    sort: undefined
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [listViewExpanded, setListViewExpanded] = useState(false);
  const [searchFormOpen, setSearchFormOpen] = useState(false);
  const [searchQuery, setSearch] = useState('');
  const [selectedDriveway, setSelectedDriveway] = useState<string | null>(null);
  const [hoveredDrivewayId, setHoveredDrivewayId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isMobileView, setIsMobileView] = useState(false);
  const listPanelRef = useRef<HTMLElement>(null);

  const [canRenderMap, setCanRenderMap] = useState(true);
  const isMountedRef = useRef(true);
  const urlSyncedRef = useRef(false);
  const defaultsSetRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Simple: show map when on search page, hide when not
  useEffect(() => {
    setCanRenderMap(pathname === '/search');
  }, [pathname]);
  
  // Track mount state for async operations
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const { data: driveways, loading, error, fetchDriveways } = useDriveways();
  const { showToast } = useToast();

  // URL sync + defaults: on mount read query params, set default start/end and current location, run search
  useEffect(() => {
    const location = searchParams.get('location') ?? '';
    const priceMin = searchParams.get('priceMin') ?? '';
    const priceMax = searchParams.get('priceMax') ?? '';
    const carSize = searchParams.get('carSize') ?? '';
    const amenitiesParam = searchParams.get('amenities');
    const amenities = amenitiesParam ? amenitiesParam.split(',').filter(Boolean) : [];
    const latitude = searchParams.get('latitude') ?? '';
    const longitude = searchParams.get('longitude') ?? '';
    const radius = searchParams.get('radius') ?? '';
    const sortParam = searchParams.get('sort');
    const sort = (sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'rating_desc' || sortParam === 'distance_asc' ? sortParam : undefined) as SearchFilters['sort'] | undefined;
    const startParam = searchParams.get('start') ?? '';
    const endParam = searchParams.get('end') ?? '';

    const { start: defaultStart, end: defaultEnd } = getDefaultStartEnd();
    const start = clampStartTimeToNow(startParam || defaultStart) || defaultStart;
    const end = endParam || defaultEnd;

    const urlFilters: Partial<SearchFilters> = {
      location,
      priceMin,
      priceMax,
      carSize,
      amenities,
      latitude,
      longitude,
      radius,
      sort,
      start,
      end,
    };
    setFilters(prev => ({ ...prev, ...urlFilters }));
    setSearch(location || (latitude && longitude ? 'Current location' : ''));
    urlSyncedRef.current = true;

    const params: Record<string, string> = {
      page: '1',
      limit: '10',
      ...(location && { location }),
      ...(priceMin && { priceMin }),
      ...(priceMax && { priceMax }),
      ...(carSize && { carSize }),
      ...(amenities.length && { amenities: amenities.join(',') }),
      ...(latitude && { latitude }),
      ...(longitude && { longitude }),
      ...(radius && { radius }),
      ...(sort && { sort }),
    };
    if (start) params.start = new Date(start).toISOString();
    if (end) params.end = new Date(end).toISOString();

    fetchDriveways(params).then((result) => {
      if (result.success && result.data && isMountedRef.current) {
        setPagination(result.data.pagination);
      }
    });

    if (!latitude || !longitude) {
      if (navigator.geolocation && !defaultsSetRef.current) {
        defaultsSetRef.current = true;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMountedRef.current) return;
            const lat = String(position.coords.latitude);
            const lon = String(position.coords.longitude);
            setFilters(prev => ({ ...prev, latitude: lat, longitude: lon }));
            setSearch(prev => (prev || 'Current location'));
            fetchDriveways({
              page: '1',
              limit: '10',
              latitude: lat,
              longitude: lon,
              ...(start && { start: new Date(start).toISOString() }),
              ...(end && { end: new Date(end).toISOString() }),
              ...(radius && { radius }),
              ...(sort && { sort }),
            }).then((result) => {
              if (result.success && result.data && isMountedRef.current) {
                setPagination(result.data.pagination);
              }
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const buildSearchParams = useCallback((page: number, overrides?: Partial<SearchFilters>) => {
    const f = overrides ?? filters;
    const params: Record<string, string> = {
      page: page.toString(),
      limit: '10',
      ...(f.location && { location: f.location }),
      ...(f.priceMin && { priceMin: f.priceMin }),
      ...(f.priceMax && { priceMax: f.priceMax }),
      ...(f.carSize && { carSize: f.carSize }),
      ...(f.amenities?.length ? { amenities: f.amenities.join(',') } : {}),
      ...(f.latitude && { latitude: f.latitude }),
      ...(f.longitude && { longitude: f.longitude }),
      ...(f.radius && { radius: f.radius }),
      ...(f.sort && { sort: f.sort }),
    };
    if (f.start) params.start = new Date(f.start).toISOString();
    if (f.end) params.end = new Date(f.end).toISOString();
    return params;
  }, [filters]);

  const performSearch = async (page = 1, filterOverrides?: Partial<SearchFilters>) => {
    if (!isMountedRef.current) return;
    const params = buildSearchParams(page, filterOverrides);
    const result = await fetchDriveways(params);
    if (result.success && result.data && isMountedRef.current) {
      setPagination(result.data.pagination);
    }
  };

  const updateSearchUrl = useCallback((page = 1, overrides?: Partial<SearchFilters>) => {
    const f = overrides ?? filters;
    const params = new URLSearchParams();
    if (f.location) params.set('location', f.location);
    if (f.priceMin) params.set('priceMin', f.priceMin);
    if (f.priceMax) params.set('priceMax', f.priceMax);
    if (f.carSize) params.set('carSize', f.carSize);
    if (f.amenities?.length) params.set('amenities', f.amenities.join(','));
    if (f.latitude) params.set('latitude', f.latitude);
    if (f.longitude) params.set('longitude', f.longitude);
    if (f.radius) params.set('radius', f.radius);
    if (f.sort) params.set('sort', f.sort);
    if (f.start) params.set('start', f.start);
    if (f.end) params.set('end', f.end);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    const url = qs ? `/search?${qs}` : '/search';
    router.replace(url, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    const effective = key === 'start' && typeof value === 'string' ? clampStartTimeToNow(value) : value;
    setFilters(prev => ({
      ...prev,
      [key]: effective
    }));
  };

  const handleQuickSearch = () => {
    const nextFilters = { ...filters, location: searchQuery };
    performSearch(1, nextFilters);
    updateSearchUrl(1, nextFilters);
  };

  const handleSearch = () => {
    performSearch(1);
    updateSearchUrl(1);
  };

  const handlePageChange = (page: number) => {
    performSearch(page);
    updateSearchUrl(page);
  };

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nextFilters = {
          ...filters,
          latitude: String(latitude),
          longitude: String(longitude),
        };
        setFilters(nextFilters);
        performSearch(1, nextFilters);
        updateSearchUrl(1, nextFilters);
        showToast('Location set. Searching nearby driveways.', 'success');
      },
      () => showToast('Unable to get your location. Check permissions or try an address.', 'error'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [filters, performSearch, updateSearchUrl, showToast]);

  const formatPrice = formatPriceUtil;

  const renderStars = (rating: number) => {
    const r = Math.max(0, Math.min(5, rating));
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(r);
      const half = !filled && i < r && r - i < 1;
      return (
        <span
          key={i}
          className={`text-sm inline-block ${
            filled ? 'text-yellow-400' : half ? 'text-yellow-400 opacity-80' : 'text-gray-300'
          }`}
          aria-hidden
        >
          {half ? '★' : '★'}
        </span>
      );
    });
  };

  const calculateDistanceKm = useCallback((d: SearchDriveway) => {
    if (!filters.latitude || !filters.longitude) return null;
    return distanceKm(Number(filters.latitude), Number(filters.longitude), d.latitude, d.longitude);
  }, [filters.latitude, filters.longitude]);

  // Normalize API result shape (must be before hooks)
  let drivewayList: SearchDriveway[] = [];
  if (Array.isArray(driveways)) {
    drivewayList = (driveways as unknown as SearchDriveway[]);
  } else if (driveways && typeof driveways === 'object' && Array.isArray((driveways as { driveways?: unknown }).driveways)) {
    drivewayList = (driveways as { driveways: SearchDriveway[] }).driveways;
  }

  // Client-side sort for "Nearest first" when we have location
  const sortedDrivewayList = useMemo(() => {
    if (filters.sort !== 'distance_asc' || !filters.latitude || !filters.longitude) return drivewayList;
    const R = 6371;
    const lat1 = Number(filters.latitude) * Math.PI / 180;
    return [...drivewayList].sort((a, b) => {
      const dlatA = (a.latitude - Number(filters.latitude)) * Math.PI / 180;
      const dlonA = (a.longitude - Number(filters.longitude)) * Math.PI / 180;
      const aVal = Math.sin(dlatA/2)**2 + Math.cos(lat1) * Math.cos(a.latitude * Math.PI / 180) * Math.sin(dlonA/2)**2;
      const cA = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
      const dlatB = (b.latitude - Number(filters.latitude)) * Math.PI / 180;
      const dlonB = (b.longitude - Number(filters.longitude)) * Math.PI / 180;
      const bVal = Math.sin(dlatB/2)**2 + Math.cos(lat1) * Math.cos(b.latitude * Math.PI / 180) * Math.sin(dlonB/2)**2;
      const cB = 2 * Math.atan2(Math.sqrt(bVal), Math.sqrt(1 - bVal));
      return R * cA - R * cB;
    });
  }, [drivewayList, filters.sort, filters.latitude, filters.longitude]);

  // Calculate map center (memoized) - MUST be before early returns
  const mapCenter: [number, number] = useMemo(() => {
    return filters.latitude && filters.longitude
      ? [Number(filters.latitude), Number(filters.longitude)]
      : drivewayList.length > 0
      ? [drivewayList[0].latitude, drivewayList[0].longitude]
      : [37.7749, -122.4194]; // Default: San Francisco
  }, [filters.latitude, filters.longitude, drivewayList]);

  // Map markers (memoized) - MUST be before early returns
  const mapMarkers = useMemo(() => {
    return sortedDrivewayList.map(d => ({
      id: d.id,
      position: [d.latitude, d.longitude] as [number, number],
      title: d.title,
      price: d.pricePerHour,
      address: d.address,
      rating: d.averageRating,
      image: d.images && d.images.length > 0 ? d.images[0] : undefined,
    }));
  }, [sortedDrivewayList]);

  const emptyResults = Array.isArray(drivewayList) && drivewayList.length === 0 && !loading;

  /** Toggle filters from the top bar; collapsing the quick form when opening avoids the sheet covering the tall form. */
  const handleFiltersButtonClick = useCallback(() => {
    setShowFilters((open) => {
      const next = !open;
      if (next) setSearchFormOpen(false);
      return next;
    });
  }, []);

  // Early returns AFTER all hooks
  if (loading && (!driveways || driveways.length === 0)) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <SkeletonList count={5} />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage
          title="Search Error"
          message={error.includes('Failed') || error.includes('Error') ? 'Unable to search for parking spaces. Please try again.' : error}
          onRetry={() => performSearch()}
        />
      </div>
    );
  }

  const filterCount = [filters.priceMin, filters.priceMax, filters.carSize, filters.amenities?.length ? 1 : 0, filters.radius].filter(Boolean).length;
  return (
    <AppLayout showFooter={false} showBreadcrumbs={listViewExpanded || !isMobileView}>
      {listViewExpanded ? (
        /* List view: navbar + breadcrumbs visible, full list with Back to map */
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setListViewExpanded(false)}
              className="gap-1"
              aria-label="Back to map"
            >
              <ArrowLeftIcon className="w-4 h-4" aria-hidden />
              Back to map
            </Button>
          </div>
          {showFilters && (
            <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-2 shadow-sm">
              <div className="mx-auto max-w-7xl">
                <SearchFiltersPanel
                  layout="list"
                  filters={filters}
                  showMoreFilters={showMoreFilters}
                  onShowMoreChange={setShowMoreFilters}
                  onFilterChange={handleFilterChange}
                  onApply={() => {
                    handleSearch();
                    setShowFilters(false);
                  }}
                  onClose={() => setShowFilters(false)}
                  onUseMyLocation={handleUseMyLocation}
                  loading={loading}
                />
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SearchResultsPanel
              open={true}
              onClose={() => {}}
              panelRef={listPanelRef}
              contentTopOffset="0"
              isMobileView={isMobileView}
              stacked={true}
              emptyResults={emptyResults}
              loading={loading}
              driveways={sortedDrivewayList}
              pagination={pagination}
              selectedDrivewayId={selectedDriveway}
              hoveredDrivewayId={hoveredDrivewayId}
              onDrivewaySelect={(id) => setSelectedDriveway(id)}
              onDrivewayHover={setHoveredDrivewayId}
              onPageChange={handlePageChange}
              onShowFilters={() => setShowFilters(true)}
              sort={filters.sort ?? ''}
              onSortChange={(value) => {
                const nextSort = (value === '' ? undefined : value) as SearchFilters['sort'];
                handleFilterChange('sort', value);
                performSearch(1, { ...filters, sort: nextSort });
                updateSearchUrl(1, { ...filters, sort: nextSort });
              }}
              radiusKm={filters.radius}
              hasLocation={Boolean(filters.latitude && filters.longitude)}
              searchLocationName={(searchQuery || filters.location)?.split(',')[0]?.trim() || undefined}
              formatPrice={formatPrice}
              renderStars={renderStars}
              calculateDistanceKm={calculateDistanceKm}
            />
          </div>
        </div>
      ) : (
        /* Map + list: desktop = map left + vertical list right; mobile = full-screen map + horizontal strip at bottom */
        <div className={`flex w-full h-screen min-h-screen overflow-hidden ${isMobileView ? 'flex-col' : 'flex-row'}`}>
          {/* Map area: full width on mobile, flex-1 on desktop */}
          <div className={`relative z-0 ${isMobileView ? 'flex-1 min-h-0' : 'flex-1 min-w-0 min-h-0'}`}>
          {/* Full-screen map background */}
          <div className="absolute inset-0 z-0">
            <ErrorBoundary fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
                <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
                  <p className="text-gray-700 mb-4">Map failed to load. You can still browse the list.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
                </div>
              </div>
            }>
              {!emptyResults && canRenderMap ? (
                <MapViewDirect
                  key="search-map"
                  center={mapCenter}
                  markers={mapMarkers}
                  height="100%"
                  highlightedMarkerId={hoveredDrivewayId || selectedDriveway}
                  onMarkerClick={(id: string) => {
                    setSelectedDriveway(id);
                    const el = document.getElementById(`driveway-card-${id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  onMarkerHover={setHoveredDrivewayId}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-100">
                  <p className="text-sm">No driveways to display on map</p>
                </div>
              )}
            </ErrorBoundary>
          </div>

          {/* Search + filters: stacked under chrome; map stays clickable outside (pointer-events). */}
          {showFilters && (
            <button
              type="button"
              className="absolute inset-0 z-[5] bg-black/20 lg:hidden"
              aria-label="Close filters"
              onClick={() => setShowFilters(false)}
            />
          )}
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex flex-col items-stretch gap-1.5 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top,0))]">
            <div className="pointer-events-auto mx-auto w-full max-w-lg">
            {searchFormOpen ? (
              <QuickSearchBar
                locationValue={searchQuery}
                onLocationChange={setSearch}
                onLocationSelect={(lat, lon) => {
                  handleFilterChange('latitude', String(lat));
                  handleFilterChange('longitude', String(lon));
                  performSearch(1);
                  updateSearchUrl(1);
                }}
                startValue={filters.start ?? getDefaultStartEnd().start}
                onStartChange={(v) => handleFilterChange('start', v)}
                endValue={filters.end ?? getDefaultStartEnd().end}
                onEndChange={(v) => handleFilterChange('end', v)}
                onSearch={() => { handleQuickSearch(); setSearchFormOpen(false); }}
                onUseMyLocation={handleUseMyLocation}
                onFiltersClick={handleFiltersButtonClick}
                filterCount={filterCount}
                filtersOpen={showFilters}
                loading={loading}
                onClose={() => setSearchFormOpen(false)}
              />
            ) : (
              <div className="flex h-12 w-full items-stretch gap-2">
                {isMobileView && (
                  <Link
                    href="/"
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white shadow-lg text-gray-600 hover:bg-gray-50"
                    aria-label="Back to home"
                  >
                    <ArrowLeftIcon className="w-5 h-5" aria-hidden />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSearchFormOpen(true)}
                  className="flex-1 min-w-0 h-12 flex items-center gap-2.5 px-3.5 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 text-left"
                  aria-label="Where are you going? Start and end time"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-600">
                    <MagnifyingGlassIcon className="w-4 h-4" aria-hidden />
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm text-gray-600">
                    {searchQuery || filters.latitude ? (searchQuery || 'Current location') : 'Where are you going?'}
                    {filters.start && filters.end && (
                      <span className="text-gray-400">
                        {' · '}
                        {new Date(filters.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(filters.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                    {!searchQuery && !filters.latitude && !filters.start && ' · Start & end time'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleFiltersButtonClick}
                  aria-expanded={showFilters}
                  className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white shadow-lg text-gray-600 hover:bg-gray-50 relative ${showFilters ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                  aria-label="Filters"
                >
                  <FunnelIcon className="w-4 h-4" aria-hidden />
                  {filterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-xs font-medium">
                      {filterCount}
                    </span>
                  )}
                </button>
                {isMobileView && (
                  <button
                    type="button"
                    onClick={() => setListViewExpanded(true)}
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white shadow-lg text-gray-600 hover:bg-gray-50"
                    aria-label="Full list"
                  >
                    <ListBulletIcon className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </div>
            )}
            </div>
            {showFilters && (
              <div className="pointer-events-auto mx-auto flex w-full max-w-lg justify-end">
                <SearchFiltersPanel
                  layout="popover"
                  filters={filters}
                  showMoreFilters={showMoreFilters}
                  onShowMoreChange={setShowMoreFilters}
                  onFilterChange={handleFilterChange}
                  onApply={() => {
                    handleSearch();
                    setShowFilters(false);
                  }}
                  onClose={() => setShowFilters(false)}
                  onUseMyLocation={handleUseMyLocation}
                  loading={loading}
                />
              </div>
            )}
          </div>
          </div>

          {/* Mobile: horizontal strip at bottom. Desktop: vertical list in right sidebar (rendered below). */}
          {isMobileView && (
          <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom,0)] flex flex-col items-stretch">
            <SearchResultsHorizontalStrip
              emptyResults={emptyResults}
              loading={loading}
              driveways={sortedDrivewayList}
              pagination={pagination}
              selectedDrivewayId={selectedDriveway}
              hoveredDrivewayId={hoveredDrivewayId}
              onDrivewayHover={setHoveredDrivewayId}
              onPageChange={handlePageChange}
              sort={filters.sort ?? ''}
              onSortChange={(value) => {
                const nextSort = (value === '' ? undefined : value) as SearchFilters['sort'];
                handleFilterChange('sort', value);
                performSearch(1, { ...filters, sort: nextSort });
                updateSearchUrl(1, { ...filters, sort: nextSort });
              }}
              radiusKm={filters.radius}
              hasLocation={Boolean(filters.latitude && filters.longitude)}
              searchLocationName={(searchQuery || filters.location)?.split(',')[0]?.trim() || undefined}
              formatPrice={formatPrice}
              renderStars={renderStars}
              calculateDistanceKm={calculateDistanceKm}
              isMobileView={isMobileView}
              onExpandList={() => setListViewExpanded(true)}
              onVisibleDrivewayChange={(id) => setSelectedDriveway(id)}
            />
          </div>
          )}
          {/* Desktop: right-side vertical list */}
          {!isMobileView && (
          <div className="w-[380px] min-w-[380px] flex-shrink-0 flex flex-col h-full min-h-0 bg-white border-l border-gray-200 overflow-hidden z-10 shadow-[ -4px_0_12px_rgba(0,0,0,0.06)]">
            <SearchResultsHorizontalStrip
              emptyResults={emptyResults}
              loading={loading}
              driveways={sortedDrivewayList}
              pagination={pagination}
              selectedDrivewayId={selectedDriveway}
              hoveredDrivewayId={hoveredDrivewayId}
              onDrivewayHover={setHoveredDrivewayId}
              onPageChange={handlePageChange}
              sort={filters.sort ?? ''}
              onSortChange={(value) => {
                const nextSort = (value === '' ? undefined : value) as SearchFilters['sort'];
                handleFilterChange('sort', value);
                performSearch(1, { ...filters, sort: nextSort });
                updateSearchUrl(1, { ...filters, sort: nextSort });
              }}
              radiusKm={filters.radius}
              hasLocation={Boolean(filters.latitude && filters.longitude)}
              searchLocationName={(searchQuery || filters.location)?.split(',')[0]?.trim() || undefined}
              formatPrice={formatPrice}
              renderStars={renderStars}
              calculateDistanceKm={calculateDistanceKm}
              isMobileView={false}
              onExpandList={() => setListViewExpanded(true)}
              onVisibleDrivewayChange={undefined}
            />
          </div>
          )}
        </div>
      )}

    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" text="Loading search..." />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
