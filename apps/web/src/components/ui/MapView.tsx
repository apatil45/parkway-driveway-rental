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
    const mapKeyRef = useRef<string>(`map-${viewMode || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const [canRender, setCanRender] = useState(false);
    const mountCountRef = useRef(0);
    const previousViewModeRef = useRef<string | undefined>(viewMode);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Cleanup function
    const cleanupMap = (force = false) => {
      // Prevent concurrent cleanups
      if (isCleaningUpRef.current && !force) {
        return;
      }
      
      isCleaningUpRef.current = true;
      // Mark as destroyed first to prevent operations during cleanup
      isDestroyedRef.current = true;
      
      // Clear any pending cleanup timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      if (mapInstanceRef.current) {
        try {
          // Check if map is still valid before removing
          if (mapInstanceRef.current._container && mapInstanceRef.current._container.parentNode) {
            mapInstanceRef.current.remove();
          }
        } catch (e) {
          // Ignore cleanup errors - map may already be removed
        }
        mapInstanceRef.current = null;
      }
      
      if (containerRef.current) {
        const container = containerRef.current;
        if (container) {
          // Remove any Leaflet containers inside
          const leafletContainers = container.querySelectorAll('.leaflet-container');
          leafletContainers.forEach((el) => {
            const leafletEl = el as HTMLElement;
            if ((leafletEl as any)._leaflet_id) {
              try {
                const map = (leafletEl as any)._leaflet;
                if (map && typeof map.remove === 'function') {
                  // Check if map container still exists before removing
                  if (map._container && map._container.parentNode) {
                    map.remove();
                  }
                }
              } catch (e) {
                // Ignore - map may already be removed
              }
              delete (leafletEl as any)._leaflet_id;
              delete (leafletEl as any)._leaflet;
            }
            try {
              if (el.parentNode) {
                el.remove();
              }
            } catch (e) {
              // Ignore if already removed
            }
          });
          // Clear container tracking
          delete (container as any)._leaflet_id;
          delete (container as any)._leaflet;
        }
      }
      
      isInitializedRef.current = false;
      
      // Reset cleanup flag after a delay to allow cleanup to complete
      cleanupTimeoutRef.current = setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 200);
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
        cleanupMap(true);
        setCanRender(false);
        isInitializedRef.current = false;
        mapInstanceRef.current = null;
        isDestroyedRef.current = true;
        isCleaningUpRef.current = true;
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
        }
      };
    }, []);

    // Synchronous cleanup before render (useLayoutEffect runs before browser paints)
    useLayoutEffect(() => {
      mountCountRef.current += 1;
      const currentMount = mountCountRef.current;
      
      // Always start with cleanup to ensure clean state
      cleanupMap();
      setCanRender(false);
      
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Aggressively clean up any existing map instances
        // Remove all Leaflet containers and their content
        const leafletContainers = container.querySelectorAll('.leaflet-container');
        leafletContainers.forEach((el) => {
          const leafletEl = el as HTMLElement;
          if ((leafletEl as any)._leaflet_id) {
            try {
              const map = (leafletEl as any)._leaflet;
              if (map && typeof map.remove === 'function') {
                map.remove();
              }
            } catch (e) {
              // Ignore cleanup errors
            }
            delete (leafletEl as any)._leaflet_id;
            delete (leafletEl as any)._leaflet;
          }
          // Remove the element itself
          try {
            el.remove();
          } catch (e) {
            // Ignore if already removed
          }
        });
        
        // Also check for any Leaflet instances in the parent container
        // This handles cases where the container is reused
        const parent = container.parentElement;
        if (parent) {
          const parentLeafletContainers = parent.querySelectorAll('.leaflet-container');
          parentLeafletContainers.forEach((el) => {
            const leafletEl = el as HTMLElement;
            if ((leafletEl as any)._leaflet_id) {
              try {
                const map = (leafletEl as any)._leaflet;
                if (map && typeof map.remove === 'function') {
                  map.remove();
                }
              } catch (e) {
                // Ignore
              }
              delete (leafletEl as any)._leaflet_id;
              delete (leafletEl as any)._leaflet;
            }
            try {
              el.remove();
            } catch (e) {
              // Ignore if already removed
            }
          });
        }
        
        // Clear all Leaflet-related properties from the container
        delete (container as any)._leaflet_id;
        delete (container as any)._leaflet;
        
        // Reset destroyed flag for new instance
        isDestroyedRef.current = false;
        
        // Clear innerHTML to ensure no leftover DOM elements
        // But only if it's safe to do so (not during React render)
        const timer = setTimeout(() => {
          // Only proceed if this is still the current mount
          if (mountCountRef.current !== currentMount || isDestroyedRef.current) {
            return; // Component unmounted or destroyed, don't update state
          }
          
          // Double-check cleanup after a brief delay
          if (containerRef.current === container) {
            const remainingContainers = container.querySelectorAll('.leaflet-container');
            if (remainingContainers.length > 0) {
              remainingContainers.forEach((el) => {
                try {
                  el.remove();
                } catch (e) {
                  // Ignore
                }
              });
            }
          }
          
          // Only set canRender if this is still the current mount and not destroyed
          if (mountCountRef.current === currentMount && !isDestroyedRef.current) {
            setCanRender(true);
          }
        }, 150); // Increased delay to ensure cleanup completes

        return () => {
          clearTimeout(timer);
          cleanupMap(true);
          setCanRender(false);
        };
      }

      return () => {
        cleanupMap(true);
        setCanRender(false);
      };
    }, [viewMode]); // Depend on viewMode to re-run when it changes

    // Ref callback with cleanup
    const containerRefCallback = (node: HTMLDivElement | null) => {
      // Clean up previous container if it exists
      if (containerRef.current && containerRef.current !== node) {
        cleanupMap(true);
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
        ) : (
          <MapContainer
            key={`${mapKeyRef.current}-${viewMode || 'default'}`}
            center={center}
            zoom={13}
            style={{ height, width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            className="rounded-lg overflow-hidden"
            zoomControl={true}
            ref={(map) => {
              if (!map) return;
              
              // Don't initialize if we're cleaning up or destroyed
              if (isCleaningUpRef.current || isDestroyedRef.current) {
                return;
              }
              
              try {
                // Check if container already has a Leaflet instance
                if (containerRef.current) {
                  const existingContainers = containerRef.current.querySelectorAll('.leaflet-container');
                  if (existingContainers.length > 1) {
                    // Multiple containers detected - cleanup and skip
                    cleanupMap(true);
                    return;
                  }
                  
                  // Check if this container already has a Leaflet ID
                  if ((containerRef.current as any)._leaflet_id) {
                    // Container is already in use - cleanup first
                    cleanupMap(true);
                    // Wait for cleanup to complete before initializing
                    setTimeout(() => {
                      if (containerRef.current && !isInitializedRef.current && !isDestroyedRef.current && !isCleaningUpRef.current) {
                        // Double-check container is clean
                        if (!(containerRef.current as any)._leaflet_id) {
                          mapInstanceRef.current = map;
                          isInitializedRef.current = true;
                          isDestroyedRef.current = false;
                        }
                      }
                    }, 200);
                    return;
                  }
                  
                  // Check if map's container is already associated with another map
                  const mapAny = map as any;
                  if (mapAny._container && mapAny._container._leaflet_id) {
                    const existingMapId = mapAny._container._leaflet_id;
                    // If this container is already used by a different map instance, cleanup
                    if (mapInstanceRef.current) {
                      const currentMapAny = mapInstanceRef.current as any;
                      if (currentMapAny._leaflet_id !== existingMapId) {
                        cleanupMap(true);
                        return;
                      }
                    }
                  }
                }
                
                // Only initialize if we're not already initialized and not cleaning up
                if (!isInitializedRef.current && !isCleaningUpRef.current) {
                  mapInstanceRef.current = map;
                  isInitializedRef.current = true;
                  isDestroyedRef.current = false;
                } else if (isInitializedRef.current && mapInstanceRef.current !== map && !isCleaningUpRef.current) {
                  // Different map instance detected - cleanup old one first
                  try {
                    if (mapInstanceRef.current && typeof mapInstanceRef.current.remove === 'function') {
                      // Check if old map is still valid before removing
                      if (mapInstanceRef.current._container && mapInstanceRef.current._container.parentNode) {
                        mapInstanceRef.current.remove();
                      }
                    }
                  } catch (e) {
                    // Ignore cleanup errors
                  }
                  mapInstanceRef.current = map;
                  isDestroyedRef.current = false;
                }
              } catch (error: any) {
                // Catch "Map container is being reused" error
                if (error?.message?.includes('Map container is being reused')) {
                  console.warn('Map container reuse detected, cleaning up...');
                  cleanupMap(true);
                  // Don't retry here - let React handle remounting
                  isDestroyedRef.current = true;
                } else {
                  isDestroyedRef.current = true;
                  // Don't throw - let ErrorBoundary handle it
                  console.error('Map initialization error:', error);
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

