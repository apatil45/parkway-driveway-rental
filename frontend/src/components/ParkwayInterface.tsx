import React, { useState, useEffect } from 'react';
import ParkwaySearchForm from './ParkwaySearchForm';
import ParkwaySearchResults from './ParkwaySearchResults';
import EnhancedMapView from './EnhancedMapView';
import SimpleBookingModal from './SimpleBookingModal';
import QuickActions from './QuickActions';
import './ParkwayInterface.css';

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
      
      // Handle different response formats
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
    setSelectedDriveway(driveway);
    setShowBookingModal(true);
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
    <div className="parkway-interface">
      {/* Main Content */}
      <div className="parkway-main">
        {/* Search Panel */}
        <div className="search-panel">
          <ParkwaySearchForm 
            onSearch={handleSearch}
            userLocation={userLocation}
            isLoading={isSearching}
          />
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {isSearching && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Searching for parking spots...</p>
            </div>
          )}

          {searchError && (
            <div className="error-state">
              <p>{searchError}</p>
              <button onClick={() => setSearchError(null)}>Try Again</button>
            </div>
          )}

          {!isSearching && !searchError && driveways.length > 0 && (
            <ParkwaySearchResults
              driveways={driveways}
              userLocation={userLocation}
              onDrivewaySelect={handleDrivewaySelect}
              selectedDriveway={selectedDriveway}
              isLoading={isSearching}
              error={searchError}
            />
          )}

          {!isSearching && !searchError && driveways.length === 0 && searchData && (
            <div className="no-results">
              <p>No parking spots found in this area.</p>
              <p>Try expanding your search radius or checking a different location.</p>
            </div>
          )}

          {!searchData && (
            <div className="welcome-state">
              <h2>Find Your Perfect Parking Spot</h2>
              <p>Enter your destination to discover available parking options near you.</p>
            </div>
          )}
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
