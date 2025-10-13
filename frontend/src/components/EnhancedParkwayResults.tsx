import React, { useState, useEffect, useRef } from 'react';
import RealMapView from './RealMapView';
import { getESTTime, getCurrentDayOfWeek, formatTimeForAvailability } from '../utils/timeUtils';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number | string;
  images: string[];
  rating: number;
  distance?: number;
  isAvailable?: boolean;
  owner?: {
    name: string;
    rating: number;
  };
  features?: string[];
  amenities?: string[];
  availability?: {
    startTime: string;
    endTime: string;
  } | Array<{
    dayOfWeek: string;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
  }>;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface EnhancedParkwayResultsProps {
  driveways: Driveway[];
  userLocation: UserLocation | null;
  onDrivewaySelect: (driveway: Driveway) => void;
  onDrivewayFocus: (driveway: Driveway) => void;
  selectedDriveway: Driveway | null;
  isLoading: boolean;
  error: string | null;
}

const EnhancedParkwayResults: React.FC<EnhancedParkwayResultsProps> = ({
  driveways,
  userLocation,
  onDrivewaySelect,
  onDrivewayFocus,
  selectedDriveway,
  isLoading,
  error,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [listExpanded, setListExpanded] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  const listRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Auto-expand list when driveway is selected
  useEffect(() => {
    if (selectedDriveway && viewMode === 'split') {
      setListExpanded(true);
      setMapExpanded(false);
    }
  }, [selectedDriveway, viewMode]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const getDrivewayDistance = (driveway: Driveway) => {
    if (!userLocation || !driveway.coordinates) {
      return undefined;
    }
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      driveway.coordinates.lat,
      driveway.coordinates.lng
    );
  };

  const sortedDriveways = [...driveways].sort((a, b) => {
    if (sortBy === 'distance') {
      const distanceA = getDrivewayDistance(a) || Infinity;
      const distanceB = getDrivewayDistance(b) || Infinity;
      return distanceA - distanceB;
    } else if (sortBy === 'price') {
      const priceA = typeof a.pricePerHour === 'string' ? parseFloat(a.pricePerHour) : a.pricePerHour;
      const priceB = typeof b.pricePerHour === 'string' ? parseFloat(b.pricePerHour) : b.pricePerHour;
      return (priceA || 0) - (priceB || 0);
    } else { // rating
      return (b.rating || 0) - (a.rating || 0);
    }
  });

  const filteredDriveways = sortedDriveways.filter(driveway => {
    const price = typeof driveway.pricePerHour === 'string' ? parseFloat(driveway.pricePerHour) : driveway.pricePerHour;
    const priceMatch = price >= priceRange[0] && price <= priceRange[1];
    
    const amenitiesMatch = selectedAmenities.length === 0 || 
      selectedAmenities.every(amenity => 
        (driveway.amenities || []).includes(amenity) || 
        (driveway.features || []).includes(amenity)
      );
    
    return priceMatch && amenitiesMatch;
  });

  const formatDistance = (distanceInMeters: number | undefined) => {
    if (distanceInMeters === undefined || distanceInMeters === null) return 'N/A';
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  };

  const formatPrice = (price: number | string | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === undefined) {
      return '$0.00/hr';
    }
    return `$${numPrice.toFixed(2)}/hr`;
  };

  const getAvailabilityStatus = (driveway: Driveway) => {
    // Check if driveway has isAvailable flag
    if (driveway.isAvailable === false) {
      return { status: 'closed', text: 'Closed', color: '#E53E3E' };
    }

    // If availability is an array (day-specific), check current day
    if (Array.isArray(driveway.availability)) {
      const today = getCurrentDayOfWeek();
      const todayAvailability = driveway.availability.find(day => day.dayOfWeek === today);
      
      if (todayAvailability && todayAvailability.isAvailable) {
        const now = getESTTime();
        const currentTimeStr = formatTimeForAvailability(now);
        const startTime = new Date(`2000-01-01T${todayAvailability.startTime}`);
        const endTime = new Date(`2000-01-01T${todayAvailability.endTime}`);
        const currentTime = new Date(`2000-01-01T${currentTimeStr}`);
        
        if (currentTime >= startTime && currentTime <= endTime) {
          return { status: 'available', text: 'Available Now', color: '#00D4AA' };
        } else if (currentTime < startTime) {
          return { status: 'opens-later', text: `Opens at ${todayAvailability.startTime}`, color: '#FFB800' };
        } else {
          return { status: 'closed', text: 'Closed', color: '#E53E3E' };
        }
      } else {
        return { status: 'closed', text: 'Closed', color: '#E53E3E' };
      }
    }

    // Fallback for simple availability object
    const now = getESTTime();
    const currentTimeStr = formatTimeForAvailability(now);
    const availability = driveway.availability || { startTime: '00:00', endTime: '23:59' };
    const startTime = new Date(`2000-01-01T${availability.startTime}`);
    const endTime = new Date(`2000-01-01T${availability.endTime}`);
    const currentTime = new Date(`2000-01-01T${currentTimeStr}`);
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'available', text: 'Available Now', color: '#00D4AA' };
    } else if (currentTime < startTime) {
      return { status: 'opens-later', text: `Opens at ${availability.startTime}`, color: '#FFB800' };
    } else {
      return { status: 'closed', text: 'Closed', color: '#E53E3E' };
    }
  };

  const handleViewModeChange = (mode: 'list' | 'map' | 'split') => {
    setViewMode(mode);
    if (mode === 'list') {
      setListExpanded(true);
      setMapExpanded(false);
    } else if (mode === 'map') {
      setListExpanded(false);
      setMapExpanded(true);
    } else {
      setListExpanded(false);
      setMapExpanded(false);
    }
  };

  const handleMapFocus = (driveway: Driveway) => {
    // Focus on map and select the driveway for map highlighting (without opening booking modal)
    onDrivewayFocus(driveway);
    // Switch to split view and expand map if not already
    if (viewMode !== 'split') {
      handleViewModeChange('split');
    }
    setMapExpanded(true);
    setListExpanded(false);
  };

  const handleBooking = (driveway: Driveway) => {
    // This will open the booking modal
    onDrivewaySelect(driveway);
  };

  const toggleListExpansion = () => {
    if (viewMode === 'split') {
      setListExpanded(!listExpanded);
      setMapExpanded(false);
    }
  };

  const toggleMapExpansion = () => {
    if (viewMode === 'split') {
      setMapExpanded(!mapExpanded);
      setListExpanded(false);
    }
  };

  if (isLoading) {
    return (
      <div className="enhanced-parkway-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Finding parking spots near you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-parkway-error">
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (driveways.length === 0) {
    return (
      <div className="enhanced-parkway-no-results">
        <div className="no-results-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <h3>No parking spots found</h3>
          <p>Try adjusting your search criteria or expanding your search radius.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-parkway-results ${viewMode}-view ${listExpanded ? 'list-expanded' : ''} ${mapExpanded ? 'map-expanded' : ''}`}>
      {/* Header with Controls */}
      <div className="results-header">
        <div className="header-left">
          <h2 className="results-title">
            {filteredDriveways.length} parking spot{filteredDriveways.length !== 1 ? 's' : ''} found
          </h2>
          <div className="results-subtitle">
            {userLocation && (
              <span className="location-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Your location detected
              </span>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          <button 
            className={`filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
            </svg>
            Filters
          </button>
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => handleViewModeChange('list')}
              aria-label="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button 
              className={viewMode === 'split' ? 'active' : ''} 
              onClick={() => handleViewModeChange('split')}
              aria-label="Split view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="12" y1="3" x2="12" y2="21"/>
              </svg>
            </button>
            <button 
              className={viewMode === 'map' ? 'active' : ''} 
              onClick={() => handleViewModeChange('map')}
              aria-label="Map view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-range">
              <input
                type="range"
                min="0"
                max="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              />
              <span>${priceRange[0]} - ${priceRange[1]}/hr</span>
            </div>
          </div>
          
          <div className="filter-group">
            <label>Sort by</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'rating')}
            >
              <option value="distance">Distance</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="results-content">
        {/* List Panel */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div 
            ref={listRef}
            className={`list-panel ${listExpanded ? 'expanded' : ''}`}
          >
            <div className="list-header">
              <h3>Available Spots</h3>
              {viewMode === 'split' && (
                <button 
                  className="expand-button"
                  onClick={toggleListExpansion}
                  aria-label={listExpanded ? 'Collapse list' : 'Expand list'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {listExpanded ? (
                      <polyline points="18,15 12,9 6,15"/>
                    ) : (
                      <polyline points="6,9 12,15 18,9"/>
                    )}
                  </svg>
                </button>
              )}
            </div>
            
            <div className="parking-spots-list">
              {filteredDriveways.map((driveway) => {
                const availability = getAvailabilityStatus(driveway);
                const isSelected = selectedDriveway?.id === driveway.id;
                return (
                  <div 
                    key={driveway.id} 
                    className={`parking-spot-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleMapFocus(driveway)}
                  >
                    <div className="spot-image">
                      {driveway.images && driveway.images.length > 0 ? (
                        <img src={driveway.images[0]} alt={driveway.address} />
                      ) : (
                        <div className="placeholder-image">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="spot-info">
                      <div className="spot-header">
                        <h4 className="spot-address">{driveway.address}</h4>
                        <div className="spot-rating">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                          </svg>
                          <span>{(driveway.rating || 4.5).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="spot-details">
                        <span className="distance">{formatDistance(getDrivewayDistance(driveway))}</span>
                        <span className="availability" style={{ color: availability.color }}>
                          {availability.text}
                        </span>
                      </div>
                      
                      <div className="spot-footer">
                        <span className="price">{formatPrice(driveway.pricePerHour)}</span>
                        <button 
                          className="book-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBooking(driveway);
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Map Panel */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div 
            ref={mapRef}
            className={`map-panel ${mapExpanded ? 'expanded' : ''}`}
          >
            <div className="map-header">
              <h3>Map View</h3>
              {viewMode === 'split' && (
                <button 
                  className="expand-button"
                  onClick={toggleMapExpansion}
                  aria-label={mapExpanded ? 'Collapse map' : 'Expand map'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {mapExpanded ? (
                      <polyline points="18,15 12,9 6,15"/>
                    ) : (
                      <polyline points="6,9 12,15 18,9"/>
                    )}
                  </svg>
                </button>
              )}
            </div>
            
            <div className="map-container">
              <RealMapView
                driveways={filteredDriveways}
                userLocation={userLocation}
                onDrivewaySelect={onDrivewayFocus}
                selectedDriveway={selectedDriveway}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedParkwayResults;
