'use client';

import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';

const LeafletMap = dynamic(async () => {
  const L = await import('react-leaflet');
  return ({ center, markers, height = '100%', onMarkerClick }: { 
    center: [number, number]; 
    markers: Array<{ id: string; position: [number, number]; title: string; price: number }>;
    height?: string;
    onMarkerClick?: (id: string) => void;
  }) => {
    const { MapContainer, TileLayer, Marker, Popup, useMap } = L;
    
    // Component to handle map updates
    const MapUpdater = ({ center }: { center: [number, number] }) => {
      const map = useMap();
      useEffect(() => {
        map.setView(center, map.getZoom());
      }, [center, map]);
      return null;
    };
    
    return (
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height, width: '100%', zIndex: 0 }} 
        scrollWheelZoom={true}
        className="rounded-lg overflow-hidden"
      >
        <MapUpdater center={center} />
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {markers.map(m => (
          <Marker 
            key={m.id} 
            position={m.position as any}
            eventHandlers={{
              click: () => onMarkerClick?.(m.id),
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="text-sm font-semibold text-gray-900">{m.title}</div>
                <div className="text-xs text-gray-600 mt-1">${m.price.toFixed(2)}/hr</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  };
}, { ssr: false });

export default function MapView({ 
  center, 
  markers, 
  height = '100%',
  onMarkerClick 
}: { 
  center: [number, number]; 
  markers: Array<{ id: string; position: [number, number]; title: string; price: number }>;
  height?: string;
  onMarkerClick?: (id: string) => void;
}) {
  return <LeafletMap center={center} markers={markers} height={height} onMarkerClick={onMarkerClick} />;
}


