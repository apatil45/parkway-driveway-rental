import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Driveway {
  id: string; // Changed from _id to id to match PostgreSQL model
  address: string;
  description: string;
  availability: { date: string; startTime: string; endTime: string; pricePerHour: number }[];
  isAvailable: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  carSizeCompatibility?: string[];
  drivewaySize?: string;
}

interface EnhancedMapDisplayProps {
  driveways: Driveway[];
  onDrivewayClick?: (driveway: Driveway) => void;
  currentLocation?: { latitude: number; longitude: number };
  searchParams?: {
    date: string;
    startTime: string;
    endTime: string;
  };
}

const EnhancedMapDisplay: React.FC<EnhancedMapDisplayProps> = ({
  driveways,
  onDrivewayClick,
  currentLocation,
  searchParams
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([40.7128, -74.0060], 13);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add current location marker if available
    if (currentLocation) {
      const currentLocationIcon = L.divIcon({
        className: 'current-location-marker',
        html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: currentLocationIcon
      }).addTo(map).bindPopup('Your Current Location');

      // Center map on current location
      map.setView([currentLocation.latitude, currentLocation.longitude], 15);
    }

    // Add driveway markers
    const markers: L.Marker[] = [];
    driveways.forEach((driveway) => {
      if (driveway.location && driveway.location.coordinates) {
        const [lng, lat] = driveway.location.coordinates;
        
        // Create custom icon based on availability
        const iconColor = driveway.isAvailable ? '#10b981' : '#ef4444';
        const customIcon = L.divIcon({
          className: 'driveway-marker',
          html: `<div style="
            background-color: ${iconColor}; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
          ">P</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        
        // Create popup content
        const availableSlots = driveway.availability.filter(slot => {
          if (!searchParams) return true;
          const slotDate = new Date(slot.date);
          const searchDate = new Date(searchParams.date);
          return (
            slotDate.toDateString() === searchDate.toDateString() &&
            searchParams.startTime >= slot.startTime &&
            searchParams.endTime <= slot.endTime
          );
        });

        const popupContent = `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${driveway.address}</h4>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${driveway.description}</p>
            <div style="margin: 8px 0;">
              <span style="
                background: ${driveway.isAvailable ? '#d1fae5' : '#fee2e2'}; 
                color: ${driveway.isAvailable ? '#065f46' : '#991b1b'}; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 12px; 
                font-weight: 600;
              ">
                ${driveway.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            ${availableSlots.length > 0 ? `
              <div style="margin: 8px 0;">
                <strong style="font-size: 12px; color: #374151;">Available Slots:</strong>
                ${availableSlots.map(slot => `
                  <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">
                    ${slot.startTime} - ${slot.endTime} | $${(slot.pricePerHour || 0).toFixed(2)}/hr
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${driveway.carSizeCompatibility ? `
              <div style="margin: 8px 0;">
                <strong style="font-size: 12px; color: #374151;">Compatible Car Sizes:</strong>
                <div style="font-size: 12px; color: #6b7280;">
                  ${driveway.carSizeCompatibility.map(size => 
                    size.charAt(0).toUpperCase() + size.slice(1)
                  ).join(', ')}
                </div>
              </div>
            ` : ''}
            ${onDrivewayClick ? `
              <button 
                onclick="window.selectDriveway('${driveway.id}')"
                style="
                  background: #10b981; 
                  color: white; 
                  border: none; 
                  padding: 8px 16px; 
                  border-radius: 6px; 
                  cursor: pointer; 
                  font-size: 12px; 
                  font-weight: 600;
                  width: 100%;
                  margin-top: 8px;
                "
              >
                Book This Driveway
              </button>
            ` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        
        // Add click handler
        marker.on('click', () => {
          setSelectedDriveway(driveway);
          if (onDrivewayClick) {
            onDrivewayClick(driveway);
          }
        });

        markers.push(marker);
      }
    });

    markersRef.current = markers;

    // Add global function for popup button clicks
    (window as any).selectDriveway = (drivewayId: string) => {
      const driveway = driveways.find(d => d.id === drivewayId);
      if (driveway && onDrivewayClick) {
        onDrivewayClick(driveway);
      }
    };

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      map.remove();
      (window as any).selectDriveway = undefined;
    };
  }, [driveways, currentLocation, searchParams, onDrivewayClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {selectedDriveway && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '250px',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Selected: {selectedDriveway.address}</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
            {selectedDriveway.description}
          </p>
          <button
            onClick={() => setSelectedDriveway(null)}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedMapDisplay;
