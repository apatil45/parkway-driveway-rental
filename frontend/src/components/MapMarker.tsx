import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Driveway, UserLocation, AvailabilityStatus } from '../types/map';
import { getAvailabilityStatus, formatDistance, formatPrice, ensureCoordinates, calculateWalkingTime, formatWalkingTime } from '../utils/mapUtils';

interface MapMarkerProps {
  driveway: Driveway;
  userLocation: UserLocation | null;
  selectedDriveway: Driveway | null;
  onDrivewaySelect: (driveway: Driveway, clickPosition?: { x: number; y: number }) => void;
  center: [number, number];
}

// Create minimalistic professional icon for markers
const createCustomIcon = (color: string, iconType: 'parking' | 'user', status?: string, isSelected?: boolean) => {
  const iconMap = {
    parking: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`,
    user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z"/>
    </svg>`
  };

  // Professional color scheme
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return '#10B981'; // Professional green
      case 'opens-later': return '#F59E0B'; // Professional amber
      case 'closed': return '#EF4444'; // Professional red
      default: return '#3B82F6'; // Professional blue
    }
  };

  const statusColor = getStatusColor(status);
  const isAvailable = status === 'available';
  
  // Consistent, minimalistic sizing
  const markerSize = isSelected ? 36 : 32;
  const iconSize = isSelected ? '18px' : '16px';

  return L.divIcon({
    className: `minimal-marker ${isSelected ? 'selected' : ''}`,
    html: `
      <div class="minimal-marker-container" style="
        background-color: ${statusColor}; 
        width: ${markerSize}px; 
        height: ${markerSize}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <div style="
          color: white; 
          width: ${iconSize}; 
          height: ${iconSize};
          display: flex;
          align-items: center;
          justify-content: center;
        ">${iconMap[iconType]}</div>
      </div>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize / 2]
  });
};

const MapMarker: React.FC<MapMarkerProps> = ({
  driveway,
  userLocation,
  selectedDriveway,
  onDrivewaySelect,
  center
}) => {
  // Ensure coordinates exist using the utility function
  const coordinates = ensureCoordinates(driveway, center);
  
  const availability = getAvailabilityStatus(driveway);
  const isSelected = selectedDriveway?.id === driveway.id;
  const walkingTime = calculateWalkingTime(driveway, userLocation);
  
  console.log('🎯 MapMarker rendering:', {
    address: driveway.address,
    coordinates,
    availability: availability.status,
    isSelected,
    hasCoordinates: !!(coordinates.lat && coordinates.lng)
  });

  return (
    <Marker
      key={driveway.id}
      position={[coordinates.lat, coordinates.lng]}
      icon={createCustomIcon(availability.color, 'parking', availability.status, isSelected)}
      eventHandlers={{
        click: () => {
          console.log('🖱️ Marker clicked - showing popup for:', {
            address: driveway.address,
            id: driveway.id,
            isAvailable: availability.isAvailable,
            status: availability.status
          });
          // Don't open booking modal directly - let the popup handle it
          // Just scroll to the corresponding list item
          const listItem = document.querySelector(`[data-driveway-id="${driveway.id}"]`);
          if (listItem) {
            listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }}
    >
            <Popup 
              className="custom-popup"
              closeButton={false}
              autoClose={false}
              closeOnClick={false}
            >
              <div className="p-4 min-w-[220px] relative bg-white rounded-lg shadow-lg">
                {/* Close button */}
                <button 
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Close the popup by clicking outside or using Leaflet's close method
                    const popup = e.target.closest('.leaflet-popup');
                    if (popup) {
                      popup.style.display = 'none';
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
                
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 pr-6">{driveway.address}</h4>
                  
                  {/* Minimalistic Status Badge */}
                  <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    availability.isAvailable 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : availability.status === 'opens-later'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      availability.isAvailable ? 'bg-green-500' : availability.status === 'opens-later' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    {availability.text}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-gray-900">{formatPrice(driveway.pricePerHour)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Distance</span>
                    <span className="font-medium text-gray-700">
                      {driveway.distance ? formatDistance(driveway.distance) : 'N/A'}
                    </span>
                  </div>
                  {walkingTime > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Walk time</span>
                      <span className="font-medium text-gray-700">{formatWalkingTime(walkingTime)}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {availability.isAvailable ? (
                    <button 
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      onClick={(e) => {
                        console.log('🎯 Popup "Book Now" button clicked for:', {
                          address: driveway.address,
                          id: driveway.id,
                          isAvailable: availability.isAvailable
                        });
                        
                        // Get click position relative to viewport
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickPosition = {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2
                        };
                        
                        // Pass click position to the driveway selection
                        onDrivewaySelect(driveway, clickPosition);
                      }}
                    >
                      Book Now
                    </button>
                  ) : (
                    <button 
                      className="w-full px-3 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-md cursor-not-allowed"
                      disabled
                    >
                      {availability.status === 'opens-later' ? 'Opens Later' : 'Unavailable'}
                    </button>
                  )}
                  
                  <button 
                    className="w-full px-3 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Directions
                  </button>
                </div>
              </div>
            </Popup>
    </Marker>
  );
};

export default MapMarker;
