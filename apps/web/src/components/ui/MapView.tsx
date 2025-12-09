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
    const mapInstanceRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isInitializedRef = useRef(false);
    const mapKeyRef = useRef<string>(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const [canRender, setCanRender] = useState(false);
    const mountCountRef = useRef(0);

    // Component to handle map updates
    const MapUpdater = ({ center }: { center: [number, number] }) => {
      const map = useMap();
      
      useEffect(() => {
        if (map && center) {
          map.setView(center, map.getZoom());
          // Invalidate size to fix rendering issues
          setTimeout(() => {
            map.invalidateSize();
          }, 100);
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
            map.invalidateSize();
          }, 100);
        };

        window.addEventListener('resize', handleResize);
        
        // Initial resize after mount
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, [map]);

      return null;
    };

    // Cleanup function
    const cleanupMap = () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
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
                  map.remove();
                }
              } catch (e) {
                // Ignore
              }
              delete (leafletEl as any)._leaflet_id;
              delete (leafletEl as any)._leaflet;
            }
            el.remove();
          });
          // Clear container tracking
          delete (container as any)._leaflet_id;
        }
      }
      isInitializedRef.current = false;
    };

    // Synchronous cleanup before render (useLayoutEffect runs before browser paints)
    useLayoutEffect(() => {
      mountCountRef.current += 1;
      const currentMount = mountCountRef.current;
      
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Clean up any existing map instances (from previous mount)
        if ((container as any)._leaflet_id) {
          cleanupMap();
        }
        const leafletContainers = container.querySelectorAll('.leaflet-container');
        if (leafletContainers.length > 0) {
          cleanupMap();
        }
        
        // Small delay to ensure cleanup is complete before rendering
        // This prevents race condition between cleanup and initialization
        const timer = setTimeout(() => {
          // Only set canRender if this is still the current mount
          // (prevents state updates from stale mounts)
          if (mountCountRef.current === currentMount) {
            setCanRender(true);
          }
        }, 10);

        return () => {
          clearTimeout(timer);
          cleanupMap();
          setCanRender(false);
        };
      }

      return () => {
        cleanupMap();
        setCanRender(false);
      };
    }, []);

    // Ref callback
    const containerRefCallback = (node: HTMLDivElement | null) => {
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
            key={mapKeyRef.current}
            center={center}
            zoom={13}
            style={{ height, width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            className="rounded-lg overflow-hidden"
            zoomControl={true}
            ref={(map) => {
              if (map && !isInitializedRef.current) {
                mapInstanceRef.current = map;
                isInitializedRef.current = true;
            } else if (map && isInitializedRef.current) {
              // If already initialized, don't create another instance
              // Silently skip - this is expected in StrictMode
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
  onMarkerClick
}: {
  center: [number, number];
  markers: MapMarker[];
  height?: string;
  onMarkerClick?: (id: string) => void;
}) {
  return <LeafletMap center={center} markers={markers} height={height} onMarkerClick={onMarkerClick} />;
}

