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
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    // Cleanup function - made more aggressive and synchronous
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
      
      // Synchronously remove map instance
      if (mapInstanceRef.current) {
        try {
          const map = mapInstanceRef.current;
          // Check if map is still valid before removing
          if (map._container && map._container.parentNode) {
            try {
              // Check if this map instance is actually the one associated with the container
              const containerId = (map._container as any)._leaflet_id;
              const containerMap = (map._container as any)._leaflet;
              
              // Only remove if this is the correct map instance
              if (containerMap === map || !containerMap) {
                map.remove();
              } else {
                // Container is associated with a different map - just clear it
                console.warn('Map instance mismatch during cleanup, clearing container directly');
                map._container.innerHTML = '';
                delete (map._container as any)._leaflet_id;
                delete (map._container as any)._leaflet;
              }
            } catch (e: any) {
              // Catch "Map container is being reused" error specifically
              if (e?.message?.includes('Map container is being reused')) {
                console.warn('Container reuse detected during cleanup, clearing directly');
                try {
                  if (map._container) {
                    map._container.innerHTML = '';
                    delete (map._container as any)._leaflet_id;
                    delete (map._container as any)._leaflet;
                  }
                } catch (e2) {
                  // Ignore
                }
              } else {
                // Other errors - try to clear the container directly
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
          }
        } catch (e) {
          // Ignore cleanup errors - map may already be removed
        }
        mapInstanceRef.current = null;
      }
      
      // Synchronously clean up container
      if (containerRef.current) {
        const container = containerRef.current;
        if (container) {
          // Remove any Leaflet containers inside - do this synchronously
          const leafletContainers = container.querySelectorAll('.leaflet-container');
          leafletContainers.forEach((el) => {
            const leafletEl = el as HTMLElement;
            if ((leafletEl as any)._leaflet_id) {
              try {
                const map = (leafletEl as any)._leaflet;
                if (map && typeof map.remove === 'function') {
                  try {
                    // Check if map container still exists before removing
                    if (map._container && map._container.parentNode) {
                      // Verify this is the correct map instance
                      const containerId = (map._container as any)._leaflet_id;
                      const containerMap = (map._container as any)._leaflet;
                      
                      if (containerMap === map || !containerMap) {
                        map.remove();
                      } else {
                        // Different map instance - clear directly
                        map._container.innerHTML = '';
                        delete (map._container as any)._leaflet_id;
                        delete (map._container as any)._leaflet;
                      }
                    }
                  } catch (e: any) {
                    // Catch "Map container is being reused" error
                    if (e?.message?.includes('Map container is being reused')) {
                      // Just clear the container - don't try to remove
                      try {
                        if (map._container) {
                          map._container.innerHTML = '';
                          delete (map._container as any)._leaflet_id;
                          delete (map._container as any)._leaflet;
                        }
                      } catch (e2) {
                        // Ignore
                      }
                    } else {
                      // Other errors - clear the container
                      try {
                        if (map._container) {
                          map._container.innerHTML = '';
                        }
                      } catch (e2) {
                        // Ignore
                      }
                    }
                  }
                }
              } catch (e) {
                // Ignore - map may already be removed
              }
              // Always clear Leaflet tracking
              delete (leafletEl as any)._leaflet_id;
              delete (leafletEl as any)._leaflet;
            }
            // Remove the element itself
            try {
              if (el.parentNode) {
                el.remove();
              }
            } catch (e) {
              // Ignore if already removed
            }
          });
          
          // Also check for any Leaflet instances that might be attached to the container itself
          if ((container as any)._leaflet_id) {
            try {
              const map = (container as any)._leaflet;
              if (map && typeof map.remove === 'function') {
                try {
                  map.remove();
                } catch (e) {
                  // Ignore
                }
              }
            } catch (e) {
              // Ignore
            }
            delete (container as any)._leaflet_id;
            delete (container as any)._leaflet;
          }
          
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

    // Cleanup on unmount - make it synchronous and immediate
    useEffect(() => {
      return () => {
        // Immediately mark as destroyed to prevent any new operations
        isDestroyedRef.current = true;
        isCleaningUpRef.current = true;
        
        // Clear any pending timeouts
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
          cleanupTimeoutRef.current = null;
        }
        
        // Force immediate cleanup
        cleanupMap(true);
        
        // Prevent any state updates on unmounted component
        setCanRender(false);
        isInitializedRef.current = false;
        mapInstanceRef.current = null;
      };
    }, []);

    // Synchronous cleanup before render (useLayoutEffect runs before browser paints)
    useLayoutEffect(() => {
      mountCountRef.current += 1;
      const currentMount = mountCountRef.current;
      
      // Reset navigation flag
      isNavigatingRef.current = false;
      
      // Always start with cleanup to ensure clean state
      cleanupMap(true); // Force cleanup
      setCanRender(false);
      
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Aggressively clean up any existing map instances SYNCHRONOUSLY
        // Remove all Leaflet containers and their content
        const leafletContainers = container.querySelectorAll('.leaflet-container');
        leafletContainers.forEach((el) => {
          const leafletEl = el as HTMLElement;
          if ((leafletEl as any)._leaflet_id) {
            try {
              const map = (leafletEl as any)._leaflet;
              if (map && typeof map.remove === 'function') {
                try {
                  // Verify this is the correct map instance before removing
                  if (map._container) {
                    const containerMap = (map._container as any)._leaflet;
                    if (containerMap === map || !containerMap) {
                      map.remove();
                    } else {
                      // Different instance - clear directly
                      map._container.innerHTML = '';
                      delete (map._container as any)._leaflet_id;
                      delete (map._container as any)._leaflet;
                    }
                  }
                } catch (e: any) {
                  // Catch "Map container is being reused" error
                  if (e?.message?.includes('Map container is being reused')) {
                    // Just clear - don't try to remove
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
                  try {
                    // Verify this is the correct map instance before removing
                    if (map._container) {
                      const containerMap = (map._container as any)._leaflet;
                      if (containerMap === map || !containerMap) {
                        map.remove();
                      } else {
                        // Different instance - clear directly
                        map._container.innerHTML = '';
                        delete (map._container as any)._leaflet_id;
                        delete (map._container as any)._leaflet;
                      }
                    }
                  } catch (e: any) {
                    // Catch "Map container is being reused" error
                    if (e?.message?.includes('Map container is being reused')) {
                      // Just clear - don't try to remove
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
        
        // Clear all Leaflet-related properties from the container SYNCHRONOUSLY
        delete (container as any)._leaflet_id;
        delete (container as any)._leaflet;
        
        // CRITICAL: Clear innerHTML immediately to remove any leftover Leaflet DOM
        // This must be done synchronously before React tries to render MapContainer
        try {
          // Only clear if there are Leaflet elements
          const hasLeafletElements = container.querySelector('.leaflet-container');
          if (hasLeafletElements) {
            container.innerHTML = '';
          }
        } catch (e) {
          // Ignore - container might be removed
        }
        
        // Reset destroyed flag for new instance
        isDestroyedRef.current = false;
        
        // Set canRender immediately after synchronous cleanup
        // No delay - we've already cleaned up synchronously
        if (mountCountRef.current === currentMount && !isDestroyedRef.current && !isNavigatingRef.current) {
          setCanRender(true);
        }

        return () => {
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
                // If map is null, it means it's being unmounted - cleanup immediately
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
              
              // Don't initialize if we're cleaning up, destroyed, or navigating
              if (isCleaningUpRef.current || isDestroyedRef.current || isNavigatingRef.current) {
                return;
              }
              
              // CRITICAL CHECK: If container has ANY Leaflet tracking, don't initialize
              // This prevents the "Map container is being reused" error
              if (containerRef.current) {
                const container = containerRef.current;
                
                // Check if container itself has Leaflet tracking
                if ((container as any)._leaflet_id) {
                  console.warn('Container has _leaflet_id, cleaning up before initialization');
                  cleanupMap(true);
                  // Clear it again to be sure
                  delete (container as any)._leaflet_id;
                  delete (container as any)._leaflet;
                  // Don't initialize - let React remount with clean state
                  return;
                }
                
                // Check if container has any Leaflet containers inside
                const leafletContainers = container.querySelectorAll('.leaflet-container');
                if (leafletContainers.length > 0) {
                  console.warn('Container has Leaflet elements, cleaning up before initialization');
                  cleanupMap(true);
                  // Clear innerHTML to remove all Leaflet elements
                  try {
                    container.innerHTML = '';
                  } catch (e) {
                    // Ignore
                  }
                  // Don't initialize - let React remount with clean state
                  return;
                }
                
                // Check if the map's container already has a Leaflet ID
                const mapAny = map as any;
                if (mapAny._container && (mapAny._container as any)._leaflet_id) {
                  console.warn('Map container already has _leaflet_id, cleaning up');
                  cleanupMap(true);
                  delete (mapAny._container as any)._leaflet_id;
                  delete (mapAny._container as any)._leaflet;
                  return;
                }
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
                    // Container is already in use - cleanup first synchronously
                    cleanupMap(true);
                    // Don't initialize if container is still marked as in use
                    if ((containerRef.current as any)._leaflet_id) {
                      return;
                    }
                  }
                  
                  // Check if map's container is already associated with another map
                  const mapAny = map as any;
                  if (mapAny._container) {
                    // Check if container has a Leaflet ID that doesn't match this map
                    if (mapAny._container._leaflet_id) {
                      // If we have a different map instance, cleanup first
                      if (mapInstanceRef.current) {
                        const currentMapAny = mapInstanceRef.current as any;
                        if (currentMapAny._leaflet_id && currentMapAny._leaflet_id !== mapAny._container._leaflet_id) {
                          cleanupMap(true);
                          return;
                        }
                      }
                    }
                  }
                }
                
                // Only initialize if we're not already initialized and not cleaning up
                if (!isInitializedRef.current && !isCleaningUpRef.current && !isDestroyedRef.current) {
                  mapInstanceRef.current = map;
                  isInitializedRef.current = true;
                  isDestroyedRef.current = false;
                } else if (isInitializedRef.current && mapInstanceRef.current !== map && !isCleaningUpRef.current && !isDestroyedRef.current) {
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

