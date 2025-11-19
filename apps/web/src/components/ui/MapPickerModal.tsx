'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';

const LeafletMap = dynamic(async () => {
  const L = await import('react-leaflet');
  const leaflet = await import('leaflet');
  
  return ({ 
    center, 
    onLocationSelect,
    onClose
  }: { 
    center: [number, number]; 
    onLocationSelect: (lat: number, lon: number, address: string) => void;
    onClose: () => void;
  }) => {
    const { MapContainer, TileLayer, Marker, useMapEvents } = L;
    const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(false);
    
    // Create marker icon
    const markerIcon = leaflet.default.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: #2563eb;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <span style="
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">📍</span>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
    
    // Map click handler
    function MapClickHandler() {
      useMapEvents({
        click: async (e) => {
          const { lat, lng } = e.latlng;
          setSelectedPosition([lat, lng]);
          setLoading(true);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=us`,
              {
                headers: {
                  'User-Agent': 'Parkway Driveway Rental Platform',
                },
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              setAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            } else {
              setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          } catch (error) {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } finally {
            setLoading(false);
          }
        },
      });
      return null;
    }
    
    const handleConfirm = () => {
      if (selectedPosition) {
        onLocationSelect(selectedPosition[0], selectedPosition[1], address);
        onClose();
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Pick a location on the map</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 relative" style={{ minHeight: '400px' }}>
            <MapContainer 
              center={center} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }} 
              scrollWheelZoom={true}
              className="rounded-lg"
            >
              <MapClickHandler />
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {selectedPosition && (
                <Marker position={selectedPosition} icon={markerIcon} />
              )}
            </MapContainer>
          </div>
          
          <div className="p-4 border-t bg-gray-50">
            {selectedPosition ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 mb-1 font-medium">Selected location:</p>
                  <p className="text-sm font-medium text-gray-900 bg-white p-2 rounded border border-gray-200">
                    {loading ? 'Loading address...' : address}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Use This Location
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 text-center bg-white p-2 rounded">
                Click on the map to select a location
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
}, { ssr: false });

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lon: number, address: string) => void;
  initialCenter?: [number, number];
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialCenter,
}: MapPickerModalProps) {
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  
  useEffect(() => {
    if (initialCenter) {
      setCenter(initialCenter);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Use default if geolocation fails
        }
      );
    }
  }, [initialCenter]);
  
  if (!isOpen) return null;
  
  return (
    <LeafletMap 
      center={center} 
      onLocationSelect={onLocationSelect}
      onClose={onClose}
    />
  );
}

