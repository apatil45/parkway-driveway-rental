'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { mapService } from '@/services/MapService';

const MAPBOX_ACCESS_TOKEN = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN : undefined;

interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  price: number;
  address?: string;
  rating?: number;
  image?: string;
}

/** Apply small offsets to markers at the same location so pins don't overlap. */
function spreadOverlappingMarkers(markers: MapMarker[]): MapMarker[] {
  const key = (p: [number, number]) => `${Math.round(p[0] * 10000) / 10000},${Math.round(p[1] * 10000) / 10000}`;
  const groups = new Map<string, MapMarker[]>();
  markers.forEach((m) => {
    const k = key(m.position);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  });
  const out: MapMarker[] = [];
  const offsetDeg = 0.00015;
  groups.forEach((group) => {
    if (group.length <= 1) {
      out.push(...group);
      return;
    }
    group.forEach((m, i) => {
      const angle = (i / group.length) * 2 * Math.PI;
      out.push({
        ...m,
        position: [
          m.position[0] + Math.cos(angle) * offsetDeg,
          m.position[1] + Math.sin(angle) * offsetDeg,
        ],
      });
    });
  });
  return out;
}

/** Neutral light gray roads on clean base — no yellow/orange tint (Leaflet tiles) */
function getTileFilterForZoom(zoom: number): string {
  if (zoom >= 10) return 'grayscale(0.5) contrast(1.04) brightness(1.02)';
  if (zoom >= 6) return 'grayscale(0.4) contrast(1.02) brightness(1)';
  return 'grayscale(0.35) contrast(1.01) brightness(1)';
}

/** Apply custom Mapbox style: neutral light gray roads (no yellow/orange), water #B8D4E8, suppress POI. */
function applyMapboxStyleOverrides(map: any) {
  try {
    const style = map.getStyle();
    if (!style?.layers) return;
    const layers = style.layers as { id: string; type?: string }[];
    const minorGray = '#E8E8E8';
    const majorGray = '#D0D0D0';
    for (const layer of layers) {
      const id = (layer.id || '').toLowerCase();
      const isPoiLike = /poi|point-of-interest|place-label|airport|building-label|mountain|attraction|shop|restaurant|cafe|park-label/.test(id);
      const isTransit = /transit|rail|station|bus|stop|ferry|subway|metro/.test(id);
      if (isPoiLike && !isTransit) {
        try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_) {}
      }
      // Remove yellow/orange from road layers: neutral light grays only
      if (/road/.test(id)) {
        try {
          if (map.getLayer(layer.id) && map.getPaintProperty(layer.id, 'line-color') !== undefined) {
            const isMajor = /motorway|trunk|primary|secondary|tertiary/.test(id);
            map.setPaintProperty(layer.id, 'line-color', isMajor ? majorGray : minorGray);
          }
        } catch (_) {}
      }
    }
    try { map.setPaintProperty('background', 'background-color', '#FFFFFF'); } catch (_) {}
    try { map.setPaintProperty('water', 'fill-color', '#B8D4E8'); } catch (_) {}
    try { map.setPaintProperty('waterway', 'line-color', '#B8D4E8'); } catch (_) {}
    const majorRoadIds = ['road-motorway-trunk', 'road-primary-secondary-tertiary', 'road-motorway-trunk-case', 'road-primary-secondary-tertiary-case'];
    for (const lid of majorRoadIds) {
      try {
        if (map.getLayer(lid)) {
          const w = map.getPaintProperty(lid, 'line-width');
          if (typeof w === 'number') map.setPaintProperty(lid, 'line-width', Math.min(4, (w as number) * 1.5));
        }
      } catch (_) {}
    }
  } catch (_) {}
}

