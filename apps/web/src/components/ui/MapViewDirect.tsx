'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { mapService } from '@/services/MapService';

// Direct Leaflet implementation - bypasses react-leaflet's problematic cleanup
interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  price: number;
  address?: string;
  rating?: number;
  image?: string;
}

interface MapViewDirectProps {
  center: [number, number];
  markers: MapMarker[];
  height?: string;
  viewMode?: string;
  onMarkerClick?: (id: string) => void;
}

export default function MapViewDirect({
  center,
  markers,
  height = '100%',
  viewMode,
  onMarkerClick
}: MapViewDirectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null); // Leaflet map instance
  const markersRef = useRef<any[]>([]); // Leaflet marker instances
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Generate stable container ID
  const containerId = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `map-${crypto.randomUUID()}`;
    }
    return `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize Leaflet map directly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;

    // Dynamic import of Leaflet
    const initMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Import Leaflet
        const L = (await import('leaflet')).default;

        // Re-check container after async (may have unmounted)
        if (!containerRef.current || !container.isConnected) {
          setIsLoading(false);
          return;
        }

        // Check if container is safe
        if (!mapService.isContainerSafe(container)) {
          console.log('[MapViewDirect] Container not safe, cleaning...');
          mapService.cleanContainer(container);
          // Wait for cleanup
          await new Promise(resolve => requestAnimationFrame(resolve));
        }

        // Verify container is still safe
        if (!mapService.isContainerSafe(container)) {
          console.warn('[MapViewDirect] Container still not safe after cleanup');
          setMapError('Map container is not ready');
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;

        // Create map instance directly
        console.log('[MapViewDirect] Creating Leaflet map directly');
        const map = L.map(container, {
          center: center,
          zoom: 13,
          zoomControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Register map with service
        mapService.registerMap(containerId, map, container);

        mapRef.current = map;

        // Create parking icon
        const parkingIcon = L.divIcon({
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

        // Add markers
        const markerInstances: any[] = [];
        markers.forEach((marker) => {
          const leafletMarker = L.marker(marker.position, { icon: parkingIcon });
          
          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.className = 'p-3 min-w-[200px]';
          popupContent.innerHTML = `
            ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="w-full h-24 object-cover rounded mb-2" />` : ''}
            <div class="text-sm font-semibold text-gray-900 mb-1">${marker.title}</div>
            ${marker.address ? `<div class="text-xs text-gray-600 mb-2">${marker.address}</div>` : ''}
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold text-primary-600">$${marker.price.toFixed(2)}/hr</span>
              ${marker.rating ? `<span class="text-xs text-gray-600">★ ${marker.rating.toFixed(1)}</span>` : ''}
            </div>
            <a href="/driveway/${marker.id}" class="block text-center text-xs text-primary-600 hover:text-primary-700 font-medium mt-2">View Details →</a>
          `;
          
          leafletMarker.bindPopup(popupContent, { closeButton: true, autoClose: false });
          
          // Handle marker click
          leafletMarker.on('click', () => {
            onMarkerClick?.(marker.id);
          });

          leafletMarker.addTo(map);
          markerInstances.push(leafletMarker);
        });

        markersRef.current = markerInstances;

        // Set view to center
        map.setView(center, map.getZoom());

        // Invalidate size after a short delay to ensure container is rendered
        setTimeout(() => {
          const container = containerRef.current;
          const map = mapRef.current;
          if (!isMounted || !map || !container) return;
          try {
            const el = map.getContainer?.() ?? map._container;
            if (el && el.offsetWidth > 0) map.invalidateSize();
          } catch (e) {
            console.error('[MapViewDirect] Error invalidating size:', e);
          }
        }, 100);

        setIsLoading(false);
        console.log('[MapViewDirect] Map initialized successfully');

      } catch (error: any) {
        console.error('[MapViewDirect] Map initialization error:', error);
        setMapError(error?.message || 'Failed to initialize map');
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log('[MapViewDirect] Cleanup - destroying map');
      
      // Clear markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          try {
            if (mapRef.current) {
              mapRef.current.removeLayer(marker);
            }
          } catch (e) {
            // Ignore
          }
        });
        markersRef.current = [];
      }

      // Destroy map through service (this only clears properties, never calls map.remove())
      if (mapRef.current) {
        mapService.destroyMap(containerId);
        mapRef.current = null;
      }

      // Clean container
      if (containerRef.current) {
        mapService.cleanContainer(containerRef.current);
      }
    };
  }, [containerId, center]); // Only re-run if center changes

  // Update map center when it changes
  useEffect(() => {
    if (mapRef.current && center) {
      try {
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.setView(center, currentZoom);
      } catch (e) {
        // Ignore
      }
    }
  }, [center]);

    // Update markers when they change
    useEffect(() => {
      if (!mapRef.current) return;

      // Remove old markers
      markersRef.current.forEach(marker => {
        try {
          if (mapRef.current) {
            mapRef.current.removeLayer(marker);
          }
        } catch (e) {
          // Ignore
        }
      });
      markersRef.current = [];

      if (markers.length === 0) return;

      // Import Leaflet for marker creation
      const updateMarkers = async () => {
        try {
          const L = (await import('leaflet')).default;

          const parkingIcon = L.divIcon({
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

          // Add new markers directly
          const markerInstances: any[] = [];
          markers.forEach((marker) => {
            const leafletMarker = L.marker(marker.position, { icon: parkingIcon });
            
            const popupContent = document.createElement('div');
            popupContent.className = 'p-3 min-w-[200px]';
            popupContent.innerHTML = `
              ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="w-full h-24 object-cover rounded mb-2" />` : ''}
              <div class="text-sm font-semibold text-gray-900 mb-1">${marker.title}</div>
              ${marker.address ? `<div class="text-xs text-gray-600 mb-2">${marker.address}</div>` : ''}
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-primary-600">$${marker.price.toFixed(2)}/hr</span>
                ${marker.rating ? `<span class="text-xs text-gray-600">★ ${marker.rating.toFixed(1)}</span>` : ''}
              </div>
              <a href="/driveway/${marker.id}" class="block text-center text-xs text-primary-600 hover:text-primary-700 font-medium mt-2">View Details →</a>
            `;
            
            leafletMarker.bindPopup(popupContent, { closeButton: true, autoClose: false });
            leafletMarker.on('click', () => {
              onMarkerClick?.(marker.id);
            });

            if (mapRef.current) {
              leafletMarker.addTo(mapRef.current);
            }
            markerInstances.push(leafletMarker);
          });

          markersRef.current = markerInstances;
        } catch (e) {
          console.error('[MapViewDirect] Error updating markers:', e);
        }
      };

      updateMarkers();
    }, [markers, onMarkerClick]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const map = mapRef.current;
      if (!map || !container) return;
      setTimeout(() => {
        const c = containerRef.current;
        const m = mapRef.current;
        if (!m || !c) return;
        try {
          const el = m.getContainer?.() ?? m._container;
          if (el && el.offsetWidth > 0) m.invalidateSize();
        } catch (e) {
          console.error('[MapViewDirect] Error invalidating size on resize:', e);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map container must be an empty div so Leaflet owns its children - no React children
  // inside it. Otherwise React's removeChild conflicts with Leaflet's DOM (NotFoundError).
  return (
    <div
      style={{ height, width: '150%', position: 'relative',zIndex: 0 }}
      className="rounded-lg overflow-auto">
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-gray-500 text-sm">Loading map...</div>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-red-500 text-sm">Error: {mapError}</div>
        </div>
      )}
    </div>
  );
}
