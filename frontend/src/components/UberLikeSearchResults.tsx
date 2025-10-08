import React, { useState } from 'react';
import EnhancedMapView from './EnhancedMapView';
import './UberLikeSearchResults.css';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
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
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface UberLikeSearchResultsProps {
  driveways: Driveway[];
  userLocation: UserLocation | null;
  onDrivewaySelect: (driveway: Driveway) => void;
  selectedDriveway: Driveway | null;
  isLoading?: boolean;
  error?: string | null;
}

const UberLikeSearchResults: React.FC<UberLikeSearchResultsProps> = ({
  driveways,
  userLocation,
  onDrivewaySelect,
  selectedDriveway,
  isLoading = false,
  error = null
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  // Sort driveways based on selected criteria
  const sortedDriveways = [...driveways].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'price':
        return a.pricePerHour - b.pricePerHour;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const formatDistance = (distance?: number) => {
    if (!distance) return 'N/A';
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatPrice = (price: number) => {
    return `$${price}/hr`;
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
      <div className="uber-search-loading">
        <div className="loading-spinner"></div>
        <p>Finding the best parking spots for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uber-search-error">
        <div className="error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button className="retry-btn">Try Again</button>
      </div>
    );
  }

  if (driveways.length === 0) {
    return (
      <div className="uber-search-empty">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h3>No parking spots found</h3>
        <p>Try adjusting your search location or check back later for new listings.</p>
      </div>
    );
  }

  return (
    <div className="uber-search-results">
      {/* Header with controls */}
      <div className="search-results-header">
        <div className="results-info">
          <h2>{driveways.length} parking spots found</h2>
          <p>Sorted by {sortBy === 'distance' ? 'distance' : sortBy === 'price' ? 'price' : 'rating'}</p>
        </div>
        
        <div className="search-controls">
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'rating')}
              className="sort-select"
            >
              <option value="distance">Distance</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
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
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              aria-label="Map view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              aria-label="Split view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18"/>
                <rect x="14" y="3" width="7" height="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className={`search-results-content ${viewMode}`}>
        {/* List/Table View */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className="driveways-list">
            <div className="list-header">
              <div className="header-cell">Location</div>
              <div className="header-cell">Distance</div>
              <div className="header-cell">Price</div>
              <div className="header-cell">Rating</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Action</div>
            </div>
            
            <div className="list-body">
              {sortedDriveways.map((driveway) => {
                const availability = getAvailabilityStatus(driveway);
                return (
                  <div 
                    key={driveway.id} 
                    className={`driveway-row ${selectedDriveway?.id === driveway.id ? 'selected' : ''}`}
                    onClick={() => onDrivewaySelect(driveway)}
                  >
                    <div className="cell location-cell">
                      <div className="location-info">
                        <h4 className="address">{driveway.address}</h4>
                        <p className="description">{driveway.description}</p>
                        <div className="features">
                          {(driveway.features || driveway.amenities || []).slice(0, 2).map((feature, index) => (
                            <span key={index} className="feature-tag">{feature}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="cell distance-cell">
                      <div className="distance-info">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{formatDistance(driveway.distance)}</span>
                      </div>
                    </div>
                    
                    <div className="cell price-cell">
                      <div className="price-info">
                        <span className="price">{formatPrice(driveway.pricePerHour)}</span>
                        <span className="price-label">per hour</span>
                      </div>
                    </div>
                    
                    <div className="cell rating-cell">
                      <div className="rating-info">
                        <div className="stars">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill={i < Math.floor(driveway.rating || 4.5) ? "currentColor" : "none"} 
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                            </svg>
                          ))}
                        </div>
                        <span className="rating-text">{driveway.rating || 4.5}</span>
                      </div>
                    </div>
                    
                    <div className="cell status-cell">
                      <div 
                        className="status-badge" 
                        style={{ backgroundColor: availability.color }}
                      >
                        {availability.text}
                      </div>
                    </div>
                    
                    <div className="cell action-cell">
                      <button 
                        className="book-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrivewaySelect(driveway);
                        }}
                        disabled={availability.status === 'closed'}
                      >
                        {availability.status === 'closed' ? 'Closed' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && userLocation && (
          <div className="map-container">
            <EnhancedMapView
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

export default UberLikeSearchResults;
