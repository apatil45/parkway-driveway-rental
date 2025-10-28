import React, { useState, useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
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
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingDriveways, setIsLoadingDriveways] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Refs
  const isLoadingRef = useRef(false);
  
  // Hooks
  const { openBookingModal } = useBooking();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Simple function to load driveways
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

      console.log('🔍 Making API call with params:', searchParams);
      const response = await apiService.getDriveways(searchParams);
      console.log('🔍 API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Loaded driveways:', response.data.length);
        setDriveways(response.data);
        setLastUpdateTime(new Date());
      } else {
        console.log('⚠️ No driveways found or API error:', response);
        setDriveways([]);
      }
      
      if (lat && lng) {
        setUserLocation({ lat, lng });
      }
      
    } catch (error) {
      console.error('❌ Error loading driveways:', error);
      setDriveways([]);
    } finally {
      setIsLoadingDriveways(false);
      isLoadingRef.current = false;
    }
  };

  // Initialize on mount - wait for authentication
  useEffect(() => {
    console.log('🚀 ParkwayInterface mounted, checking authentication...');
    console.log('Auth status:', { isLoading, isAuthenticated, user: !!user });
    
    // Only proceed if authentication is complete
    if (!isLoading && isAuthenticated && user) {
      console.log('✅ User authenticated, loading driveways...');
      
      const defaultLocation = {
        lat: 40.7178,
        lng: -74.0431
      };
      setUserLocation(defaultLocation);
      
      // Load driveways after authentication is confirmed
      loadDriveways(defaultLocation.lat, defaultLocation.lng);
      setIsInitialized(true);
    } else if (!isLoading && !isAuthenticated) {
      console.log('❌ User not authenticated, skipping driveway load');
      setIsInitialized(true);
    }
  }, [isLoading, isAuthenticated, user]); // Depend on auth state

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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Search & Results Panel */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Search Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Find Parking</h2>
                <p className="text-gray-600">Search functionality will be restored after fixing the initialization issue.</p>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Driveways</h3>
                {isLoadingDriveways ? (
                  <div className="text-center py-8">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading driveways...</p>
                  </div>
                ) : driveways.length > 0 ? (
                  <div className="space-y-3">
                    {driveways.slice(0, 5).map((driveway) => (
                      <div key={driveway.id} className="p-3 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-800">{driveway.address}</h4>
                        <p className="text-sm text-gray-600">${driveway.pricePerHour}/hour</p>
                      </div>
                    ))}
                    {driveways.length > 5 && (
                      <p className="text-sm text-gray-500">... and {driveways.length - 5} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No driveways found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full min-h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Map View</h3>
                <p className="text-gray-600">Map functionality will be restored after fixing the initialization issue.</p>
                <p className="text-sm text-gray-500 mt-2">Found {driveways.length} driveways</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkwayInterface;