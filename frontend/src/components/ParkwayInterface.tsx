import React, { useState, useEffect } from 'react';
import ParkwaySearchForm from './ParkwaySearchForm';
import EnhancedParkwayResults from './EnhancedParkwayResults';
import EnhancedMapView from './EnhancedMapView';
import SimpleBookingModal from './SimpleBookingModal';
import QuickActions from './QuickActions';
import ProfessionalDrivewayList from './ProfessionalDrivewayList';
import RealMapView from './RealMapView';
// CSS import removed - now using Tailwind CSS

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number | string;
  images: string[];
  rating: number;
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  amenities?: string[];
  features?: string[];
  owner?: {
    name: string;
    rating: number;
  };
  availability?: {
    startTime: string;
    endTime: string;
  };
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface SearchData {
  location: string;
  date: string;
  time: string;
  coordinates?: { lat: number; lng: number };
}

const ParkwayInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'reserve' | 'prices' | 'explore' | 'airport'>('search');
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Set default location (Jersey City)
          setUserLocation({
            lat: 40.7178,
            lng: -74.0431
          });
        }
      );
    } else {
      // Set default location if geolocation is not supported
      setUserLocation({
        lat: 40.7178,
        lng: -74.0431
      });
    }
  }, []);

  const handleSearch = async (data: SearchData) => {
    setSearchData(data);
    setIsSearching(true);
    setSearchError(null);

    try {
      // Use your existing driveway search API
      const searchParams = new URLSearchParams();
      
      if (data.coordinates) {
        searchParams.append('latitude', data.coordinates.lat.toString());
        searchParams.append('longitude', data.coordinates.lng.toString());
      } else if (userLocation) {
        searchParams.append('latitude', userLocation.lat.toString());
        searchParams.append('longitude', userLocation.lng.toString());
      }

      searchParams.append('radius', '1000'); // 1km radius - very local parking
      searchParams.append('searchMode', data.searchMode);

      // Add mode-specific parameters
      if (data.searchMode === 'now') {
        searchParams.append('duration', data.duration?.toString() || '120');
      } else {
        if (data.date) searchParams.append('date', data.date);
        if (data.time) {
          // For schedule mode, we need to calculate end time
          // For now, let's assume 2 hours duration
          const startTime = data.time;
          const [hours, minutes] = startTime.split(':').map(Number);
          const startDateTime = new Date();
          startDateTime.setHours(hours, minutes, 0, 0);
          const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
          const endTime = endDateTime.toTimeString().slice(0, 5);
          
          searchParams.append('startTime', startTime);
          searchParams.append('endTime', endTime);
        }
      }

      const response = await fetch(`/api/driveways/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search driveways');
      }

      const result = await response.json();
      console.log('Search API response:', result);
      
      // Handle enhanced response format
      let driveways = [];
      if (Array.isArray(result)) {
        driveways = result;
      } else if (result.driveways && Array.isArray(result.driveways)) {
        driveways = result.driveways;
      } else if (result.data && Array.isArray(result.data)) {
        driveways = result.data;
      }
      
      console.log('Processed driveways:', driveways);
      setDriveways(driveways);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search for parking spots. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDrivewaySelect = (driveway: Driveway) => {
    console.log('handleDrivewaySelect called with:', driveway);
    setSelectedDriveway(driveway);
    setShowBookingModal(true);
    console.log('Booking modal should now be open');
  };

  const handleDrivewayFocus = (driveway: Driveway) => {
    // Only select for map focus, don't open booking modal
    setSelectedDriveway(driveway);
    setShowBookingModal(false);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedDriveway(null);
    // Optionally refresh the search results
  };

  const handleCancel = () => {
    setShowBookingModal(false);
    setSelectedDriveway(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Search & Results Panel - 2/5 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6">
                <ParkwaySearchForm 
                  onSearch={handleSearch}
                  userLocation={userLocation}
                  isLoading={isSearching}
                />
              </div>
            </div>

            {/* Results Panel */}
            <div className="content-spacing">
              {isSearching && (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Searching for parking spots...</p>
                  </div>
                </div>
              )}

              {searchError && (
                <div className="card border-red-500">
                  <div className="card-body text-center py-8">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-gray-800 mb-4">{searchError}</p>
                    <button 
                      onClick={() => setSearchError(null)}
                      className="btn btn-outline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {!isSearching && !searchError && driveways.length > 0 && (
                <ProfessionalDrivewayList
                  driveways={driveways}
                  onDrivewaySelect={handleDrivewaySelect}
                  searchLocation={userLocation}
                  selectedDriveway={selectedDriveway}
                />
              )}

              {!isSearching && !searchError && driveways.length === 0 && searchData && (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No parking spots found</h3>
                    <p className="text-gray-600 mb-4">No parking spots found in this area.</p>
                    <p className="text-gray-500">Try expanding your search radius or checking a different location.</p>
                  </div>
                </div>
              )}

              {!searchData && (
                <div className="card">
                  <div className="card-body text-center py-16">
                    <div className="text-blue-600 mb-6">
                      <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Parking Spot</h2>
                    <p className="text-lg text-gray-600">Enter your destination to discover available parking options near you.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Panel - 3/5 width */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[600px]">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Interactive Map</h3>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                        Reserve Parking
                      </button>
                      <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
                        Search Zones
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-0">
                  <div className="h-[500px] rounded-b-2xl overflow-hidden">
                    <RealMapView
                      driveways={driveways}
                      userLocation={userLocation}
                      onDrivewaySelect={handleDrivewaySelect}
                      selectedDriveway={selectedDriveway}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

        {/* Booking Modal */}
        {showBookingModal && selectedDriveway && (
          <SimpleBookingModal
            isOpen={showBookingModal}
            onClose={handleCancel}
            driveway={selectedDriveway}
            onBookingSuccess={handleBookingSuccess}
          />
        )}
    </div>
  );
};

export default ParkwayInterface;
