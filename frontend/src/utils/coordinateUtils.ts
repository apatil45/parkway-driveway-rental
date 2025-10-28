/**
 * Coordinate utility functions for map handling
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DrivewayWithCoords {
  id: string;
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  coordinates?: Coordinates;
  [key: string]: any;
}

/**
 * Ensure a driveway has valid coordinates
 * @param driveway - The driveway object
 * @param fallbackCenter - Fallback coordinates if none exist
 * @returns Coordinates object
 */
export function ensureCoordinates(
  driveway: DrivewayWithCoords, 
  fallbackCenter: [number, number] = [40.7178, -74.0431]
): Coordinates {
  // If coordinates already exist, use them
  if (driveway.coordinates?.lat && driveway.coordinates?.lng) {
    return {
      lat: typeof driveway.coordinates.lat === 'string' 
        ? parseFloat(driveway.coordinates.lat) 
        : driveway.coordinates.lat,
      lng: typeof driveway.coordinates.lng === 'string' 
        ? parseFloat(driveway.coordinates.lng) 
        : driveway.coordinates.lng
    };
  }

  // If latitude/longitude exist, use them
  if (driveway.latitude && driveway.longitude) {
    return {
      lat: typeof driveway.latitude === 'string' 
        ? parseFloat(driveway.latitude) 
        : driveway.latitude,
      lng: typeof driveway.longitude === 'string' 
        ? parseFloat(driveway.longitude) 
        : driveway.longitude
    };
  }

  // Generate coordinates based on address hash for consistency
  const addressHash = hashString(driveway.address);
  const offsetLat = (addressHash % 1000) / 100000; // ~100m offset
  const offsetLng = ((addressHash >> 10) % 1000) / 100000;
  
  return {
    lat: fallbackCenter[0] + offsetLat,
    lng: fallbackCenter[1] + offsetLng
  };
}

/**
 * Calculate distance between two coordinates
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance * 1000; // Convert to meters
}

/**
 * Calculate map bounds for a set of driveways and user location
 * @param driveways - Array of driveways
 * @param userLocation - User's current location
 * @param padding - Padding factor (0.1 = 10% padding)
 * @returns Bounds as [southwest, northeast] coordinates
 */
export function calculateMapBounds(
  driveways: DrivewayWithCoords[], 
  userLocation: Coordinates | null, 
  padding: number = 0.1
): [Coordinates, Coordinates] {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  // Include user location
  if (userLocation) {
    minLat = Math.min(minLat, userLocation.lat);
    maxLat = Math.max(maxLat, userLocation.lat);
    minLng = Math.min(minLng, userLocation.lng);
    maxLng = Math.max(maxLng, userLocation.lng);
  }

  // Include all driveways
  driveways.forEach(driveway => {
    const coords = ensureCoordinates(driveway);
    minLat = Math.min(minLat, coords.lat);
    maxLat = Math.max(maxLat, coords.lat);
    minLng = Math.min(minLng, coords.lng);
    maxLng = Math.max(maxLng, coords.lng);
  });

  // Add padding
  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;

  return [
    { lat: minLat - latPadding, lng: minLng - lngPadding },
    { lat: maxLat + latPadding, lng: maxLng + lngPadding }
  ];
}

/**
 * Simple hash function for string to number
 * @param str - String to hash
 * @returns Hash number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Transform driveway data for frontend compatibility
 * @param driveway - Raw driveway data from API
 * @returns Transformed driveway data
 */
export function transformDrivewayData(driveway: any): DrivewayWithCoords {
  return {
    id: driveway.id,
    address: driveway.address,
    description: driveway.description,
    pricePerHour: parseFloat(driveway.price_per_hour || driveway.pricePerHour || 0),
    images: driveway.images || [],
    rating: driveway.rating || 0,
    distance: driveway.distance,
    coordinates: driveway.coordinates,
    latitude: driveway.latitude,
    longitude: driveway.longitude,
    amenities: driveway.amenities || [],
    features: driveway.features || [],
    owner: driveway.owner || driveway.users,
    isAvailable: driveway.is_available || driveway.isAvailable || true,
    drivewaySize: driveway.driveway_size || driveway.drivewaySize,
    carSizeCompatibility: driveway.car_size_compatibility || driveway.carSizeCompatibility || []
  };
}
