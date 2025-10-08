import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  pricePerHour: number;
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  images: string[];
  amenities: string[];
}

interface MapViewProps {
  driveways: Driveway[];
  userLocation?: {
    lat: number;
    lng: number;
  };
  onDrivewaySelect?: (driveway: Driveway) => void;
  selectedDriveway?: Driveway | null;
}

// Component to center map on user location
function MapCenter({ userLocation }: { userLocation?: { lat: number; lng: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation, map]);
  
  return null;
}

const MapView: React.FC<MapViewProps> = ({ 
  driveways, 
  userLocation, 
  onDrivewaySelect, 
  selectedDriveway 
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7178, -74.0431]); // Default to Jersey City

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (driveways.length > 0 && driveways[0].coordinates) {
      setMapCenter([driveways[0].coordinates.lat, driveways[0].coordinates.lng]);
    }
  }, [userLocation, driveways]);

  const handleMarkerClick = (driveway: Driveway) => {
    if (onDrivewaySelect) {
      onDrivewaySelect(driveway);
    }
  };

  return (
    <div className="map-container" style={{ height: '400px', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div>
                <strong>Your Location</strong>
                <br />
                <small>Current position</small>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Driveway markers */}
        {driveways.map((driveway) => {
          if (!driveway.coordinates) return null;
          
          return (
            <Marker
              key={driveway.id}
              position={[driveway.coordinates.lat, driveway.coordinates.lng]}
              eventHandlers={{
                click: () => handleMarkerClick(driveway),
              }}
            >
              <Popup>
                <div className="driveway-popup">
                  <h4>{driveway.address}</h4>
                  <p>{driveway.description}</p>
                  <div className="popup-details">
                    <div className="popup-price">
                      <strong>${driveway.pricePerHour}/hour</strong>
                    </div>
                    {driveway.distance && (
                      <div className="popup-distance">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {driveway.distance}m away
                      </div>
                    )}
                    {driveway.amenities.length > 0 && (
                      <div className="popup-amenities">
                        <small>Amenities: {driveway.amenities.join(', ')}</small>
                      </div>
                    )}
                  </div>
                  {onDrivewaySelect && (
                    <button 
                      className="popup-book-btn"
                      onClick={() => handleMarkerClick(driveway)}
                    >
                      Book This Driveway
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapCenter userLocation={userLocation} />
      </MapContainer>
      
      <style jsx>{`
        .driveway-popup {
          min-width: 200px;
        }
        
        .popup-details {
          margin: 8px 0;
        }
        
        .popup-price {
          color: #4CAF50;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .popup-distance {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .popup-amenities {
          color: #888;
          font-size: 12px;
          margin-bottom: 8px;
        }
        
        .popup-book-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          width: 100%;
        }
        
        .popup-book-btn:hover {
          background: #45a049;
        }
      `}</style>
    </div>
  );
};

export default MapView;
