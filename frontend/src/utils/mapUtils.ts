import { Driveway, AvailabilityStatus } from '../types/map';

// Get availability status for a driveway
export const getAvailabilityStatus = (driveway: Driveway): AvailabilityStatus => {
  console.log('🔍 Checking availability for:', driveway.address, {
    isAvailable: driveway.isAvailable,
    availability: driveway.availability
  });
  
  // Check if driveway is globally available
  if (driveway.isAvailable === false) {
    console.log('❌ Driveway globally unavailable');
    return { 
      status: 'closed', 
      text: 'Unavailable', 
      color: '#E53E3E',
      isAvailable: false,
      priority: 'low'
    };
  }

  // Check day-specific availability using US timezone
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Get current day and time in US timezone
  const currentDayName = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    timeZone: 'America/New_York' 
  }).toLowerCase();
  
  const currentTime = now.toLocaleTimeString('en-US', { 
    timeZone: 'America/New_York',
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  console.log('📅 Current day:', currentDayName, 'Current time:', currentTime);
  
  // Find today's availability
  const todayAvailability = driveway.availability?.find(day => 
    day.dayOfWeek.toLowerCase() === currentDayName
  );
  
  console.log('📋 Today availability:', todayAvailability);
  
  if (!todayAvailability || !todayAvailability.isAvailable) {
    console.log('❌ No availability for today or not available');
    return { 
      status: 'closed', 
      text: 'Closed Today', 
      color: '#E53E3E',
      isAvailable: false,
      priority: 'low'
    };
  }
  
  // Check if current time is within available hours
  if (currentTime >= todayAvailability.startTime && currentTime <= todayAvailability.endTime) {
    console.log('✅ Available now!');
    return { 
      status: 'available', 
      text: 'Available Now', 
      color: '#00D4AA',
      isAvailable: true,
      priority: 'high'
    };
  } else if (currentTime < todayAvailability.startTime) {
    console.log('⏰ Opens later');
    return { 
      status: 'opens-later', 
      text: `Opens at ${todayAvailability.startTime}`, 
      color: '#FFB800',
      isAvailable: false,
      priority: 'medium'
    };
  } else {
    console.log('❌ Closed for today');
    return { 
      status: 'closed', 
      text: 'Closed for Today', 
      color: '#E53E3E',
      isAvailable: false,
      priority: 'low'
    };
  }
};

// Format distance for display
export const formatDistance = (distanceInMeters: number | undefined): string => {
  if (distanceInMeters === undefined) return 'N/A';
  if (distanceInMeters < 1000) {
    return `${distanceInMeters}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
};

// Format price for display
export const formatPrice = (price: number | string): string => {
  if (price === undefined || price === null) return 'N/A';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'N/A';
  return `$${numPrice.toFixed(2)}/hr`;
};

// Calculate walking time to driveway
export const calculateWalkingTime = (driveway: Driveway, userLocation: { lat: number; lng: number } | null): number => {
  if (!userLocation || !driveway.distance) return 0;
  
  const distance = driveway.distance; // distance in meters
  const walkingSpeed = 1.4; // m/s (average walking speed)
  const walkingTimeMinutes = Math.round((distance / walkingSpeed) / 60);
  
  return walkingTimeMinutes;
};

// Format walking time for display
export const formatWalkingTime = (walkingTimeMinutes: number): string => {
  if (walkingTimeMinutes < 1) return '< 1 min walk';
  if (walkingTimeMinutes === 1) return '1 min walk';
  return `${walkingTimeMinutes} min walk`;
};

// Generate coordinates if missing
export const ensureCoordinates = (driveway: Driveway, center: [number, number]): { lat: number; lng: number } => {
  // Check for coordinates in various possible formats
  if (driveway.coordinates && driveway.coordinates.lat && driveway.coordinates.lng) {
    return driveway.coordinates;
  }
  
  // Check for latitude/longitude fields (database format)
  if (driveway.latitude && driveway.longitude) {
    return {
      lat: parseFloat(driveway.latitude),
      lng: parseFloat(driveway.longitude)
    };
  }
  
  // If no coordinates found, use center with small offset based on address hash
  // This ensures consistent positioning for the same address
  const addressHash = driveway.address ? driveway.address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : Math.random() * 1000;
  
  const offsetLat = (addressHash % 100 - 50) * 0.0001; // ~10m offset
  const offsetLng = ((addressHash >> 8) % 100 - 50) * 0.0001;
  
  return {
    lat: center[0] + offsetLat,
    lng: center[1] + offsetLng
  };
};

// Calculate map bounds with smart padding
export const calculateMapBounds = (driveways: Driveway[], userLocation: { lat: number; lng: number } | null, padding: number = 0.1) => {
  if (driveways.length === 0 && !userLocation) {
    // Default bounds (Jersey City area)
    return [[40.7178, -74.0431], [40.7178, -74.0431]];
  }

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  
  // Add user location to bounds
  if (userLocation) {
    minLat = Math.min(minLat, userLocation.lat);
    maxLat = Math.max(maxLat, userLocation.lat);
    minLng = Math.min(minLng, userLocation.lng);
    maxLng = Math.max(maxLng, userLocation.lng);
  }
  
  // Add all driveways to bounds
  driveways.forEach(driveway => {
    const coords = ensureCoordinates(driveway, [40.7178, -74.0431]);
    minLat = Math.min(minLat, coords.lat);
    maxLat = Math.max(maxLat, coords.lat);
    minLng = Math.min(minLng, coords.lng);
    maxLng = Math.max(maxLng, coords.lng);
  });
  
  // Add padding to bounds
  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;
  
  // Ensure minimum bounds for single points
  const minBounds = 0.001; // ~100m
  const finalLatPadding = Math.max(latPadding, minBounds);
  const finalLngPadding = Math.max(lngPadding, minBounds);
  
  return [
    [minLat - finalLatPadding, minLng - finalLngPadding],
    [maxLat + finalLatPadding, maxLng + finalLngPadding]
  ];
};