/** Add Mapbox markers (price pins) so they stay visually dominant on top of the map */
function addMapboxMarkers(
  mapboxgl: any,
  map: any,
  markers: MapMarker[],
  onMarkerClick?: (id: string) => void,
  highlightedId?: string | null,
  onMarkerHover?: (id: string | null) => void,
  outInstances?: React.MutableRefObject<any[]>
) {
  const instances: any[] = [];
  markers.forEach((marker) => {
    const isHighlighted = highlightedId === marker.id;
    const el = document.createElement('div');
    el.className = `custom-marker price-pin${isHighlighted ? ' price-pin-highlighted' : ''} mapbox-price-pin`;
    el.innerHTML = `<div class="price-pin-wrapper"><span class="price-pin-value">$${marker.price % 1 === 0 ? marker.price.toFixed(0) : marker.price.toFixed(1)}</span></div>`;
    const mbMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(marker.position)
      .setPopup(
        new mapboxgl.Popup({ offset: 20 }).setHTML(`
          ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="w-full h-24 object-cover rounded mb-2" />` : ''}
          <div class="text-sm font-semibold text-gray-900 mb-1">${marker.title}</div>
          ${marker.address ? `<div class="text-xs text-gray-600 mb-2">${marker.address}</div>` : ''}
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-bold text-primary-600">$${marker.price.toFixed(2)}/hr</span>
            ${marker.rating ? `<span class="text-xs text-gray-600">★ ${marker.rating.toFixed(1)}</span>` : ''}
          </div>
          <a href="/driveway/${marker.id}" class="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 mt-2 py-1.5">Reserve</a>
        `)
      )
      .addTo(map);
    el.addEventListener('click', () => onMarkerClick?.(marker.id));
    el.addEventListener('mouseenter', () => onMarkerHover?.(marker.id));
    el.addEventListener('mouseleave', () => onMarkerHover?.(null));
    instances.push(mbMarker);
  });
  if (outInstances) outInstances.current = instances;
  return instances;
}

/** Create price-pin icon and add one Leaflet marker per map marker; returns instances for cleanup */
function addMarkersToMap(
  L: any,
  map: any,
  markers: MapMarker[],
  onMarkerClick?: (id: string) => void,
  highlightedId?: string | null,
  onMarkerHover?: (id: string | null) => void
): any[] {
  const instances: any[] = [];
  markers.forEach((marker) => {
    const isHighlighted = highlightedId === marker.id;
    const icon = L.divIcon({
      className: `custom-marker price-pin${isHighlighted ? ' price-pin-highlighted' : ''}`,
      html: `<div class="price-pin-wrapper"><span class="price-pin-value">$${marker.price % 1 === 0 ? marker.price.toFixed(0) : marker.price.toFixed(1)}</span></div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44],
    });
    const leafletMarker = L.marker(marker.position, { icon });

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
      <a href="/driveway/${marker.id}" class="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 mt-2 py-1.5">Reserve</a>
    `;
    leafletMarker.bindPopup(popupContent, { closeButton: true, autoClose: false });
    leafletMarker.on('click', () => onMarkerClick?.(marker.id));
    leafletMarker.on('mouseover', () => onMarkerHover?.(marker.id));
    leafletMarker.on('mouseout', () => onMarkerHover?.(null));
    leafletMarker.addTo(map);
    instances.push(leafletMarker);
  });
  return instances;
}

interface MapViewDirectProps {
  center: [number, number];
  markers: MapMarker[];
  height?: string;
  viewMode?: string;
  onMarkerClick?: (id: string) => void;
  /** When set, this marker pin is shown with a highlight (e.g. hover sync with list) */
  highlightedMarkerId?: string | null;
  /** Called when user hovers a pin (for list↔pin sync) */
  onMarkerHover?: (id: string | null) => void;
}

export default function MapViewDirect({
  center,
  markers,
  height = '100%',
  viewMode,
  onMarkerClick,
  highlightedMarkerId = null,
  onMarkerHover,
}: MapViewDirectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null); // Leaflet or Mapbox map instance
  const markersRef = useRef<any[]>([]);
  const mapTypeRef = useRef<'leaflet' | 'mapbox'>('leaflet');
  const centerRef = useRef(center);
  centerRef.current = center;
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Generate stable container ID
  const containerId = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `map-${crypto.randomUUID()}`;
    }
    return `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const spreadMarkers = useMemo(() => spreadOverlappingMarkers(markers), [markers]);

  // Initialize map once per container (do not depend on center — updates handled by separate effect)
  useEffect(() => {
    let isMounted = true;
    const useMapbox = Boolean(MAPBOX_ACCESS_TOKEN);
    const initialCenter = centerRef.current;

    const initMap = async () => {
      const container = containerRef.current;
      if (!container || !container.isConnected) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setMapError(null);
        }

        if (!mapService.isContainerSafe(container)) {
          mapService.cleanContainer(container);
          await new Promise((r) => requestAnimationFrame(r));
        }
        if (!isMounted) return;

        if (!mapService.isContainerSafe(container)) {
          if (isMounted) {
            setMapError('Map container is not ready');
            setIsLoading(false);
          }
          return;
        }

        if (useMapbox) {
          const mapboxgl = (await import('mapbox-gl')).default;
          if (!isMounted) return;
          if (containerRef.current !== container || !mapService.isContainerSafe(container)) {
            if (isMounted) setIsLoading(false);
            return;
          }
          (mapboxgl as any).accessToken = MAPBOX_ACCESS_TOKEN;
          const map = new mapboxgl.Map({
            container,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [initialCenter[0], initialCenter[1]],
            zoom: 13,
          });
          if (!isMounted) {
            try { map.remove(); } catch (_) {}
            return;
          }
          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.on('load', () => {
            if (!isMounted) return;
            applyMapboxStyleOverrides(map);
          });
          mapRef.current = map;
          mapTypeRef.current = 'mapbox';
          mapService.registerMap(containerId, map, container);
          map.once('load', () => {
            if (!isMounted || !mapRef.current) return;
            addMapboxMarkers(mapboxgl, mapRef.current, spreadMarkers, onMarkerClick, highlightedMarkerId, onMarkerHover, markersRef);
          });
        } else {
          const L = (await import('leaflet')).default;
          if (!isMounted) return;
          if (containerRef.current !== container || !mapService.isContainerSafe(container)) {
            if (isMounted) setIsLoading(false);
            return;
          }
          const map = L.map(container, {
            center: initialCenter,
            zoom: 13,
            zoomControl: true,
          });
          if (!isMounted) {
            try { if (map.remove) map.remove(); } catch (_) {}
            return;
          }
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
          }).addTo(map);
          mapRef.current = map;
          mapTypeRef.current = 'leaflet';
          mapService.registerMap(containerId, map, container);
          markersRef.current = addMarkersToMap(L, map, spreadMarkers, onMarkerClick, highlightedMarkerId, onMarkerHover);
          map.setView(initialCenter, map.getZoom());
          const applyZoomStyle = () => {
            try {
              const pane = map.getContainer()?.querySelector('.leaflet-tile-pane') as HTMLElement | null;
              if (pane) pane.style.filter = getTileFilterForZoom(map.getZoom());
            } catch (_) {}
          };
          map.on('zoomend', applyZoomStyle);
          setTimeout(applyZoomStyle, 50);
        }

        if (!isMounted) return;
        setTimeout(() => {
          if (!isMounted || !mapRef.current || !containerRef.current) return;
          try {
            if (mapRef.current.invalidateSize) mapRef.current.invalidateSize();
            else if (mapRef.current.resize) mapRef.current.resize();
          } catch (_) {}
        }, 100);

        if (isMounted) setIsLoading(false);
      } catch (error: any) {
        if (isMounted) {
          setMapError(error?.message || 'Failed to initialize map');
          setIsLoading(false);
        }
      }
    };

    // Defer so ref is committed and we avoid racing with Strict Mode double-invoke
    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) {
        setIsLoading(false);
        return;
      }
      initMap();
    });

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker: any) => {
          try {
            if (mapRef.current) {
              if (mapRef.current.removeLayer) mapRef.current.removeLayer(marker);
              else if (marker.remove) marker.remove();
            }
          } catch (_) {}
        });
        markersRef.current = [];
      }
      if (mapRef.current) {
        mapService.destroyMap(containerId);
        try {
          if (mapRef.current.remove) mapRef.current.remove();
        } catch (_) {}
        mapRef.current = null;
      }
      if (containerRef.current) mapService.cleanContainer(containerRef.current);
    };
  }, [containerId]);

  // Update map center when it changes
  useEffect(() => {
    if (!mapRef.current || !center) return;
    try {
      if (mapTypeRef.current === 'mapbox') {
        mapRef.current.flyTo({ center: [center[0], center[1]], duration: 300 });
      } else {
        const zoom = mapRef.current.getZoom();
        mapRef.current.setView(center, zoom);
      }
    } catch (_) {}
  }, [center]);

  // Update markers when they change (or when highlight changes)
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m: any) => {
      try {
        if (mapRef.current?.removeLayer) mapRef.current.removeLayer(m);
        else if (m?.remove) m.remove();
      } catch (_) {}
    });
    markersRef.current = [];
    if (markers.length === 0) return;

    if (mapTypeRef.current === 'mapbox') {
      (async () => {
        try {
          const mapboxgl = (await import('mapbox-gl')).default;
          addMapboxMarkers(mapboxgl, mapRef.current!, spreadMarkers, onMarkerClick, highlightedMarkerId, onMarkerHover, markersRef);
        } catch (_) {}
      })();
    } else {
      (async () => {
        try {
          const L = (await import('leaflet')).default;
          markersRef.current = addMarkersToMap(L, mapRef.current!, spreadMarkers, onMarkerClick, highlightedMarkerId, onMarkerHover);
        } catch (_) {}
      })();
    }
  }, [markers, onMarkerClick, highlightedMarkerId, onMarkerHover]);

  useEffect(() => {
    const onResize = () => {
      setTimeout(() => {
        const m = mapRef.current;
        if (!m) return;
        try {
          if (m.resize) m.resize();
          else {
            const el = m.getContainer?.() ?? m._container;
            if (el?.offsetWidth) m.invalidateSize();
          }
        } catch (_) {}
      }, 100);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Map container must be an empty div so Leaflet owns its children - no React children
  // inside it. Otherwise React's removeChild conflicts with Leaflet's DOM (NotFoundError).
  return (
    <div
      style={{ height, width: '150%', position: 'relative', zIndex: 0 }}
      className="rounded-lg overflow-auto"
    >
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
