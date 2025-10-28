import React, { useState, useEffect, useCallback, useRef } from 'react';
import ParkwaySearchForm from './ParkwaySearchForm';
import EnhancedParkwayResults from './EnhancedParkwayResults';
import EnhancedMapView from './EnhancedMapView';
import UnifiedBookingModal from './UnifiedBookingModal';
import QuickActions from './QuickActions';
import ProfessionalDrivewayList from './ProfessionalDrivewayList';
import UnifiedMapView from './UnifiedMapView';
import { useBooking } from '../context/BookingContext';
import apiService from '../services/apiService';
// import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'; // Temporarily disabled
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
  // Initialize all state first to avoid temporal dead zone
  const [activeTab, setActiveTab] = useState<'search' | 'reserve' | 'prices' | 'explore' | 'airport'>('search');
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingDriveways, setIsLoadingDriveways] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [centerMapOnDriveway, setCenterMapOnDriveway] = useState<((driveway: Driveway) => void) | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoadingRef = useRef(false);
  
  // Initialize hooks after state
  const { openBookingModal } = useBooking();

  // Define loadDriveways as a useCallback to avoid temporal dead zone issues
  const loadDriveways = useCallback(async (lat?: number, lng?: number) => {
    try {
      setIsLoadingDriveways(true);
      console.log('🔄 Loading driveways...', { lat, lng });
      
      const searchParams: any = {
        searchMode: 'now',
        duration: '120'
      };

      if (lat && lng) {
        searchParams.lat = lat.toString();
        searchParams.lng = lng.toString();
        searchParams.radius = '10';
      }

      const response = await apiService.getDriveways(searchParams);
      
      if (response.success && response.data) {
        console.log('✅ Loaded driveways:', response.data.length);
        setDriveways(response.data);
        setSearchError(null);
      } else {
        console.log('⚠️ No driveways found');
        setDriveways([]);
        setSearchError(response.error || 'No driveways found');
      }
      
    } catch (error) {
      console.error('❌ Error loading driveways:', error);
      setSearchError('Failed to load driveways. Please try again.');
      setDriveways([]);
    } finally {
      setIsLoadingDriveways(false);
    }
  }, []); // Empty dependency array

  // Define refresh function as useCallback
  const refreshAvailableSpots = useCallback(() => {
    if (userLocation) {
      loadDriveways(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, loadDriveways]);

  // Simple connection status (always true for now since we disabled realtime)
  const isConnected = true;

  // useEffect to load driveways on mount
  useEffect(() => {
    console.log('🚀 ParkwayInterface mounted, loading driveways...');
    
    // Set default location and load driveways
    const defaultLocation = {
      lat: 40.7178,
      lng: -74.0431
    };
    setUserLocation(defaultLocation);
    
    // Call loadDriveways directly instead of relying on dependency
    const loadInitialDriveways = async () => {
      try {
        setIsLoadingDriveways(true);
        console.log('🔄 Loading driveways...', { lat: defaultLocation.lat, lng: defaultLocation.lng });
        
        const searchParams = {
          searchMode: 'now',
          duration: '120',
          lat: defaultLocation.lat.toString(),
          lng: defaultLocation.lng.toString(),
          radius: '10'
        };

        const response = await apiService.getDriveways(searchParams);
        
        if (response.success && response.data) {
          console.log('✅ Loaded driveways:', response.data.length);
          setDriveways(response.data);
          setSearchError(null);
        } else {
          console.log('⚠️ No driveways found');
          setDriveways([]);
          setSearchError(response.error || 'No driveways found');
        }
        
      } catch (error) {
        console.error('❌ Error loading driveways:', error);
        setSearchError('Failed to load driveways. Please try again.');
        setDriveways([]);
      } finally {
        setIsLoadingDriveways(false);
      }
    };
    
    loadInitialDriveways();
    setIsInitialized(true);
  }, []); // Empty dependency array - only run on mount

  const handleSearch = useCallback(async (data: SearchData) => {
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

      const result = await apiService.get(`/driveways/search?${searchParams}`);
      console.log('Search API response:', result);
      
      // Handle enhanced response format
      let driveways = [];
      if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          driveways = result.data;
        } else if (result.data.driveways && Array.isArray(result.data.driveways)) {
          driveways = result.data.driveways;
        }
      } else if (Array.isArray(result)) {
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
  }, [userLocation]);

  const handleDrivewaySelect = useCallback((driveway: Driveway, clickPos?: { x: number; y: number }) => {
    console.log('🎯 handleDrivewaySelect called with:', {
      id: driveway.id,
      address: driveway.address,
      pricePerHour: driveway.pricePerHour,
      isAvailable: driveway.isAvailable,
      coordinates: driveway.coordinates,
      clickPosition: clickPos
    });
    setSelectedDriveway(driveway);
    openBookingModal(driveway, clickPos);
    console.log('✅ Booking modal should now be open');
  }, [openBookingModal]);

  const handleDrivewayFocus = useCallback((driveway: Driveway) => {
    // Only select for map focus, don't open booking modal
    setSelectedDriveway(driveway);
  }, []);

  const handleBookingSuccess = useCallback(() => {
    setSelectedDriveway(null);
    // Optionally refresh the search results
  }, []);

  // Show loading state until component is fully initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Parkway Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Search & Results Panel - responsive width */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Search Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 sm:p-6">
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
                  onCenterMapOnDriveway={centerMapOnDriveway}
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

          {/* Map Panel - responsive width */}
          <div className="lg:col-span-3">
            <div className="sticky top-20 sm:top-24">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]">
                <div className="p-0">
                  <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-xl sm:rounded-2xl overflow-hidden">
                    <UnifiedMapView
                      driveways={driveways}
                      userLocation={userLocation}
                      onDrivewaySelect={handleDrivewaySelect}
                      selectedDriveway={selectedDriveway}
                      height={400}
                      showLegend={true}
                      showControls={true}
                      onRefresh={refreshAvailableSpots}
                      isRefreshing={isRefreshing}
                      onCenterMapOnDriveway={setCenterMapOnDriveway}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
          {lastUpdateTime && (
            <span className="text-xs opacity-75">
              {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Unified Booking Modal */}
      <UnifiedBookingModal onBookingSuccess={handleBookingSuccess} />
    </div>
  );
};

export default ParkwayInterface;
