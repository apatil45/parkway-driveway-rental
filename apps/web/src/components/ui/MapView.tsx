'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import Link from 'next/link';

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
    viewMode?: string;
    onMarkerClick?: (id: string) => void;
  }) => {
    const { MapContainer, TileLayer, Marker, Popup, useMap } = L;
    const mapInstanceRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isInitializedRef = useRef(false);
    const isDestroyedRef = useRef(false);
    const isCleaningUpRef = useRef(false);
    // Generate a unique key on every mount to force React to create a new instance
    // This prevents React from reusing components and causing container reuse errors
    const mapKeyRef = useRef<string>(`map-${viewMode || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const [canRender, setCanRender] = useState(false);
    const mountCountRef = useRef(0);
    const previousViewModeRef = useRef<string | undefined>(viewMode);
    const isNavigatingRef = useRef(false);

    // Helper function to check if map is valid
    const isMapValid = (map: any): boolean => {
      if (!map) return false;
      if (isDestroyedRef.current) return false;
      try {
        // Check if map has been removed
        if (map._container && !map._container.parentNode) return false;
        // Check if map pane exists (indicates map is still valid)
        if (!map.getPane || !map.getPane('mapPane')) return false;
        return true;
      } catch (e) {
        return false;
      }
    };

    // Component to handle map updates
    const MapUpdater = ({ center }: { center: [number, number] }) => {
      const map = useMap();
      
      useEffect(() => {
        if (!map || !center) return;
        if (!isMapValid(map)) return;
        if (isDestroyedRef.current) return;

        try {
          const currentZoom = map.getZoom ? map.getZoom() : 13;
          map.setView(center, currentZoom);
          // Invalidate size to fix rendering issues
          setTimeout(() => {
            if (isMapValid(map) && !isDestroyedRef.current) {
              try {
                map.invalidateSize();
              } catch (e) {
                // Map was destroyed during timeout - ignore
              }
            }
          }, 100);
        } catch (e) {
          // Map was destroyed - ignore error
          console.warn('Map update failed (map may be destroyed):', e);
        }
      }, [center, map]);

      return null;
    };

    // Component to handle map resize
    const MapResizeHandler = () => {
      const map = useMap();

      useEffect(() => {
        if (!map) return;

        const handleResize = () => {
          setTimeout(() => {
            if (isMapValid(map) && !isDestroyedRef.current) {
              try {
                map.invalidateSize();
              } catch (e) {
                // Map was destroyed - ignore error
              }
            }
          }, 100);
        };

        window.addEventListener('resize', handleResize);
        
        // Initial resize after mount
        setTimeout(() => {
          if (isMapValid(map) && !isDestroyedRef.current) {
            try {
              map.invalidateSize();
            } catch (e) {
              // Map was destroyed - ignore error
            }
          }
        }, 100);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, [map]);

      return null;
    };

    // Synchronous cleanup: Remove all Leaflet tracking from container
    const cleanupMap = () => {
      isCleaningUpRef.current = true;
      isDestroyedRef.current = true;
      
      // Remove map instance
      if (mapInstanceRef.current) {
        try {
          const map = mapInstanceRef.current;
          if (map._container && map._container.parentNode) {
            try {
              map.remove();
            } catch (e) {
              // If remove fails, clear directly
              try {
                if (map._container) {
                  map._container.innerHTML = '';
                  delete (map._container as any)._leaflet_id;
                  delete (map._container as any)._leaflet;
                }
              } catch (e2) {
                // Ignore
              }
            }
          }
        } catch (e) {
          // Ignore
        }
        mapInstanceRef.current = null;
      }
      
      // Clean container: Remove all Leaflet artifacts
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Remove Leaflet containers
        const leafletContainers = container.querySelectorAll('.leaflet-container');
        leafletContainers.forEach((el) => {
          try {
            const leafletEl = el as HTMLElement;
            if ((leafletEl as any)._leaflet_id) {
              const map = (leafletEl as any)._leaflet;
              if (map && typeof map.remove === 'function') {
                try {
                  map.remove();
                } catch (e) {
                  // Ignore
                }
              }
              delete (leafletEl as any)._leaflet_id;
              delete (leafletEl as any)._leaflet;
            }
            if (el.parentNode) {
              el.remove();
            }
          } catch (e) {
            // Ignore
          }
        });
        
        // Clear container properties
        delete (container as any)._leaflet_id;
        delete (container as any)._leaflet;
        
        // Clear innerHTML if Leaflet elements exist
        if (container.querySelector('.leaflet-container')) {
          try {
            container.innerHTML = '';
          } catch (e) {
            // Ignore
          }
        }
      }
      
      isInitializedRef.current = false;
      isCleaningUpRef.current = false;
    };
    
    // Check if container has any Leaflet artifacts
    const isContainerClean = (container: HTMLDivElement): boolean => {
      if (!container) return false;
      // Check for Leaflet tracking properties
      if ((container as any)._leaflet_id) return false;
      if ((container as any)._leaflet) return false;
      // Check for Leaflet DOM elements
      if (container.querySelector('.leaflet-container')) return false;
      return true;
    };

    // Reset refs and cleanup when viewMode changes
    useEffect(() => {
      if (previousViewModeRef.current !== viewMode) {
        // View mode changed - reset everything
        cleanupMap(true);
        setCanRender(false);
        isInitializedRef.current = false;
        mapInstanceRef.current = null;
        isDestroyedRef.current = false; // Reset destroyed flag for new instance
        isCleaningUpRef.current = false;
        // Generate new key for this view mode
        mapKeyRef.current = `map-${viewMode || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        previousViewModeRef.current = viewMode;
      }
    }, [viewMode]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        isDestroyedRef.current = true;
        isCleaningUpRef.current = true;
        cleanupMap();
        setCanRender(false);
        isInitializedRef.current = false;
        mapInstanceRef.current = null;
      };
    }, []);

    // Synchronous validation before render (useLayoutEffect runs before browser paints)
    useLayoutEffect(() => {
      mountCountRef.current += 1;
      const currentMount = mountCountRef.current;
      
      isNavigatingRef.current = false;
      isDestroyedRef.current = false;
      
      // Cleanup any existing map instances
      cleanupMap();
      setCanRender(false);
      
      // Synchronously validate container is clean before allowing render
      if (containerRef.current) {
        const container = containerRef.current;
        
        // If container has Leaflet artifacts, clean it
        if (!isContainerClean(container)) {
          cleanupMap();
        }
        
        // Only allow render if container is clean
        if (isContainerClean(container)) {
          setCanRender(true);
        } else {
          // Container still dirty - don't render
          console.warn('Container has Leaflet artifacts, preventing map initialization');
          setCanRender(false);
        }
      } else {
        // No container yet - allow render (container will be validated in ref callback)
        setCanRender(true);
      }
      
      return () => {
        if (mountCountRef.current === currentMount) {
          cleanupMap();
          setCanRender(false);
        }
      };
    }, [viewMode]);

    // Ref callback: Clean up previous container if it changes
    const containerRefCallback = (node: HTMLDivElement | null) => {
      if (containerRef.current && containerRef.current !== node) {
        cleanupMap();
      }
      containerRef.current = node;
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

    return (
      <div
        ref={containerRefCallback}
        style={{ height, width: '100%', position: 'relative' }}
        key={mapKeyRef.current}
      >
        {!canRender ? (
          <div className="bg-gray-100 rounded-lg flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading map...</div>
          </div>
        ) : containerRef.current && isContainerClean(containerRef.current) ? (
          // Use a unique key that changes on every mount to force React to create a new MapContainer
          // This prevents React from reusing the component and causing container reuse errors
          <MapContainer
            key={`${mapKeyRef.current}-${viewMode || 'default'}-${mountCountRef.current}`}
            center={center}
            zoom={13}
            style={{ height, width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            className="rounded-lg overflow-hidden"
            zoomControl={true}
            ref={(map) => {
              if (!map) {
                // Unmounting: cleanup existing map instance
                if (mapInstanceRef.current) {
                  try {
                    if (mapInstanceRef.current._container && mapInstanceRef.current._container.parentNode) {
                      mapInstanceRef.current.remove();
                    }
                  } catch (e) {
                    // Ignore
                  }
                  mapInstanceRef.current = null;
                }
                return;
              }
              
              // Prevent initialization if cleaning up, destroyed, or navigating
              if (isCleaningUpRef.current || isDestroyedRef.current || isNavigatingRef.current) {
                return;
              }
              
              // CRITICAL: Check container is clean before initializing
              // This prevents "Map container is being reused" error
              if (containerRef.current && !isContainerClean(containerRef.current)) {
                console.warn('Container has Leaflet artifacts, preventing initialization');
                cleanupMap();
                isDestroyedRef.current = true;
                return;
              }
              
              // Initialize map instance
              try {
                if (!isInitializedRef.current) {
                  mapInstanceRef.current = map;
                  isInitializedRef.current = true;
                  isDestroyedRef.current = false;
                }
              } catch (error: any) {
                // Catch "Map container is being reused" error
                if (error?.message?.includes('Map container is being reused')) {
                  console.warn('Map container reuse detected, cleaning up...');
                  cleanupMap();
                  isDestroyedRef.current = true;
                } else {
                  console.error('Map initialization error:', error);
                  isDestroyedRef.current = true;
                }
              }
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
  return <LeafletMap center={center} markers={markers} height={height} viewMode={viewMode} onMarkerClick={onMarkerClick} />;
}

