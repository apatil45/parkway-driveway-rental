import React, { useEffect, useRef, useState } from 'react';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
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

interface EnhancedMapViewProps {
  driveways: Driveway[];
  userLocation: UserLocation | null;
  onDrivewaySelect: (driveway: Driveway) => void;
  selectedDriveway: Driveway | null;
  searchData?: {
    pickupLocation: string;
    dropoffLocation: string;
    pickupCoordinates?: { lat: number; lng: number };
    dropoffCoordinates?: { lat: number; lng: number };
  };
}

const EnhancedMapView: React.FC<EnhancedMapViewProps> = ({
  driveways,
  userLocation,
  onDrivewaySelect,
  selectedDriveway,
  searchData
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize map (mock implementation - in production use Google Maps, Mapbox, etc.)
    if (mapRef.current && !mapLoaded) {
      initializeMap();
    }
  }, [mapLoaded]);

  const initializeMap = () => {
    try {
      // Mock map initialization
      // In production, this would initialize a real map service
      setMapLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to load map');
    }
  };

  const formatDistance = (distanceInMeters: number | undefined) => {
    if (distanceInMeters === undefined) return 'N/A';
    if (distanceInMeters < 1000) {
      return `${distanceInMeters}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
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

  if (mapError) {
    return (
      <div className="enhanced-map-container">
        <div className="map-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Map Unavailable</h3>
          <p>{mapError}</p>
          <button onClick={() => setMapError(null)} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-map-container">
      {/* Map Header */}
      <div className="map-header">
        <div className="map-controls">
          <button className="map-control-btn" aria-label="Zoom in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button className="map-control-btn" aria-label="Zoom out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-marker pickup-marker"></div>
            <span>Pickup</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker dropoff-marker"></div>
            <span>Dropoff</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker driveway-marker"></div>
            <span>Parking</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="map-area" ref={mapRef}>
        {!mapLoaded && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading map...</p>
          </div>
        )}

        {mapLoaded && (
          <div className="mock-map">
            {/* Mock map content with geographical context */}
            <div className="map-background">
              {/* Roads and highways */}
              <div className="road i95">
                <div className="road-label">I-95</div>
              </div>
              <div className="road i495">
                <div className="road-label">I-495</div>
              </div>
              <div className="road tonnelle">
                <div className="road-label">TONNELLE AVE</div>
              </div>
              <div className="road bergenline">
                <div className="road-label">BERGENLINE AVE</div>
              </div>
              <div className="road secaucus">
                <div className="road-label">SECAUCUS RD</div>
              </div>

              {/* Streets */}
              <div className="street lincoln">LINCOLN</div>
              <div className="street westside">WESTSIDE AVE</div>
              <div className="street turnpike">TURNPIKE N</div>

              {/* Points of Interest */}
              <div className="poi restaurant outback">
                <div className="poi-icon">🍴</div>
                <div className="poi-label">Outback Steakhouse</div>
              </div>
              <div className="poi healthcare optima">
                <div className="poi-icon">🏥</div>
                <div className="poi-label">Optima Care</div>
              </div>
              <div className="poi restaurant mcdonalds">
                <div className="poi-icon">🍔</div>
                <div className="poi-label">McDonald's</div>
              </div>
              <div className="poi healthcare manhattanview">
                <div className="poi-icon">🏥</div>
                <div className="poi-label">Manhattanview Healthcare</div>
              </div>

              {/* User Location */}
              {userLocation && (
                <div className="user-location-marker">
                  <div className="location-pulse"></div>
                  <div className="location-dot"></div>
                </div>
              )}

              {/* Pickup Location */}
              {searchData?.pickupCoordinates && (
                <div className="pickup-marker">
                  <div className="marker-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Dropoff Location */}
              {searchData?.dropoffCoordinates && (
                <div className="dropoff-marker">
                  <div className="marker-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Driveway Markers */}
              {driveways.map((driveway, index) => {
                const availability = getAvailabilityStatus(driveway);
                const isSelected = selectedDriveway?.id === driveway.id;
                
                return (
                  <div
                    key={driveway.id}
                    className={`driveway-marker ${isSelected ? 'selected' : ''} ${availability.status}`}
                    onClick={() => onDrivewaySelect(driveway)}
                    style={{
                      left: `${20 + (index * 8)}%`,
                      top: `${30 + (index * 5)}%`
                    }}
                  >
                    <div className="marker-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <path d="M9 9h6v6H9z"/>
                      </svg>
                    </div>
                    <div className="marker-price">{formatPrice(driveway.pricePerHour)}</div>
                    {isSelected && (
                      <div className="marker-popup">
                        <div className="popup-header">
                          <h4>{driveway.address}</h4>
                          <div className="popup-rating">
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
                            <span>{driveway.rating || 4.5}</span>
                          </div>
                        </div>
                        <div className="popup-details">
                          <div className="detail-item">
                            <span className="detail-label">Distance:</span>
                            <span className="detail-value">{formatDistance(driveway.distance)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value" style={{ color: availability.color }}>
                              {availability.text}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Price:</span>
                            <span className="detail-value">{formatPrice(driveway.pricePerHour)}</span>
                          </div>
                        </div>
                        <button className="popup-book-btn" onClick={() => onDrivewaySelect(driveway)}>
                          Book Now
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map Footer */}
      <div className="map-footer">
        <div className="map-info">
          <span>Showing {driveways.length} parking spots</span>
          {userLocation && (
            <span>• Your location detected</span>
          )}
        </div>
        <div className="map-actions">
          <button className="map-action-btn" aria-label="Center on user location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
            My Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapView;
