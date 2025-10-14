import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RealMapView.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  availability?: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  isAvailable?: boolean;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface RealMapViewProps {
  driveways: Driveway[];
  userLocation: UserLocation | null;
  onDrivewaySelect: (driveway: Driveway) => void;
  selectedDriveway: Driveway | null;
}

// Enhanced custom icons with professional SVG indicators
const createCustomIcon = (color: string, iconType: 'parking' | 'user' | 'pickup' | 'dropoff', status?: string, isSelected?: boolean) => {
  const iconMap = {
    parking: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`,
    user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z"/>
    </svg>`,
    pickup: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5M19.5 9.5H18V14H19.5V9.5M6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5M20 8L23 12V17H21A3 3 0 0 1 18 20A3 3 0 0 1 15 17H9A3 3 0 0 1 6 20A3 3 0 0 1 3 17H1V12L4 8H20M12 6.5H6V14H12V6.5Z"/>
    </svg>`,
    dropoff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
    </svg>`
  };

  // Different colors based on parking status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return '#00D4AA'; // Green
      case 'opens-later': return '#FFB800'; // Yellow
      case 'closed': return '#E53E3E'; // Red
      default: return color;
    }
  };

  const statusColor = getStatusColor(status);
  // Make available slots more prominent
  const isAvailable = status === 'available';
  const markerSize = isSelected ? 50 : (isAvailable ? 45 : 40);
  const pulseSize = isSelected ? 70 : (isAvailable ? 65 : 60);

  return L.divIcon({
    className: `custom-marker ${isSelected ? 'selected' : ''} ${isAvailable ? 'available-slot' : ''}`,
    html: `
      <div class="marker-container ${iconType} ${isSelected ? 'selected' : ''} ${isAvailable ? 'available-slot' : ''}" style="background-color: ${statusColor}; width: ${markerSize}px; height: ${markerSize}px;">
        <div class="marker-icon" style="width: ${isSelected ? '22px' : (isAvailable ? '20px' : '18px')}; height: ${isSelected ? '22px' : (isAvailable ? '20px' : '18px')}; color: white;">${iconMap[iconType]}</div>
        ${isAvailable ? '<div class="available-pulse" style="width: ' + pulseSize + 'px; height: ' + pulseSize + 'px;"></div>' : ''}
        ${status ? `<div class="status-indicator ${status}"></div>` : ''}
        ${isSelected ? '<div class="selection-ring"></div>' : ''}
        ${isAvailable ? '<div class="available-ring"></div>' : ''}
        <div class="marker-shadow"></div>
      </div>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize / 2]
  });
};

// Component to handle map updates
const MapUpdater: React.FC<{ driveways: Driveway[]; userLocation: UserLocation | null }> = ({ 
  driveways, 
  userLocation 
}) => {
  const map = useMap();

  useEffect(() => {
    if (driveways.length > 0 || userLocation) {
      const bounds = L.latLngBounds();
      let hasBounds = false;
      
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
        hasBounds = true;
      }
      
      driveways.forEach(driveway => {
        if (driveway.coordinates) {
          bounds.extend([driveway.coordinates.lat, driveway.coordinates.lng]);
          hasBounds = true;
        }
      });
      
      if (hasBounds) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [driveways, userLocation, map]);

  return null;
};

// Component to handle map focusing on selected driveway
const MapFocus: React.FC<{
  selectedDriveway: Driveway | null;
}> = ({ selectedDriveway }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedDriveway && selectedDriveway.coordinates) {
      const { lat, lng } = selectedDriveway.coordinates;
      map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedDriveway, map]);

  return null;
};

const RealMapView: React.FC<RealMapViewProps> = ({
  driveways,
  userLocation,
  onDrivewaySelect,
  selectedDriveway
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Calculate dynamic height based on number of results
  const getMapHeight = () => {
    const baseHeight = 300;
    const maxHeight = window.innerHeight * 0.7; // 70% of viewport height
    const resultCount = driveways.length;
    
    if (resultCount === 0) return baseHeight;
    if (resultCount <= 3) return Math.min(400, maxHeight);
    if (resultCount <= 6) return Math.min(500, maxHeight);
    if (resultCount <= 10) return Math.min(600, maxHeight);
    return Math.min(700, maxHeight);
  };

  const formatPrice = (price: number | string | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === undefined) {
      return '$0.00/hr';
    }
    return `$${numPrice.toFixed(2)}/hr`;
  };

  const formatDistance = (distanceInMeters: number | undefined) => {
    if (distanceInMeters === undefined) return 'N/A';
    if (distanceInMeters < 1000) {
      return `${distanceInMeters}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  };

  const getAvailabilityStatus = (driveway: Driveway) => {
    console.log('getAvailabilityStatus called for:', driveway.address, {
      isAvailable: driveway.isAvailable,
      availability: driveway.availability
    });
    
    // Check if driveway is globally available
    if (driveway.isAvailable === false) {
      console.log('Driveway globally unavailable');
      return { 
        status: 'closed', 
        text: 'Unavailable', 
        color: '#E53E3E',
        isAvailable: false,
        priority: 'low'
      };
    }

    // Check day-specific availability
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[now.getDay()];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    console.log('Current day:', currentDayName, 'Current time:', currentTime);
    
    // Find today's availability
    const todayAvailability = driveway.availability?.find(day => 
      day.dayOfWeek.toLowerCase() === currentDayName
    );
    
    console.log('Today availability:', todayAvailability);
    
    if (!todayAvailability || !todayAvailability.isAvailable) {
      console.log('No availability for today or not available');
      return { 
        status: 'closed', 
        text: 'Closed Today', 
        color: '#E53E3E',
        isAvailable: false,
        priority: 'low'
      };
    }
    
    // Check if current time is within available hours
    if (currentTime >= todayAvailability.startTime && currentTime <= todayAvailability.endTime) {
      console.log('Available now!');
      return { 
        status: 'available', 
        text: 'Available Now', 
        color: '#00D4AA',
        isAvailable: true,
        priority: 'high'
      };
    } else if (currentTime < todayAvailability.startTime) {
      console.log('Opens later');
      return { 
        status: 'opens-later', 
        text: `Opens at ${todayAvailability.startTime}`, 
        color: '#FFB800',
        isAvailable: false,
        priority: 'medium'
      };
    } else {
      console.log('Closed for today');
      return { 
        status: 'closed', 
        text: 'Closed for Today', 
        color: '#E53E3E',
        isAvailable: false,
        priority: 'low'
      };
    }
  };

  // Default center (Jersey City area based on your coordinates)
  const defaultCenter: [number, number] = [40.7178, -74.0431];
  const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultCenter;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
              <span>Available Now</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-sm"></div>
              <span>Opens Later</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
              <span>Closed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" style={{ height: `${getMapHeight()}px` }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => setMapLoaded(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater driveways={driveways} userLocation={userLocation} />
          <MapFocus selectedDriveway={selectedDriveway} />
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createCustomIcon('#276EF1', 'user')}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 mb-1">Your Location</h4>
                  <p className="text-sm text-gray-600">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Enhanced Driveway Markers */}
          {driveways.map((driveway) => {
            // If no coordinates, generate some based on the center with some offset
            let coordinates = driveway.coordinates;
            if (!coordinates) {
              // Generate coordinates around the center with some random offset
              const offsetLat = (Math.random() - 0.5) * 0.01; // ~500m offset
              const offsetLng = (Math.random() - 0.5) * 0.01;
              coordinates = {
                lat: center[0] + offsetLat,
                lng: center[1] + offsetLng
              };
            }
            
            const availability = getAvailabilityStatus(driveway);
            const isSelected = selectedDriveway?.id === driveway.id;
            const markerColor = availability.color;
            
            // Debug logging
            console.log('Driveway:', driveway.address, {
              availability: driveway.availability,
              isAvailable: driveway.isAvailable,
              status: availability.status,
              color: availability.color,
              availabilityIsAvailable: availability.isAvailable
            });
            
            return (
              <Marker
                key={driveway.id}
                position={[coordinates.lat, coordinates.lng]}
                icon={createCustomIcon(markerColor, 'parking', availability.status, isSelected)}
                eventHandlers={{
                  click: () => {
                    onDrivewaySelect(driveway);
                    // Scroll to the corresponding list item
                    const listItem = document.querySelector(`[data-driveway-id="${driveway.id}"]`);
                    if (listItem) {
                      listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
              >
                <Popup>
                  <div className="p-4 min-w-[250px]">
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{driveway.address}</h4>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`star ${i < Math.floor(driveway.rating || 4.5) ? 'filled' : ''}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                            </svg>
                          </span>
                        ))}
                        <span className="rating-value text-sm text-gray-600">{driveway.rating || 4.5}</span>
                      </div>
                      
                      {/* Availability Status Badge */}
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        availability.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : availability.status === 'opens-later'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          availability.isAvailable ? 'bg-green-500' : availability.status === 'opens-later' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        {availability.text}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-semibold text-green-600 text-lg">{formatPrice(driveway.pricePerHour)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium text-gray-900">{formatDistance(driveway.distance)}</span>
                      </div>
                      {driveway.amenities && driveway.amenities.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Amenities:</span>
                          <span className="font-medium text-gray-900 text-xs">{driveway.amenities.slice(0, 2).join(', ')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {availability.isAvailable ? (
                        <button 
                          className="w-full px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                          onClick={() => onDrivewaySelect(driveway)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          Book This Spot
                        </button>
                      ) : (
                        <button 
                          className="w-full px-4 py-3 bg-gray-400 text-white text-sm font-semibold rounded-lg cursor-not-allowed"
                          disabled
                        >
                          {availability.status === 'opens-later' ? 'Opens Later' : 'Currently Closed'}
                        </button>
                      )}
                      
                      <button 
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${driveway.coordinates?.lat},${driveway.coordinates?.lng}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Get Directions
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="map-footer">
        <div className="map-info">
          <span>Showing {driveways.length} parking spots</span>
          {userLocation && <span>• Your location detected</span>}
        </div>
        
        {/* Map Legend */}
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-marker available">
              <div className="marker-dot" style={{ backgroundColor: '#00D4AA' }}></div>
            </div>
            <span>Available Now</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker">
              <div className="marker-dot" style={{ backgroundColor: '#FFB800' }}></div>
            </div>
            <span>Opens Later</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker">
              <div className="marker-dot" style={{ backgroundColor: '#E53E3E' }}></div>
            </div>
            <span>Closed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealMapView;
