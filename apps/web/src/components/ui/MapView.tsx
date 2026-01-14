'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useMapLifecycle } from '@/hooks/useMapLifecycle';
import { mapService } from '@/services/MapService';

// Dynamic import prevents SSR issues
const LeafletMap = dynamic(async () => {
  const L = await import('react-leaflet');
  const leaflet = await import('leaflet');
  const MarkerClusterGroup = (await import('react-leaflet-cluster')).default;

  return ({
    center,
    markers,
    height = '100%',
    viewMode,
    onMarkerClick,
    containerId,
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
    viewMode?: string;
    onMarkerClick?: (id: string) => void;
    containerId: string;
  }) => {
    const { MapContainer, TileLayer, Marker, Popup, useMap } = L;
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Use map lifecycle hook
    const { state, prepare, initialize, isReady, isInitialized } = useMapLifecycle({
      containerId,
      containerRef,
    });

    // Component to handle map updates
    const MapUpdater = ({ center }: { center: [number, number] }) => {
      const map = useMap();
      
      useEffect(() => {
        if (!map || !center) return;
        if (!isInitialized) return;

        try {
          const currentZoom = map.getZoom ? map.getZoom() : 13;
          map.setView(center, currentZoom);
          setTimeout(() => {
            if (isInitialized) {
              try {
                map.invalidateSize();
              } catch (e) {
                // Ignore
              }
            }
          }, 100);
        } catch (e) {
          console.warn('Map update failed:', e);
        }
      }, [center, map, isInitialized]);

      return null;
    };

    // Component to handle map resize
    const MapResizeHandler = () => {
      const map = useMap();

      useEffect(() => {
        if (!map || !isInitialized) return;

        const handleResize = () => {
          setTimeout(() => {
            if (isInitialized) {
              try {
                map.invalidateSize();
              } catch (e) {
                // Ignore
              }
            }
          }, 100);
        };

        window.addEventListener('resize', handleResize);
        
        setTimeout(() => {
          if (isInitialized) {
            try {
              map.invalidateSize();
            } catch (e) {
              // Ignore
            }
          }
        }, 100);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, [map, isInitialized]);

      return null;
    };

    // Create custom parking icon
    const parkingIcon = useMemo(() => {
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
    }, []);

    // Container ref callback - prepare when container is attached
    const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
      const logPrefix = `[MapView.containerRefCallback] containerId: ${containerId}`;
      console.log(`${logPrefix} Ref callback called, node:`, node ? 'exists' : 'null');
      
      if (containerRef.current && containerRef.current !== node) {
        console.log(`${logPrefix} Container changed, old container being replaced`);
        // Container changed - old container is being replaced
        // Don't prepare here, let the new node prepare
      }
      
      // Set ref first
      containerRef.current = node;
      console.log(`${logPrefix} Ref set, preparing...`);
      
      // Then prepare if we have a node
      if (node) {
        // Wait for React to finish attaching to DOM
        requestAnimationFrame(() => {
          if (containerRef.current === node) {
            console.log(`${logPrefix} Container still matches, calling prepare()`);
            prepare();
          } else {
            console.warn(`${logPrefix} Container changed during requestAnimationFrame, skipping prepare`);
          }
        });
      } else {
        console.log(`${logPrefix} Node is null, not preparing`);
      }
    }, [containerId, prepare]);

    return (
      <div
        ref={containerRefCallback}
        style={{ height, width: '100%', position: 'relative' }}
      >
        {!isReady ? (
          <div className="bg-gray-100 rounded-lg flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading map...</div>
          </div>
        ) : containerRef.current ? (
          <MapContainer
            key={containerId}
            center={center}
            zoom={13}
            style={{ height, width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            className="rounded-lg overflow-hidden"
            zoomControl={true}
            ref={(map) => {
              const logPrefix = `[MapView.MapContainer.ref] containerId: ${containerId}`;
              
              if (!map) {
                console.log(`${logPrefix} Map is null (unmounting)`);
                // Unmounting - React is removing the map
                // Don't do anything - React handles DOM removal
                // Cleanup will happen in useEffect cleanup
                return;
              }
              
              console.log(`${logPrefix} Map instance received, isInitialized: ${isInitialized}`);
              
              // Initialize map through service
              // This is called when MapContainer creates the map instance
              // The initialize function has guards to prevent multiple calls
              if (isInitialized) {
                console.log(`${logPrefix} Already initialized, skipping`);
                // Already initialized, don't call again
                return;
              }
              
              console.log(`${logPrefix} Calling initialize()`);
              initialize(map);
            }}
          >
            <MapUpdater center={center} />
            <MapResizeHandler />
            
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={(cluster: any) => {
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
              {markers.map((m) => (
                <Marker
                  key={m.id}
                  position={m.position}
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
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        {m.title}
                      </div>
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
        ) : (
          <div className="bg-gray-100 rounded-lg flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Preparing map...</div>
          </div>
        )}
      </div>
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
  viewMode,
  onMarkerClick
}: {
  center: [number, number];
  markers: MapMarker[];
  height?: string;
  viewMode?: string;
  onMarkerClick?: (id: string) => void;
}) {
  // Generate stable container ID (never changes for this component instance)
  const getContainerId = (): string => {
    // Use crypto.randomUUID if available, otherwise generate a unique ID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `map-${crypto.randomUUID()}`;
    }
    return `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  const containerIdRef = useRef<string>(getContainerId());
  
  return (
    <LeafletMap
      center={center}
      markers={markers}
      height={height}
      viewMode={viewMode}
      onMarkerClick={onMarkerClick}
      containerId={containerIdRef.current}
    />
  );
}
