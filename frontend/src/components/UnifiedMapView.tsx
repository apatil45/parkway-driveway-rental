import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './UnifiedMapView.css';

import { MapViewProps, UserLocation } from '../types/map';
import MapMarker from './MapMarker';
import MapLegend from './MapLegend';
import { ensureCoordinates, calculateMapBounds } from '../utils/mapUtils';
import { groupMarkersByProximity, shouldClusterMarkers, getClusterDistance } from '../utils/markerClustering';

// Fix for default markers in react-leaflet - Enhanced with clustering
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map updates and bounds
const MapUpdater: React.FC<{ 
  driveways: any[]; 
  userLocation: UserLocation | null;
  center: [number, number];
}> = ({ driveways, userLocation, center }) => {
  const map = useMap();

  useEffect(() => {
    console.log('🗺️ MapUpdater: Updating map bounds', { driveways: driveways.length, userLocation });
    
    if (driveways.length > 0 || userLocation) {
      const bounds = L.latLngBounds();
      let hasBounds = false;
      
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
        hasBounds = true;
        console.log('📍 Added user location to bounds:', userLocation);
      }
      
      driveways.forEach(driveway => {
        const coords = ensureCoordinates(driveway, center);
        bounds.extend([coords.lat, coords.lng]);
        hasBounds = true;
        console.log('🏠 Added driveway to bounds:', driveway.address, coords);
      });
      
      if (hasBounds) {
        // Use smart bounds calculation with padding
        const smartBounds = calculateMapBounds(driveways, userLocation, 0.15);
        bounds.extend(smartBounds[0]);
        bounds.extend(smartBounds[1]);
        
        console.log('🎯 Fitting map to smart bounds');
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [driveways, userLocation, map, center]);

  return null;
};

// Component to handle map focusing on selected driveway
const MapFocus: React.FC<{
  selectedDriveway: any | null;
  center: [number, number];
}> = ({ selectedDriveway, center }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedDriveway) {
      console.log('🎯 Focusing on selected driveway:', selectedDriveway.address);
      const coords = ensureCoordinates(selectedDriveway, center);
      map.setView([coords.lat, coords.lng], 16, { animate: true });
    }
  }, [selectedDriveway, map, center]);

  return null;
};

const UnifiedMapView: React.FC<MapViewProps> = ({
  driveways,
  userLocation,
  onDrivewaySelect,
  selectedDriveway,
  height = 500,
  showLegend = true,
  showControls = true,
  onRefresh,
  isRefreshing = false
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);
  
  // Debug: Log when component loads
  console.log('🚀 ENHANCED MAP LOADED - Version with clustering and walking time!');
  console.warn('🎯 ENHANCED MAP v2.0 IS ACTIVE! Look for the green banner at the top!');
  
  // Default center (Jersey City area)
  const defaultCenter: [number, number] = [40.7178, -74.0431];
  const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultCenter;
  
  // For now, disable clustering to ensure all markers show up
  const shouldCluster = false; // Disable clustering temporarily
  const clusterDistance = 100;
  
  // Get individual markers (no clustering for now)
  const displayMarkers = driveways.map(d => ({ 
    driveways: [d], 
    count: 1, 
    center: ensureCoordinates(d, center) 
  }));

  console.log('🗺️ Map clustering debug:', {
    shouldCluster,
    drivewaysCount: driveways.length,
    displayMarkersCount: displayMarkers.length,
    zoomLevel,
    driveways: driveways.map(d => ({ id: d.id, address: d.address, coordinates: d.coordinates }))
  });

  console.log('🗺️ UnifiedMapView: Rendering map', {
    driveways: driveways.length,
    userLocation,
    selectedDriveway: selectedDriveway?.address,
    center,
    height
  });

  return (
    <div className="unified-map-container">
      {/* Map Container */}
      <div className="map-container" style={{ height: '100%' }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => {
            console.log('✅ Map ready');
            setMapLoaded(true);
          }}
          eventHandlers={{
            zoomend: (e) => {
              const map = e.target;
              setZoomLevel(map.getZoom());
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater driveways={driveways} userLocation={userLocation} center={center} />
          <MapFocus selectedDriveway={selectedDriveway} center={center} />
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                className: 'user-marker',
                html: `
                  <div style="
                    background-color: #3B82F6; 
                    width: 32px; 
                    height: 32px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z"/>
                    </svg>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -16]
              })}
            >
              <Popup>
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 text-sm">Your Location</h4>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Driveway Markers - Individual Only (No Clustering) */}
          {displayMarkers.map((marker, index) => {
            const driveway = marker.driveways[0];
            console.log('🎯 Rendering marker for driveway:', driveway.address, 'at', marker.center);
            
            return (
              <MapMarker
                key={driveway.id}
                driveway={driveway}
                userLocation={userLocation}
                selectedDriveway={selectedDriveway}
                onDrivewaySelect={onDrivewaySelect}
                center={center}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="map-footer">
          <MapLegend />
        </div>
      )}
    </div>
  );
};

export default UnifiedMapView;
