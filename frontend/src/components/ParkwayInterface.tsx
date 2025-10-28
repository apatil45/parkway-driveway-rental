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
import { Driveway, UserLocation } from '../types/map';

interface SearchData {
  location: string;
  date: string;
  time: string;
  coordinates?: { lat: number; lng: number };
}

const ParkwayInterface: React.FC = () => {
  // State declarations - all at the top
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
  
  // Refs
  const isLoadingRef = useRef(false);
  
  // Hooks
  const { openBookingModal } = useBooking();

  // Simple function to load driveways - no useCallback to avoid circular dependencies
  const loadDriveways = async (lat?: number, lng?: number) => {
    if (isLoadingRef.current) {
      console.log('⏳ Already loading driveways, skipping...');
      return;
    }
    
    try {
      isLoadingRef.current = true;
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
        setLastUpdateTime(new Date());
      } else {
        console.log('⚠️ No driveways found');
        setDriveways([]);
        setSearchError(response.error || 'No driveways found');
      }
      
      if (lat && lng) {
        setUserLocation({ lat, lng });
      }
      
    } catch (error) {
      console.error('❌ Error loading driveways:', error);
      setSearchError('Failed to load driveways. Please try again.');
      setDriveways([]);
    } finally {
      setIsLoadingDriveways(false);
      isLoadingRef.current = false;
    }
  };

  // Simple refresh function
  const refreshAvailableSpots = () => {
    if (userLocation) {
      loadDriveways(userLocation.lat, userLocation.lng);
    }
  };

  // Initialize on mount
  useEffect(() => {
    console.log('🚀 ParkwayInterface mounted, loading driveways...');
    
    const defaultLocation = {
      lat: 40.7178,
      lng: -74.0431
    };
    setUserLocation(defaultLocation);
    
    // Load driveways directly
    loadDriveways(defaultLocation.lat, defaultLocation.lng);
    setIsInitialized(true);
  }, []); // Empty dependency array

  // Search handler
  const handleSearch = async (data: SearchData) => {
    setSearchData(data);
    setIsSearching(true);
    setSearchError(null);

    try {
      const searchParams = new URLSearchParams();
      
      if (data.coordinates) {
        searchParams.append('latitude', data.coordinates.lat.toString());
        searchParams.append('longitude', data.coordinates.lng.toString());
      } else if (userLocation) {
        searchParams.append('latitude', userLocation.lat.toString());
        searchParams.append('longitude', userLocation.lng.toString());
      }

      searchParams.append('radius', '1000');
      searchParams.append('searchMode', data.searchMode || 'now');

      if (data.searchMode === 'now') {
        searchParams.append('duration', data.duration?.toString() || '120');
      } else {
        if (data.date) searchParams.append('date', data.date);
        if (data.time) {
          const [hours, minutes] = data.time.split(':').map(Number);
          const startDateTime = new Date();
          startDateTime.setHours(hours, minutes, 0, 0);
          const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000));
          const endTime = endDateTime.toTimeString().slice(0, 5);
          
          searchParams.append('startTime', data.time);
          searchParams.append('endTime', endTime);
        }
      }

      const result = await apiService.get(`/driveways/search?${searchParams.toString()}`);
      
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
      
      console.log('✅ Search results:', driveways.length);
      setDriveways(driveways);
      setSearchError(null);
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchError('Search failed. Please try again.');
      setDriveways([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Driveway selection handler
  const handleDrivewaySelect = (driveway: Driveway) => {
    setSelectedDriveway(driveway);
    openBookingModal(driveway);
  };

  // Map centering handler
  const handleCenterMapOnDriveway = (driveway: Driveway) => {
    if (centerMapOnDriveway) {
      centerMapOnDriveway(driveway);
    }
  };

  // Connection status
  const isConnected = true;

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
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
          {/* Search & Results Panel */}
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
                  isLoading={isLoadingDriveways}
                  onCenterMapOnDriveway={handleCenterMapOnDriveway}
                />
              )}

              {!isSearching && !searchError && driveways.length === 0 && !isLoadingDriveways && (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No parking spots found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or location.</p>
                    <button 
                      onClick={refreshAvailableSpots}
                      className="btn btn-primary"
                    >
                      Refresh Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full min-h-[600px]">
              <UnifiedMapView
                driveways={driveways}
                userLocation={userLocation}
                onDrivewaySelect={handleDrivewaySelect}
                onCenterMapOnDriveway={setCenterMapOnDriveway}
                isLoading={isLoadingDriveways}
                searchData={searchData}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8">
          <QuickActions
            onRefresh={refreshAvailableSpots}
            isRefreshing={isRefreshing}
            isConnected={isConnected}
            lastUpdateTime={lastUpdateTime}
          />
        </div>
      </div>

      {/* Booking Modal */}
      <UnifiedBookingModal />
    </div>
  );
};

export default ParkwayInterface;