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
        <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Dropoff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Available Parking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Limited Availability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200" ref={mapRef}>
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {mapLoaded && (
          <div className="relative h-full bg-gradient-to-br from-green-100 to-blue-100">
            {/* Mock map content with geographical context */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
              {/* Roads and highways */}
              <div className="absolute top-1/4 left-0 w-full h-2 bg-gray-600 transform -rotate-12">
                <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-xs font-bold text-white bg-gray-600 px-2 py-1 rounded">I-95</div>
              </div>
              <div className="absolute top-3/4 right-0 w-full h-2 bg-gray-600 transform rotate-12">
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-xs font-bold text-white bg-gray-600 px-2 py-1 rounded">I-495</div>
              </div>
              <div className="absolute top-1/2 left-1/4 w-32 h-1 bg-gray-500 transform rotate-45">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 bg-white px-1 py-0.5 rounded">TONNELLE AVE</div>
              </div>
              <div className="absolute top-1/3 right-1/4 w-24 h-1 bg-gray-500 transform -rotate-45">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 bg-white px-1 py-0.5 rounded">BERGENLINE AVE</div>
              </div>
              <div className="absolute bottom-1/4 left-1/3 w-20 h-1 bg-gray-500 transform rotate-12">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 bg-white px-1 py-0.5 rounded">SECAUCUS RD</div>
              </div>

              {/* Streets */}
              <div className="absolute top-1/6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded shadow-sm">LINCOLN</div>
              <div className="absolute top-2/3 left-1/6 transform -translate-x-1/2 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded shadow-sm">WESTSIDE AVE</div>
              <div className="absolute bottom-1/6 right-1/3 transform translate-x-1/2 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded shadow-sm">TURNPIKE N</div>

              {/* Points of Interest */}
              <div className="absolute top-1/5 left-1/4 flex flex-col items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-lg mb-1">🍴</div>
                <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">Outback Steakhouse</div>
              </div>
              <div className="absolute top-1/3 right-1/5 flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg mb-1">🏥</div>
                <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">Optima Care</div>
              </div>
              <div className="absolute bottom-1/3 left-1/5 flex flex-col items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-lg mb-1">🍔</div>
                <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">McDonald's</div>
              </div>
              <div className="absolute bottom-1/5 right-1/3 flex flex-col items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg mb-1">🏥</div>
                <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">Manhattanview Healthcare</div>
              </div>

              {/* User Location */}
              {userLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse mb-1"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm mt-1">You are here</div>
                </div>
              )}

              {/* Pickup Location */}
              {searchData?.pickupCoordinates && (
                <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">Pickup</div>
                </div>
              )}

              {/* Dropoff Location */}
              {searchData?.dropoffCoordinates && (
                <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-lg mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">Dropoff</div>
                </div>
              )}

              {/* Driveway Markers */}
              {driveways.map((driveway, index) => {
                const availability = getAvailabilityStatus(driveway);
                const isSelected = selectedDriveway?.id === driveway.id;
                
                return (
                  <div
                    key={driveway.id}
                    className={`absolute flex flex-col items-center cursor-pointer transform transition-all duration-200 ${
                      isSelected ? 'scale-110 z-10' : 'hover:scale-105'
                    }`}
                    onClick={() => onDrivewaySelect(driveway)}
                    style={{
                      left: `${20 + (index * 8)}%`,
                      top: `${30 + (index * 5)}%`
                    }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      availability.status === 'available' ? 'bg-green-500' :
                      availability.status === 'opens-later' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <path d="M9 9h6v6H9z"/>
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded mt-1 shadow-sm">
                      {formatPrice(driveway.pricePerHour)}
                    </div>
                    {isSelected && (
                      <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20">
                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 mb-1">{driveway.address}</h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill={i < Math.floor(driveway.rating || 4.5) ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-yellow-400"
                              >
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                              </svg>
                            ))}
                            <span className="text-sm text-gray-600 ml-1">{driveway.rating || 4.5}</span>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Distance:</span>
                            <span className="font-medium">{formatDistance(driveway.distance)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium" style={{ color: availability.color }}>
                              {availability.text}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium">{formatPrice(driveway.pricePerHour)}</span>
                          </div>
                        </div>
                        <button className="btn btn-primary w-full" onClick={() => onDrivewaySelect(driveway)}>
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
