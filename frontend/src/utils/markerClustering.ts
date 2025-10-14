import { Driveway } from '../types/map';

export interface ClusterGroup {
  center: { lat: number; lng: number };
  driveways: Driveway[];
  count: number;
  bounds: { north: number; south: number; east: number; west: number };
}

// Calculate distance between two points in meters
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Group markers by proximity
export const groupMarkersByProximity = (driveways: Driveway[], maxDistance: number = 100): ClusterGroup[] => {
  const clusters: ClusterGroup[] = [];
  const processed = new Set<string>();

  driveways.forEach((driveway, index) => {
    if (processed.has(driveway.id)) return;

    const cluster: ClusterGroup = {
      center: { lat: driveway.coordinates?.lat || 0, lng: driveway.coordinates?.lng || 0 },
      driveways: [driveway],
      count: 1,
      bounds: {
        north: driveway.coordinates?.lat || 0,
        south: driveway.coordinates?.lat || 0,
        east: driveway.coordinates?.lng || 0,
        west: driveway.coordinates?.lng || 0
      }
    };

    processed.add(driveway.id);

    // Find nearby driveways
    driveways.forEach((otherDriveway, otherIndex) => {
      if (index === otherIndex || processed.has(otherDriveway.id)) return;

      const distance = calculateDistance(
        driveway.coordinates?.lat || 0,
        driveway.coordinates?.lng || 0,
        otherDriveway.coordinates?.lat || 0,
        otherDriveway.coordinates?.lng || 0
      );

      if (distance <= maxDistance) {
        cluster.driveways.push(otherDriveway);
        cluster.count++;
        processed.add(otherDriveway.id);

        // Update cluster center (average position)
        cluster.center.lat = cluster.driveways.reduce((sum, d) => sum + (d.coordinates?.lat || 0), 0) / cluster.driveways.length;
        cluster.center.lng = cluster.driveways.reduce((sum, d) => sum + (d.coordinates?.lng || 0), 0) / cluster.driveways.length;

        // Update bounds
        cluster.bounds.north = Math.max(cluster.bounds.north, otherDriveway.coordinates?.lat || 0);
        cluster.bounds.south = Math.min(cluster.bounds.south, otherDriveway.coordinates?.lat || 0);
        cluster.bounds.east = Math.max(cluster.bounds.east, otherDriveway.coordinates?.lng || 0);
        cluster.bounds.west = Math.min(cluster.bounds.west, otherDriveway.coordinates?.lng || 0);
      }
    });

    clusters.push(cluster);
  });

  return clusters;
};

// Determine if clustering should be applied based on zoom level and marker count
export const shouldClusterMarkers = (zoomLevel: number, markerCount: number): boolean => {
  // Cluster when zoomed out (zoom < 14) or when there are many markers (> 20)
  return zoomLevel < 14 || markerCount > 20;
};

// Get cluster distance based on zoom level
export const getClusterDistance = (zoomLevel: number): number => {
  if (zoomLevel < 10) return 500; // 500m for very zoomed out
  if (zoomLevel < 12) return 200; // 200m for zoomed out
  if (zoomLevel < 14) return 100; // 100m for medium zoom
  return 50; // 50m for close zoom
};
