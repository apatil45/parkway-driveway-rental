// Unified types for the map system
export interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number | string;
  images: string[];
  rating: number;
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  latitude?: number | string;
  longitude?: number | string;
  amenities?: string[];
  features?: string[];
  owner?: {
    name: string;
    rating: number;
  };
  availability?: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  isAvailable?: boolean;
  drivewaySize?: 'small' | 'medium' | 'large' | 'extra-large';
  carSizeCompatibility?: string[];
  totalEarnings?: number;
  bookingsCount?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  type: 'driveway' | 'user';
  data: Driveway | UserLocation;
  status: 'available' | 'opens-later' | 'closed';
  isSelected: boolean;
}

export interface AvailabilityStatus {
  status: 'available' | 'opens-later' | 'closed';
  text: string;
  color: string;
  isAvailable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface MapViewProps {
  driveways: Driveway[];
  userLocation: UserLocation | null;
  onDrivewaySelect: (driveway: Driveway) => void;
  selectedDriveway: Driveway | null;
  height?: number;
  showLegend?: boolean;
  showControls?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}
