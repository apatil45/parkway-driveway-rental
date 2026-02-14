/**
 * Driveway as returned by the search/list API (includes owner for display).
 * Use this type for search results and list cards.
 */
export interface SearchDriveway {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  capacity: number;
  carSize: string[];
  amenities: string[];
  images: string[];
  isActive: boolean;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  distance?: number;
}

export interface DrivewayPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
