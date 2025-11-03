'use client';

import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import Link from 'next/link';

const LeafletMap = dynamic(async () => {
  const L = await import('react-leaflet');
  const leaflet = await import('leaflet');
  const MarkerClusterGroup = (await import('react-leaflet-cluster')).default;
  
  return ({ 
    center, 
    markers, 
    height = '100%', 
    onMarkerClick 
  }: { 
    center: [number, number]; 
    markers: Array<{ 
      id: string; 
      position: [number, number]; 
      title: string; 
      price: number;
      address?: string;
      rating?: number;
      image?: string;
    }>;
    height?: string;
    onMarkerClick?: (id: string) => void;
  }) => {
    const { MapContainer, TileLayer, Marker, Popup, useMap } = L;
    
    // Create custom parking icon
    const createParkingIcon = () => {
      return leaflet.default.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid #2563eb;
          ">
            <span style="
              color: #2563eb;
              font-size: 20px;
              font-weight: bold;
            ">P</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });
    };

    const parkingIcon = createParkingIcon();
    
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
        zoomControl={true}
      >
        <MapUpdater center={center} />
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            return leaflet.default.divIcon({
              html: `<div style="
                background: #2563eb;
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">${count}</div>`,
              className: 'custom-cluster',
              iconSize: [40, 40],
            });
          }}
        >
          {markers.map(m => (
            <Marker 
              key={m.id} 
              position={m.position as any}
              icon={parkingIcon}
              eventHandlers={{
                click: () => onMarkerClick?.(m.id),
              }}
            >
              <Popup closeButton={true} autoClose={false}>
                <div className="p-3 min-w-[200px]">
                  {m.image && (
                    <img 
                      src={m.image} 
                      alt={m.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <div className="text-sm font-semibold text-gray-900 mb-1">{m.title}</div>
                  {m.address && (
                    <div className="text-xs text-gray-600 mb-2">{m.address}</div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-primary-600">
                      ${m.price.toFixed(2)}/hr
                    </span>
                    {m.rating && (
                      <span className="text-xs text-gray-600">
                        ★ {m.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <Link 
                    href={`/driveway/${m.id}`}
                    className="block text-center text-xs text-primary-600 hover:text-primary-700 font-medium mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.(m.id);
                    }}
                  >
                    View Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    );
  };
}, { ssr: false });

interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  price: number;
  address?: string;
  rating?: number;
  image?: string;
}

export default function MapView({ 
  center, 
  markers, 
  height = '100%',
  onMarkerClick 
}: { 
  center: [number, number]; 
  markers: MapMarker[];
  height?: string;
  onMarkerClick?: (id: string) => void;
}) {
  return <LeafletMap center={center} markers={markers} height={height} onMarkerClick={onMarkerClick} />;
}


