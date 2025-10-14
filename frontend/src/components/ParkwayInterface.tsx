import React, { useState, useEffect } from 'react';
import ParkwaySearchForm from './ParkwaySearchForm';
import EnhancedParkwayResults from './EnhancedParkwayResults';
import EnhancedMapView from './EnhancedMapView';
import SimpleBookingModal from './SimpleBookingModal';
import QuickActions from './QuickActions';
import ProfessionalDrivewayList from './ProfessionalDrivewayList';
import UnifiedMapView from './UnifiedMapView';
import { Driveway, UserLocation } from '../types/map';
// CSS import removed - now using Tailwind CSS

// Using unified types from ../types/map

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingDriveways, setIsLoadingDriveways] = useState(false);

  // Load all available driveways by default
  const loadAllAvailableDriveways = async (userLat?: number, userLng?: number, isRefresh: boolean = false) => {
    // Prevent multiple simultaneous calls
    if (isLoadingDriveways && !isRefresh) {
      console.log('⏳ Already loading driveways, skipping...');
      return;
    }
    
    try {
      setIsLoadingDriveways(true);
      if (isRefresh) {
        setIsRefreshing(true);
      }
      console.log('🔄 Loading all available driveways...', { userLat, userLng, isRefresh });
      
      // Use current time for "Park Now" mode to show all currently available slots
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const currentDate = now.toISOString().split('T')[0];
      
      const searchParams = new URLSearchParams({
        searchMode: 'now',
        duration: '120' // 2 hours default
      });
      
      // Add user location if available
      if (userLat && userLng) {
        searchParams.append('latitude', userLat.toString());
        searchParams.append('longitude', userLng.toString());
      } else {
        // Default to Jersey City area
        searchParams.append('latitude', '40.7178');
        searchParams.append('longitude', '-74.0431');
      }
      
      const response = await fetch(`/api/driveways/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded all available driveways:', {
          count: data.driveways.length,
          searchMode: data.searchMode,
          debug: data.debug,
          userLocation: data.userLocation
        });
        setDriveways(data.driveways || []);
        setSearchError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load driveways');
      }
    } catch (error) {
      console.error('❌ Error loading all driveways:', error);
      setSearchError('Failed to load available parking spots');
      setDriveways([]);
    } finally {
      setIsLoadingDriveways(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  // Refresh available spots
  const refreshAvailableSpots = () => {
    if (userLocation) {
      loadAllAvailableDriveways(userLocation.lat, userLocation.lng, true);
    }
  };

  // Get user location and load all driveways on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          // Load all available driveways with user location
          loadAllAvailableDriveways(location.lat, location.lng);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Set default location (Jersey City) and load driveways
          const defaultLocation = {
            lat: 40.7178,
            lng: -74.0431
          };
          setUserLocation(defaultLocation);
          loadAllAvailableDriveways(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      // Set default location (Jersey City) and load driveways
      const defaultLocation = {
        lat: 40.7178,
        lng: -74.0431
      };
      setUserLocation(defaultLocation);
      loadAllAvailableDriveways(defaultLocation.lat, defaultLocation.lng);
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

  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>();

  const handleDrivewaySelect = (driveway: Driveway, clickPos?: { x: number; y: number }) => {
    console.log('🎯 handleDrivewaySelect called with:', {
      id: driveway.id,
      address: driveway.address,
      pricePerHour: driveway.pricePerHour,
      isAvailable: driveway.isAvailable,
      coordinates: driveway.coordinates,
      clickPosition: clickPos
    });
    setSelectedDriveway(driveway);
    setClickPosition(clickPos);
    setShowBookingModal(true);
    console.log('✅ Booking modal should now be open');
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

            </div>
          </div>

          {/* Map Panel - 3/5 width */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[700px]">
                <div className="p-0">
                  <div className="h-[700px] rounded-2xl overflow-hidden">
                    <UnifiedMapView
                      driveways={driveways}
                      userLocation={userLocation}
                      onDrivewaySelect={handleDrivewaySelect}
                      selectedDriveway={selectedDriveway}
                      height={500}
                      showLegend={true}
                      showControls={true}
                      onRefresh={refreshAvailableSpots}
                      isRefreshing={isRefreshing}
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
            clickPosition={clickPosition}
          />
        )}
    </div>
  );
};

export default ParkwayInterface;
