import React, { useState } from 'react';
import RealMapView from './RealMapView';
import './ParkwaySearchResults.css';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number | string;
  images: string[];
  rating: number;
  distance?: number;
  owner?: {
    name: string;
    rating: number;
  };
  features?: string[];
  amenities?: string[];
  availability?: {
    startTime: string;
    endTime: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface ParkwaySearchResultsProps {
  driveways: Driveway[];
  userLocation: UserLocation | null;
  onDrivewaySelect: (driveway: Driveway) => void;
  selectedDriveway: Driveway | null;
  isLoading: boolean;
  error: string | null;
}

const ParkwaySearchResults: React.FC<ParkwaySearchResultsProps> = ({
  driveways,
  userLocation,
  onDrivewaySelect,
  selectedDriveway,
  isLoading,
  error,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  const sortedDriveways = [...driveways].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || Infinity) - (b.distance || Infinity);
    } else if (sortBy === 'price') {
      const priceA = typeof a.pricePerHour === 'string' ? parseFloat(a.pricePerHour) : a.pricePerHour;
      const priceB = typeof b.pricePerHour === 'string' ? parseFloat(b.pricePerHour) : b.pricePerHour;
      return (priceA || 0) - (priceB || 0);
    } else { // rating
      return (b.rating || 0) - (a.rating || 0);
    }
  });

  const formatDistance = (distanceInMeters: number | undefined) => {
    if (distanceInMeters === undefined) return 'N/A';
    if (distanceInMeters < 1000) {
      return `${distanceInMeters}m`;
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
    const now = new Date();
    const availability = driveway.availability || { startTime: '06:00', endTime: '22:00' };
    const startTime = new Date(`2000-01-01T${availability.startTime}`);
    const endTime = new Date(`2000-01-01T${availability.endTime}`);
    const currentTime = new Date(`2000-01-01T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'available', text: 'Available Now', color: '#00D4AA' };
    } else if (currentTime < startTime) {
      return { status: 'opens-later', text: `Opens at ${availability.startTime}`, color: '#FFB800' };
    } else {
      return { status: 'closed', text: 'Closed', color: '#E53E3E' };
    }
  };

  if (isLoading) {
    return (
      <div className="parkway-search-loading">
        <div className="loading-spinner"></div>
        <p>Searching for parking spots...</p>
      </div>
    );
  }

  if (error) {
    return <div className="parkway-search-error">{error}</div>;
  }

  if (driveways.length === 0) {
    return <div className="parkway-search-no-results">No parking spots found matching your criteria.</div>;
  }

  return (
    <div className={`parkway-search-results ${viewMode}-view`}>
      <div className="results-header">
        <h3 className="results-title">Available Parking Spots</h3>
        <div className="view-controls">
          <button 
            className={viewMode === 'list' ? 'active' : ''} 
            onClick={() => setViewMode('list')}
            aria-label="Show list view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            List
          </button>
          <button 
            className={viewMode === 'map' ? 'active' : ''} 
            onClick={() => setViewMode('map')}
            aria-label="Show map view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            Map
          </button>
          <button 
            className={viewMode === 'split' ? 'active' : ''} 
            onClick={() => setViewMode('split')}
            aria-label="Show split view (list and map)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
            Split
          </button>
        </div>
        <div className="sort-controls">
          <label htmlFor="sort-by" className="sr-only">Sort by</label>
          <select 
            id="sort-by" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'rating')}
            aria-label="Sort parking spots by"
          >
            <option value="distance">Distance</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <div className="results-content">
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className="list-panel">
            <div className="parking-spots-list">
              {sortedDriveways.map((driveway) => {
                const availability = getAvailabilityStatus(driveway);
                const isSelected = selectedDriveway?.id === driveway.id;
                return (
                  <div 
                    key={driveway.id} 
                    className={`parking-spot-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onDrivewaySelect(driveway)}
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
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill={i < Math.floor(driveway.rating || 4.5) ? "#FFB800" : "none"}
                              stroke="#FFB800"
                              strokeWidth="2"
                            >
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                            </svg>
                          ))}
                          <span className="rating-text">{(driveway.rating || 4.5).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <p className="spot-description">{driveway.description}</p>
                      
                      <div className="spot-features">
                        {(driveway.features || driveway.amenities || []).slice(0, 3).map((feature, index) => (
                          <span key={index} className="feature-tag">{feature}</span>
                        ))}
                      </div>
                      
                      <div className="spot-footer">
                        <div className="spot-details">
                          <span className="distance">{formatDistance(driveway.distance)}</span>
                          <span className="availability" style={{ color: availability.color }}>
                            {availability.text}
                          </span>
                        </div>
                        <div className="spot-price">
                          <span className="price">{formatPrice(driveway.pricePerHour)}</span>
                          <button className="book-button">Book Now</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Scroll indicator for long lists */}
              {sortedDriveways.length > 8 && (
                <div className="scroll-indicator">
                  <span>Scroll to see more results ({sortedDriveways.length} total)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && userLocation && (
          <div className="map-panel">
            <RealMapView
              driveways={sortedDriveways}
              userLocation={userLocation}
              onDrivewaySelect={onDrivewaySelect}
              selectedDriveway={selectedDriveway}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkwaySearchResults;
