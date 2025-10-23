import React from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Driveway, UserLocation, AvailabilityStatus } from '../types/map';
import { getAvailabilityStatus, formatDistance, formatPrice, ensureCoordinates, calculateWalkingTime, formatWalkingTime } from '../utils/mapUtils';
import './EnhancedMapStyles.css';

interface MapMarkerProps {
  driveway: Driveway;
  userLocation: UserLocation | null;
  selectedDriveway: Driveway | null;
  onDrivewaySelect: (driveway: Driveway, clickPosition?: { x: number; y: number }) => void;
  center: [number, number];
}


// Create enhanced icon with price display for parking markers
const createCustomIcon = (color: string, iconType: 'parking' | 'user', status?: string, isSelected?: boolean, price?: number) => {
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

  // For parking markers, show price if available
  if (iconType === 'parking' && price !== undefined) {
    return L.divIcon({
      className: `price-marker ${isSelected ? 'selected' : ''} ${isAvailable ? 'available' : 'unavailable'}`,
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
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
            ${isAvailable ? 'animation: pulse 2s infinite;' : ''}
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
          <div style="
            background: white;
            border: 1px solid ${statusColor};
            border-radius: 6px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            color: ${statusColor};
            margin-top: 2px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            white-space: nowrap;
            min-width: 40px;
            text-align: center;
          ">
            $${price.toFixed(0)}/hr
          </div>
        </div>
      `,
      iconSize: [markerSize + 20, markerSize + 20],
      iconAnchor: [markerSize / 2 + 10, markerSize / 2 + 10],
      popupAnchor: [0, -markerSize / 2 - 10]
    });
  }
  
  // Default marker for user location
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
  const map = useMap();
  
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
      icon={createCustomIcon(availability.color, 'parking', availability.status, isSelected, Number(driveway.pricePerHour || 0))}
      eventHandlers={{
        click: () => {
          console.log('🖱️ Marker clicked - showing popup for:', {
            address: driveway.address,
            id: driveway.id,
            isAvailable: availability.isAvailable,
            status: availability.status
          });
          
          // Scroll to the corresponding list item
          const listItem = document.querySelector(`[data-driveway-id="${driveway.id}"]`);
          if (listItem) {
            listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }}
    >
            <Popup 
              className="enhanced-popup"
              closeButton={true}
              autoClose={true}
              closeOnClick={true}
            >
              <div className="popup-content">
                {/* Header */}
                <div className="popup-header">
                  <h3 className="popup-title">{driveway.address}</h3>
                </div>
                
                {/* Price and Status */}
                <div className="popup-info">
                  <div className="popup-price">
                    <span>{formatPrice(driveway.pricePerHour)}</span>
                  </div>
                  <div className={`popup-status ${availability.status.replace(' ', '-')}`}>
                    {availability.text}
                  </div>
                </div>

                {/* Details */}
                <div className="popup-details">
                  {driveway.distance && (
                    <div className="popup-detail-item">
                      <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{formatDistance(driveway.distance)} away</span>
                    </div>
                  )}
                  {walkingTime > 0 && (
                    <div className="popup-detail-item">
                      <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      <span>{formatWalkingTime(walkingTime)} walk</span>
                    </div>
                  )}
                  {driveway.rating && (
                    <div className="popup-detail-item">
                      <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <span>{driveway.rating.toFixed(1)} rating</span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="popup-actions">
                  <button 
                    className="popup-book-btn"
                    disabled={!availability.isAvailable}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                      <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                      <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                    </svg>
                    {availability.isAvailable ? 'Book Now' : (availability.status === 'opens-later' ? 'Opens Later' : 'Unavailable')}
                  </button>
                  
                  <button 
                    className="popup-directions-btn"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
                      window.open(url, '_blank');
                    }}
                    aria-label="Get directions"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
            </Popup>
    </Marker>
  );
};

export default MapMarker;
