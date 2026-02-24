'use client';

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LoadingSpinner, ErrorMessage, Button, Input, Select, SkeletonList, AddressAutocomplete } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import MapViewDirect from '@/components/ui/MapViewDirect';
import { useDriveways } from '@/hooks';
import { MapPinIcon, MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import type { SearchDriveway } from '@/types/driveway';
import SearchResultsPanel from '@/components/search/SearchResultsPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Layout constants: navbar + breadcrumbs + search bar so map/list start below the search bar stripe
const NAVBAR_HEIGHT_REM = 4;
const BREADCRUMBS_HEIGHT_REM = 3;   // py-3 + one line (~2.25rem), so list starts below search bar
const SEARCH_BAR_HEIGHT_REM = 4.25;
const CONTENT_TOP_OFFSET_REM = NAVBAR_HEIGHT_REM + BREADCRUMBS_HEIGHT_REM + SEARCH_BAR_HEIGHT_REM;
const CONTENT_TOP_OFFSET = `${CONTENT_TOP_OFFSET_REM}rem`;

const LIST_WIDTH_STORAGE_KEY = 'parkway-search-list-width';
const LIST_WIDTH_MIN = 20;
const LIST_WIDTH_MAX = 50;
const LIST_WIDTH_DEFAULT = 30;

const MOBILE_MAP_HEIGHT_STORAGE_KEY = 'parkway-search-mobile-map-height';
const MOBILE_MAP_HEIGHT_MIN = 25;
const MOBILE_MAP_HEIGHT_MAX = 65;
const MOBILE_MAP_HEIGHT_DEFAULT = 40;

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
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const [searchQuery, setSearch] =useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDriveway, setSelectedDriveway] = useState<string | null>(null);
  const [hoveredDrivewayId, setHoveredDrivewayId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const listPanelRef = useRef<HTMLElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const mobileSplitContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Desktop: resizable list width (percentage), persisted
  const [listWidthPercent, setListWidthPercent] = useState(LIST_WIDTH_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);

  // Mobile: resizable map height (percentage of panel), persisted
  const [mobileMapHeightPercent, setMobileMapHeightPercent] = useState(MOBILE_MAP_HEIGHT_DEFAULT);
  const [isResizingMobile, setIsResizingMobile] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIST_WIDTH_STORAGE_KEY);
      if (stored != null) {
        const n = Number(stored);
        if (Number.isFinite(n) && n >= LIST_WIDTH_MIN && n <= LIST_WIDTH_MAX) {
          setListWidthPercent(n);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MOBILE_MAP_HEIGHT_STORAGE_KEY);
      if (stored != null) {
        const n = Number(stored);
        if (Number.isFinite(n) && n >= MOBILE_MAP_HEIGHT_MIN && n <= MOBILE_MAP_HEIGHT_MAX) {
          setMobileMapHeightPercent(n);
        }
      }
    } catch (_) {}
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const listWidthRef = useRef(listWidthPercent);
  listWidthRef.current = listWidthPercent;

  const mobileMapHeightRef = useRef(mobileMapHeightPercent);
  mobileMapHeightRef.current = mobileMapHeightPercent;

  const getClientY = (e: MouseEvent | TouchEvent) =>
    'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;

  const handleMobileResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizingMobile(true);
  }, []);

  useEffect(() => {
    if (!isResizingMobile) return;
    const container = mobileSplitContainerRef.current;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) e.preventDefault();
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clientY = getClientY(e);
      const percent = ((clientY - rect.top) / rect.height) * 100;
      const clamped = Math.max(MOBILE_MAP_HEIGHT_MIN, Math.min(MOBILE_MAP_HEIGHT_MAX, percent));
      setMobileMapHeightPercent(clamped);
    };
    const onEnd = () => {
      setIsResizingMobile(false);
      try {
        const v = Math.round(mobileMapHeightRef.current);
        if (Number.isFinite(v)) localStorage.setItem(MOBILE_MAP_HEIGHT_STORAGE_KEY, String(v));
      } catch (_) {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [isResizingMobile]);

  useEffect(() => {
    if (isResizingMobile && typeof document !== 'undefined') {
      document.body.style.cursor = 'row-resize';
      document.body.style.touchAction = 'none';
      document.body.style.userSelect = 'none';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = '';
        document.body.style.touchAction = '';
        document.body.style.userSelect = '';
      }
    };
  }, [isResizingMobile]);

  useEffect(() => {
    if (isResizing && typeof document !== 'undefined') {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isResizing) return;
    const container = splitContainerRef.current;
    const onMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const listPercent = ((rect.right - e.clientX) / rect.width) * 100;
      const clamped = Math.max(LIST_WIDTH_MIN, Math.min(LIST_WIDTH_MAX, listPercent));
      setListWidthPercent(clamped);
    };
    const onEnd = () => {
      setIsResizing(false);
      try {
        const v = Math.round(listWidthRef.current);
        if (Number.isFinite(v)) localStorage.setItem(LIST_WIDTH_STORAGE_KEY, String(v));
      } catch (_) {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('mouseleave', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('mouseleave', onEnd);
    };
  }, [isResizing]);

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
    const sortParam = searchParams.get('sort');
    const sort = (sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'rating_desc' || sortParam === 'distance_asc' ? sortParam : undefined) as SearchFilters['sort'] | undefined;

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
    setMobileSearchExpanded(false); // collapse search bar on mobile after submit
  };

  const handleSearch = () => {
    performSearch(1);
    updateSearchUrl(1);
  };

  const removeFilter = useCallback((key: keyof SearchFilters, value?: string) => {
    if (key === 'amenities' && value) {
      const next = filters.amenities.filter((a) => a !== value);
      handleFilterChange('amenities', next);
      performSearch(1, { ...filters, amenities: next });
      updateSearchUrl(1, { ...filters, amenities: next });
    } else {
      const next = { ...filters, [key]: key === 'amenities' ? [] : '' };
      if (key === 'sort') next.sort = undefined;
      setFilters(next);
      performSearch(1, next);
      updateSearchUrl(1, next);
    }
  }, [filters]);

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
      {/* Search header: full-width white bar above map/list (not floating) */}
      <div
        className={`sticky top-16 z-20 bg-white border-b border-gray-200 shadow-sm ${!mobileSearchExpanded ? 'hidden lg:block' : 'block'}`}
      >
        <div className="container mx-auto px-3 py-3 sm:px-4">
          <div className="lg:hidden flex items-center gap-2 w-full max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <AddressAutocomplete
                value={searchQuery}
                onChange={(address) => setSearch(address)}
                onLocationSelect={(lat, lon) => {
                  handleFilterChange('latitude', String(lat));
                  handleFilterChange('longitude', String(lon));
                  performSearch(1);
                }}
                onSubmit={handleSearchSubmit}
                minimal
                placeholder="Where do you need parking?"
                className="text-base"
              />
            </div>
            <button type="button" onClick={() => setMobileSearchExpanded(false)} aria-label="Close search" className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
              <XMarkIcon className="w-5 h-5" aria-hidden />
            </button>
          </div>
          <div className="hidden lg:flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full min-w-0 sm:flex-1 sm:max-w-lg">
              <div className="flex-1 min-w-0 w-full">
                <AddressAutocomplete
                  value={searchQuery}
                  onChange={(address) => setSearch(address)}
                  onLocationSelect={(lat, lon) => {
                    handleFilterChange('latitude', String(lat));
                    handleFilterChange('longitude', String(lon));
                    performSearch(1);
                  }}
                  placeholder="Where do you need parking?"
                />
              </div>
              <Button onClick={handleSearchSubmit} size="sm" className="w-full sm:w-auto shrink-0">Search</Button>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)} aria-label={showFilters ? 'Hide filters' : 'Show filters'} className="shrink-0 inline-flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 shrink-0" aria-hidden />
              <span>Filters</span>
              {(() => {
                const activeCount = [filters.priceMin, filters.priceMax, filters.carSize, filters.amenities?.length ? 1 : 0, filters.radius].filter(Boolean).length;
                return activeCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-primary-600 text-white">
                    {activeCount}
                  </span>
                ) : null;
              })()}
            </Button>
          </div>
          {(() => {
            const chips: { key: keyof SearchFilters; label: string; value?: string }[] = [];
            if (filters.priceMin) chips.push({ key: 'priceMin', label: `Min $${filters.priceMin}` });
            if (filters.priceMax) chips.push({ key: 'priceMax', label: `Max $${filters.priceMax}` });
            if (filters.carSize) chips.push({ key: 'carSize', label: filters.carSize.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) });
            filters.amenities?.forEach((a) => chips.push({ key: 'amenities', label: a.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()), value: a }));
            if (filters.radius) chips.push({ key: 'radius', label: `${filters.radius} km` });
            if (chips.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 mt-2">
                {chips.map((chip) => (
                  <span key={chip.value ? `${chip.key}-${chip.value}` : chip.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                    {chip.label}
                    <button type="button" onClick={() => removeFilter(chip.key, chip.value)} className="p-0.5 rounded-full hover:bg-primary-200/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" aria-label={`Remove ${chip.label}`}>
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Content area: fixed height so only the list scrolls, not the page or map */}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
        style={{ height: `calc(100vh - ${CONTENT_TOP_OFFSET_REM}rem)` }}
      >
      {/* Desktop: resizable map | list with draggable divider */}
      <div
        ref={splitContainerRef}
        className={`hidden lg:flex flex-1 min-h-0 w-full overflow-hidden ${isResizing ? 'select-none' : ''}`}
        style={isResizing ? { cursor: 'col-resize' } : undefined}
      >
        <ErrorBoundary fallback={
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 min-h-0">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
              <p className="text-gray-700 mb-4">Map failed to load. You can still browse the list.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
            </div>
          </div>
        }>
          <div
            className="min-w-0 flex-shrink-0 h-full overflow-hidden bg-gray-100 relative"
            style={{ width: `${100 - listWidthPercent}%` }}
          >
            {!emptyResults && canRenderMap ? (
              <MapViewDirect
                key="search-map-desktop"
                center={mapCenter}
                markers={mapMarkers}
                height="100%"
                highlightedMarkerId={hoveredDrivewayId || selectedDriveway}
                onMarkerClick={(id: string) => {
                  setSelectedDriveway(id);
                  const element = document.getElementById(`driveway-${id}`);
                  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                onMarkerHover={setHoveredDrivewayId}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm">No driveways to display on map</p>
              </div>
            )}
          </div>
        </ErrorBoundary>
        <div
          role="separator"
          aria-label="Resize list"
          tabIndex={0}
          onMouseDown={handleResizeStart}
          className="flex-shrink-0 w-1.5 h-full bg-gray-200 hover:bg-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-col-resize flex items-center justify-center group"
        >
          <span className="w-0.5 h-8 bg-gray-400 group-hover:bg-primary-500 rounded-full pointer-events-none" aria-hidden />
        </div>
        <aside
          className="min-w-0 min-h-0 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto flex flex-col"
          style={{ width: `${listWidthPercent}%` }}
        >
          <SearchResultsPanel
            open={true}
            onClose={() => {}}
            panelRef={listPanelRef}
            contentTopOffset="0"
            isMobileView={false}
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
            formatPrice={formatPrice}
            renderStars={renderStars}
            calculateDistanceKm={calculateDistanceKm}
          />
        </aside>
      </div>

      {/* Mobile: resizable map (top) | list (bottom) with draggable divider */}
      <div
        ref={mobileSplitContainerRef}
        className={`lg:hidden flex flex-col flex-1 min-h-0 ${isResizingMobile ? 'select-none' : ''}`}
        aria-label="Search results and map"
      >
        {/* Map: resizable height */}
        <section
          id="search-map-mobile"
          className="shrink-0 min-h-[180px] bg-gray-100 border-b border-gray-200 relative overflow-hidden"
          style={{ height: `${mobileMapHeightPercent}%` }}
          aria-label="Map"
        >
          {!emptyResults && canRenderMap ? (
            <MapViewDirect
              key="search-map-mobile"
              center={mapCenter}
              markers={mapMarkers}
              height="100%"
              onMarkerClick={(id: string) => setSelectedDriveway(id)}
              highlightedMarkerId={hoveredDrivewayId || selectedDriveway}
              onMarkerHover={setHoveredDrivewayId}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <p className="text-sm">No driveways to display on map</p>
            </div>
          )}
        </section>
        <div
          role="separator"
          aria-label="Resize map and list"
          onMouseDown={handleMobileResizeStart}
          onTouchStart={handleMobileResizeStart}
          className="flex-shrink-0 h-3 bg-gray-200 hover:bg-primary-400 active:bg-primary-500 cursor-row-resize flex items-center justify-center touch-none"
        >
          <span className="w-12 h-0.5 bg-gray-400 rounded-full pointer-events-none" aria-hidden />
        </div>
        {/* List: scrollable below map */}
        <div id="search-list-mobile" className="flex-1 min-h-0 overflow-y-auto bg-white" aria-label="Results list">
          <SearchResultsPanel
            open={true}
            onClose={() => {}}
            panelRef={listPanelRef}
            contentTopOffset="0"
            isMobileView={true}
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
            formatPrice={formatPrice}
            renderStars={renderStars}
            calculateDistanceKm={calculateDistanceKm}
          />
        </div>
        {/* Bottom sheet when a pin is selected on mobile */}
        {selectedDriveway && (() => {
          const d = sortedDrivewayList.find((x) => x.id === selectedDriveway);
          if (!d) return null;
          const hasReviews = (d.reviewCount ?? 0) > 0;
          return (
            <>
              <div className="lg:hidden fixed inset-0 bg-black/20 z-20" aria-hidden onClick={() => setSelectedDriveway(null)} />
              <div className="lg:hidden fixed left-0 right-0 bottom-0 z-30 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] p-6 pb-[env(safe-area-inset-bottom)]">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" aria-hidden />
                <h3 className="text-base font-semibold text-[#111827]">{d.title}</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{d.address}</p>
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mt-1.5">
                  {filters.latitude && filters.longitude && (() => {
                    const km = calculateDistanceKm(d);
                    if (km === null) return null;
                    return <span>{km < 0.1 ? '< 100 m' : `${km.toFixed(1)} km`}</span>;
                  })()}
                  {hasReviews && (
                    <span>★ {d.averageRating?.toFixed(1)} ({d.reviewCount})</span>
                  )}
                  {!hasReviews && <span className="bg-gray-100 text-[#9CA3AF] px-1.5 py-0.5 rounded text-xs">New</span>}
                </div>
                <div className="flex items-center justify-between gap-4 mt-4">
                  <span className="text-lg font-bold text-primary-600">{formatPrice(d.pricePerHour)}<span className="text-xs font-normal text-[#9CA3AF]">/hr</span></span>
                  <Link
                    href={`/driveway/${d.id}`}
                    onClick={() => setSelectedDriveway(null)}
                    className="inline-flex items-center justify-center w-full py-2.5 px-6 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700"
                  >
                    Reserve
                  </Link>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Mobile: floating search button when search bar collapsed */}
      {!mobileSearchExpanded && (
        <div className="lg:hidden fixed bottom-6 right-6 z-30" aria-label="Search">
          <button
            type="button"
            onClick={() => setMobileSearchExpanded(true)}
            aria-label="Open search"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:bg-primary-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <MagnifyingGlassIcon className="w-6 h-6" aria-hidden />
          </button>
        </div>
      )}

      {/* Filters Panel (Collapsible): compact first row + More (Location, Radius, Amenities, Apply) */}
      {showFilters && (
        <div className="sticky z-20 bg-white border-b border-gray-200 shadow-sm" style={{ top: CONTENT_TOP_OFFSET }}>
          <div className="container mx-auto px-4 py-4">
            {/* Compact filter bar: one row */}
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div className="min-w-[80px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Price Min</label>
                <Input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  placeholder="Min"
                  className="text-sm w-20"
                />
              </div>
              <div className="min-w-[80px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Price Max</label>
                <Input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  placeholder="Max"
                  className="text-sm w-20"
                />
              </div>
              <div className="min-w-[100px]">
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
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort</label>
                <Select
                  value={filters.sort || ''}
                  onChange={(e) => handleFilterChange('sort', e.target.value as SearchFilters['sort'])}
                  className="text-sm"
                  options={[
                    { value: '', label: 'Relevance' },
                    { value: 'price_asc', label: 'Price: Low to High' },
                    { value: 'price_desc', label: 'Price: High to Low' },
                    { value: 'rating_desc', label: 'Rating: High to Low' },
                    { value: 'distance_asc', label: 'Nearest first' },
                  ]}
                />
              </div>
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
                className="shrink-0"
              >
                <MapPinIcon className="w-4 h-4 mr-1" /> Use my location
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowMoreFilters((m) => !m)}
                aria-expanded={showMoreFilters}
                aria-label={showMoreFilters ? 'Hide more filters' : 'Show more filters'}
                className="shrink-0"
              >
                {showMoreFilters ? 'Less' : 'More'}
              </Button>
            </div>

            {/* More filters (Location, Radius, Amenities, Apply) */}
            {showMoreFilters && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <AddressAutocomplete
                      label="Location"
                      value={filters.location}
                      onChange={(address) => handleFilterChange('location', address)}
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
                </div>
                <div>
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
                    Apply filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      </div>
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
