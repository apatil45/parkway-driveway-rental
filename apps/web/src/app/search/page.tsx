'use client';

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LoadingSpinner, ErrorMessage, Button, Input, Select, SkeletonList, AddressAutocomplete } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import MapViewDirect from '@/components/ui/MapViewDirect';
import { useDriveways } from '@/hooks';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { SearchDriveway } from '@/types/driveway';
import SearchResultsPanel from '@/components/search/SearchResultsPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Layout constants: navbar (h-16 = 4rem) + search bar height so map/list start below them
const NAVBAR_HEIGHT_REM = 4;
const SEARCH_BAR_HEIGHT_REM = 4.25;
const CONTENT_TOP_OFFSET_REM = NAVBAR_HEIGHT_REM + SEARCH_BAR_HEIGHT_REM;
const CONTENT_TOP_OFFSET = `${CONTENT_TOP_OFFSET_REM}rem`;

interface SearchFilters {
  location: string;
  priceMin: string;
  priceMax: string;
  carSize: string;
  amenities: string[];
  latitude?: string;
  longitude?: string;
  radius?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc';
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
  const [searchQuery, setSearch] =useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDriveway, setSelectedDriveway] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const listPanelRef = useRef<HTMLElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const [canRenderMap, setCanRenderMap] = useState(true);
  const isMountedRef = useRef(true);
  const locationDetectedRef = useRef(false);
  const urlSyncedRef = useRef(false);

  // Start with list open so results are visible
  useEffect(() => {
    setSidebarOpen(true);
  }, []);

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

  // Auto-detect user location on mount
  useEffect(() => {
    if (navigator.geolocation && !filters.latitude && !filters.longitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFilters(prev => ({
            ...prev,
            latitude: String(latitude),
            longitude: String(longitude),
          }));
          if (!locationDetectedRef.current) {
            locationDetectedRef.current = true;
            showToast('Location detected! You can now search nearby driveways.', 'success');
          }
        },
        (error) => {
          // Silently fail - user can manually set location
          console.log('Location detection failed:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, []); // Only run once on mount


  // URL sync: on mount read query params, set filters, run search once with those params
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
    const sort = (searchParams.get('sort') as SearchFilters['sort']) || undefined;

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
    };
    setFilters(prev => ({ ...prev, ...urlFilters }));
    setSearch(location);
    urlSyncedRef.current = true;
    fetchDriveways({
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
    }).then((result) => {
      if (result.success && result.data && isMountedRef.current) {
        setPagination(result.data.pagination);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const buildSearchParams = useCallback((page: number, overrides?: Partial<SearchFilters>) => {
    const f = overrides ?? filters;
    return {
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
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    const url = qs ? `/search?${qs}` : '/search';
    router.replace(url, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearchSubmit = () => {
    const nextFilters = { ...filters, location: searchQuery };
    handleFilterChange('location', searchQuery);
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

  const closeListAndReturnFocus = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Escape closes list (mobile) - must run before any early return (hooks order)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
        closeListAndReturnFocus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, closeListAndReturnFocus]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

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
    const R = 6371;
    const lat1 = Number(filters.latitude) * Math.PI / 180;
    const lat2 = d.latitude * Math.PI / 180;
    const dlat = lat2 - lat1;
    const dlon = (d.longitude - Number(filters.longitude)) * Math.PI / 180;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }, [filters.latitude, filters.longitude]);

  // Normalize API result shape (must be before hooks)
  let drivewayList: SearchDriveway[] = [];
  if (Array.isArray(driveways)) {
    drivewayList = (driveways as unknown as SearchDriveway[]);
  } else if (driveways && typeof driveways === 'object' && Array.isArray((driveways as { driveways?: unknown }).driveways)) {
    drivewayList = (driveways as { driveways: SearchDriveway[] }).driveways;
  }

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
    return drivewayList.map(d => ({
      id: d.id,
      position: [d.latitude, d.longitude] as [number, number],
      title: d.title,
      price: d.pricePerHour,
      address: d.address,
      rating: d.averageRating,
      image: d.images && d.images.length > 0 ? d.images[0] : undefined,
    }));
  }, [drivewayList]);

  const emptyResults = Array.isArray(drivewayList) && drivewayList.length === 0 && !loading;

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

  return (
    <AppLayout showFooter={false}>
      {/* Map: full viewport (100%), starts below search bar with padding */}
      <ErrorBoundary fallback={
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-gray-100" style={{ paddingTop: CONTENT_TOP_OFFSET }}>
          <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
            <p className="text-gray-700 mb-4">Map failed to load. You can still browse the list.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
          </div>
        </div>
      }>
      <div className="fixed inset-0 z-0" style={{ paddingTop: CONTENT_TOP_OFFSET }}>
        <div className="absolute inset-0 bg-gray-100 overflow-hidden">
          {!emptyResults && canRenderMap ? (
            <MapViewDirect
              key="search-map"
              viewMode="split"
              center={mapCenter}
              markers={mapMarkers}
              height="100%"
              onMarkerClick={(id: string) => {
                setSelectedDriveway(id);
                const element = document.getElementById(`driveway-${id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('ring-2', 'ring-primary-500');
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-primary-500');
                  }, 2000);
                }
              }}
            />
          ) : null}
          {emptyResults && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600 mb-2">MAP</div>
                <p className="text-sm">No driveways to display on map</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </ErrorBoundary>

      {/* Filters bar: overlay on top of map. Stack on very small screens to prevent overlap. */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-3 py-3 sm:px-4">
          {/* Stack vertically on xs so search and List/Filters never overlap */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            {/* Row 1 on small screens: search input + Search button (stacked on very narrow to avoid overlap) */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full min-w-0 sm:flex-1 sm:max-w-md">
              <div className="flex-1 min-w-0 w-full">
                <AddressAutocomplete
                  value={searchQuery}
                  onChange={(address) => setSearch(address)}
                  onLocationSelect={(lat, lon) => {
                    handleFilterChange('latitude', String(lat));
                    handleFilterChange('longitude', String(lon));
                    performSearch(1);
                  }}
                  placeholder="Search driveways..."
                />
              </div>
              <Button onClick={handleSearchSubmit} size="sm" className="w-full sm:w-auto shrink-0">
                Search
              </Button>
            </div>
            {/* Row 2 on small screens: List + Filters (own row so no overlap, full labels visible) */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                type="button"
                variant={sidebarOpen ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSidebarOpen((s) => !s)}
                aria-label={sidebarOpen ? 'Hide list' : 'Show list'}
                aria-expanded={sidebarOpen}
                className="whitespace-nowrap flex-1 sm:flex-initial"
              >
                List
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                className="whitespace-nowrap flex-1 sm:flex-initial"
              >
                {showFilters ? 'Hide Filters' : 'Filters'}
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Filters Panel (Collapsible) - overlay, same container as navbar */}
      {showFilters && (
        <div className="sticky z-20 bg-white border-b border-gray-200 shadow-sm" style={{ top: CONTENT_TOP_OFFSET }}>
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <AddressAutocomplete
                  label="Location"
                  value={filters.location}
                  onChange={(address) => {
                    handleFilterChange('location', address);
                  }}
                  onLocationSelect={(lat, lon) => {
                    handleFilterChange('latitude', String(lat));
                    handleFilterChange('longitude', String(lon));
                  }}
                  userLocationProp={filters.latitude && filters.longitude ? { lat: Number(filters.latitude), lon: Number(filters.longitude) } : undefined}
                  placeholder="City or address"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    placeholder="Min"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    placeholder="Max"
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Car Size</label>
                <Select
                  value={filters.carSize}
                  onChange={(e) => handleFilterChange('carSize', e.target.value)}
                  className="text-sm"
                  options={[
                    { value: '', label: 'Any Size' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                    { value: 'extra-large', label: 'Extra Large' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <Select
                  value={filters.sort || ''}
                  onChange={(e) => handleFilterChange('sort', e.target.value as any)}
                  className="text-sm"
                  options={[
                    { value: '', label: 'Default' },
                    { value: 'price_asc', label: 'Price: Low to High' },
                    { value: 'price_desc', label: 'Price: High to Low' },
                    { value: 'rating_desc', label: 'Rating: High to Low' },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Radius (km)</label>
                <Input
                  type="number"
                  min="1"
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', e.target.value)}
                  placeholder="5"
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      showToast('Geolocation is not supported by your browser', 'error');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        handleFilterChange('latitude', String(pos.coords.latitude));
                        handleFilterChange('longitude', String(pos.coords.longitude));
                        showToast('Location updated successfully', 'success');
                      },
                      (err) => showToast('Unable to get your location. Please check your browser permissions.', 'error')
                    );
                  }}
                  className="w-full"
                >
                  <MapPinIcon className="w-4 h-4 mr-1" /> Use My Location
                </Button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {['covered', 'security', 'ev_charging', 'easy_access'].map((amenity) => (
                  <label key={amenity} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('amenities', [...filters.amenities, amenity]);
                        } else {
                          handleFilterChange('amenities', filters.amenities.filter(a => a !== amenity));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-1"
                    />
                    <span className="capitalize">{amenity.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSearch} loading={loading} size="sm">
                Search
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List overlay - overlapping the map */}
      <ErrorBoundary fallback={
        <div className="fixed right-4 max-w-sm p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-40" style={{ top: CONTENT_TOP_OFFSET }}>
          <p className="text-sm text-gray-700 mb-2">Results list failed to load.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      }>
        <SearchResultsPanel
          open={sidebarOpen}
          onClose={closeListAndReturnFocus}
          panelRef={listPanelRef}
          contentTopOffset={CONTENT_TOP_OFFSET}
          isMobileView={isMobileView}
          emptyResults={emptyResults}
          loading={loading}
          driveways={drivewayList}
          pagination={pagination}
          selectedDrivewayId={selectedDriveway}
          onDrivewaySelect={(id) => {
            setSelectedDriveway(id);
            setCanRenderMap(false);
          }}
          onPageChange={handlePageChange}
          onShowFilters={() => setShowFilters(true)}
          formatPrice={formatPrice}
          renderStars={renderStars}
          calculateDistanceKm={calculateDistanceKm}
        />
      </ErrorBoundary>
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
