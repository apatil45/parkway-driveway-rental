'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, LoadingSpinner, ErrorMessage, Button, Input, Select } from '@/components/ui';
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
}

interface SearchFilters {
  location: string;
  priceMin: string;
  priceMax: string;
  carSize: string;
  amenities: string[];
}

function SearchPageContent() {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    priceMin: '',
    priceMax: '',
    carSize: '',
    amenities: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: driveways, loading, error, fetchDriveways } = useDriveways();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load initial search
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
      ...(filters.amenities.length > 0 && { amenities: filters.amenities.join(',') })
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
        className={`text-lg ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  if (loading && (!driveways || driveways.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" text="Searching for driveways..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          title="Search Error"
          message={error}
          onRetry={() => performSearch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              Parkway
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/');
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Driveways</h1>

        {/* Search Filters */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Search Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Enter city or address"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price (per hour)
              </label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price (per hour)
              </label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                placeholder="100"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Size
              </label>
              <select
                value={filters.carSize}
                onChange={(e) => handleFilterChange('carSize', e.target.value)}
                className="input"
              >
                <option value="">Any Size</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['covered', 'security', 'ev_charging', 'easy_access'].map((amenity) => (
                <label key={amenity} className="flex items-center">
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
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {amenity.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSearch}
              loading={loading}
            >
              Search Driveways
            </Button>
          </div>
        </Card>

        {/* Results */}
        {driveways && driveways.length === 0 && !loading ? (
          <Card className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No driveways found</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {driveways && driveways.map((driveway: Driveway) => (
              <Card key={driveway.id} className="overflow-hidden">
                {driveway.images.length > 0 && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={driveway.images[0]}
                      alt={driveway.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{driveway.title}</h3>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(driveway.pricePerHour)}/hr
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{driveway.address}</p>
                  
                  {driveway.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {driveway.description}
                    </p>
                  )}

                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {renderStars(driveway.averageRating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({driveway.reviewCount} reviews)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {driveway.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {amenity.replace('_', ' ')}
                      </span>
                    ))}
                    {driveway.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{driveway.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p>Owner: {driveway.owner.name}</p>
                      <p>Capacity: {driveway.capacity} car{driveway.capacity > 1 ? 's' : ''}</p>
                    </div>
                    <Link
                      href={`/driveway/${driveway.id}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                size="sm"
              >
                Previous
              </Button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.page ? "primary" : "outline"}
                  onClick={() => handlePageChange(page)}
                  size="sm"
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                size="sm"
              >
                Next
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
