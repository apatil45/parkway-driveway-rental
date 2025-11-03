'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, LoadingSpinner, ErrorMessage, Button, Input, Select } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import MapView from '@/components/ui/MapView';
import { useDriveways } from '@/hooks';

interface Driveway {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  capacity: number;
  carSize: string[];
  amenities: string[];
  images: string[];
  isActive: boolean;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  distance?: number;
}

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
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDriveway, setSelectedDriveway] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: driveways, loading, error, fetchDriveways } = useDriveways();

  useEffect(() => {
    performSearch();
  }, [router]);

  const performSearch = async (page = 1) => {
    const params = {
      page: page.toString(),
      limit: '10',
      ...(filters.location && { location: filters.location }),
      ...(filters.priceMin && { priceMin: filters.priceMin }),
      ...(filters.priceMax && { priceMax: filters.priceMax }),
      ...(filters.carSize && { carSize: filters.carSize }),
      ...(filters.amenities.length > 0 && { amenities: filters.amenities.join(',') }),
      ...(filters.latitude && { latitude: filters.latitude }),
      ...(filters.longitude && { longitude: filters.longitude }),
      ...(filters.radius && { radius: filters.radius }),
      ...(filters.sort && { sort: filters.sort })
    };

    const result = await fetchDriveways(params);
    if (result.success && result.data) {
      setPagination(result.data.pagination);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    performSearch(1);
  };

  const handlePageChange = (page: number) => {
    performSearch(page);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const distanceKm = (d: Driveway) => {
    if (!filters.latitude || !filters.longitude) return null;
    const R = 6371;
    const lat1 = Number(filters.latitude) * Math.PI / 180;
    const lat2 = d.latitude * Math.PI / 180;
    const dlat = lat2 - lat1;
    const dlon = (d.longitude - Number(filters.longitude)) * Math.PI / 180;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  if (loading && (!driveways || driveways.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" text="Loading driveways..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage
          title="Search Error"
          message={error}
          onRetry={() => performSearch()}
        />
      </div>
    );
  }

  // Normalize API result shape
  let drivewayList: Driveway[] = [];
  if (Array.isArray(driveways)) {
    drivewayList = (driveways as unknown as Driveway[]);
  } else if (driveways && Array.isArray((driveways as any).driveways)) {
    drivewayList = (driveways as any).driveways as Driveway[];
  }

  // Calculate map center
  const mapCenter: [number, number] = filters.latitude && filters.longitude
    ? [Number(filters.latitude), Number(filters.longitude)]
    : drivewayList.length > 0
    ? [drivewayList[0].latitude, drivewayList[0].longitude]
    : [37.7749, -122.4194];

  // Map markers
  const mapMarkers = drivewayList.map(d => ({
    id: d.id,
    position: [d.latitude, d.longitude] as [number, number],
    title: d.title,
    price: d.pricePerHour,
  }));

  const emptyResults = Array.isArray(drivewayList) && drivewayList.length === 0 && !loading;

  return (
    <AppLayout showFooter={false}>
      <div className="min-h-screen bg-gray-50">
      {/* View Mode Toggle */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'map'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'split'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Both
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel (Collapsible) */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <Input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
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
                      alert('Geolocation not supported');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        handleFilterChange('latitude', String(pos.coords.latitude));
                        handleFilterChange('longitude', String(pos.coords.longitude));
                      },
                      (err) => alert('Unable to get location')
                    );
                  }}
                  className="w-full"
                >
                  📍 Use My Location
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

      {/* Main Content Area - Split Layout */}
      <div className={`flex ${viewMode === 'split' ? 'flex-col lg:flex-row' : 'flex-col'} h-[calc(100vh-4rem)]`}>
        {/* Map Section */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className={`${
            viewMode === 'split' 
              ? 'w-full lg:w-1/2 h-1/2 lg:h-full border-r border-gray-200' 
              : 'w-full h-full'
          } relative bg-gray-100`}>
            {!emptyResults && (
              <MapView
                center={mapCenter}
                markers={mapMarkers}
                height="100%"
                onMarkerClick={(id) => {
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
            )}
            {emptyResults && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600 mb-2">MAP</div>
                  <p className="text-sm">No driveways to display on map</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listings Section */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={`${
            viewMode === 'split' 
              ? 'w-full lg:w-1/2 h-1/2 lg:h-full overflow-y-auto' 
              : 'w-full h-full overflow-y-auto'
          } bg-white`}>
            <div className="p-4 sm:p-6">
              {emptyResults ? (
                <div className="text-center py-12">
                  <div className="text-lg font-semibold text-gray-600 mb-4">PARKING</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No driveways found</h3>
                  <p className="text-sm text-gray-600 mb-4">Try adjusting your search filters</p>
                  <Button onClick={() => setShowFilters(true)} size="sm">
                    Show Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      {pagination.total} driveways found
                    </p>
                  </div>
                  <div className="space-y-4">
                    {drivewayList.map((driveway: Driveway) => (
                      <div
                        key={driveway.id}
                        id={`driveway-${driveway.id}`}
                        className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                          selectedDriveway === driveway.id ? 'ring-2 ring-primary-500' : ''
                        }`}
                        onClick={() => {
                          setSelectedDriveway(driveway.id);
                          router.push(`/driveway/${driveway.id}`);
                        }}
                      >
                        <div className="flex">
                          {/* Image */}
                          {driveway.images.length > 0 ? (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                              <img
                                src={driveway.images[0]}
                                alt={driveway.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-500">P</span>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                  {driveway.title}
                                </h3>
                                <p className="text-xs text-gray-600 mb-2">{driveway.address}</p>
                                {driveway.description && (
                                  <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                                    {driveway.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-lg font-bold text-primary-600">
                                  {formatPrice(driveway.pricePerHour)}
                                </div>
                                <div className="text-xs text-gray-500">per hour</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                {renderStars(driveway.averageRating)}
                                <span className="ml-1">({driveway.reviewCount})</span>
                              </div>
                              {distanceKm(driveway) !== null && (
                                <span className="flex items-center gap-1">
                                  <span>📍</span>
                                  {distanceKm(driveway)} km away
                                </span>
                              )}
                              <span>Capacity: {driveway.capacity}</span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {driveway.amenities.slice(0, 3).map((amenity) => (
                                <span
                                  key={amenity}
                                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                                >
                                  {amenity.replace('_', ' ')}
                                </span>
                              ))}
                              {driveway.amenities.length > 3 && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                                  +{driveway.amenities.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
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
                            variant={page === pagination.page ? "primary" : "outline"}
                            onClick={() => handlePageChange(page)}
                            size="sm"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
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