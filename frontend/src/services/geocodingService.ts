interface GeocodingResponse {
  latitude: number;
  longitude: number;
}

interface GeocodingError {
  success: false;
  error: string;
  message: string;
}

interface AddressSuggestion {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  distance?: number; // Distance in kilometers from user location
  formattedAddress?: string;
}

class GeocodingService {
  private baseUrl = '/api/geocoding';

  /**
   * Geocode an address to latitude and longitude coordinates
   * @param address - The address to geocode
   * @returns Promise with latitude and longitude coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResponse> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address is required for geocoding');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!response.ok) {
        const errorData: GeocodingError = await response.json();
        throw new Error(errorData.message || `Geocoding failed with status ${response.status}`);
      }

      const data: GeocodingResponse = await response.json();
      
      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid geocoding response: missing coordinates');
      }

      return data;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error instanceof Error ? error : new Error('Failed to geocode address');
    }
  }

  /**
   * Geocode multiple addresses in parallel
   * @param addresses - Array of addresses to geocode
   * @returns Promise with array of geocoding results
   */
  async geocodeAddresses(addresses: string[]): Promise<Array<GeocodingResponse & { address: string }>> {
    if (!addresses || addresses.length === 0) {
      return [];
    }

    const geocodingPromises = addresses.map(async (address) => {
      try {
        const result = await this.geocodeAddress(address);
        return { ...result, address };
      } catch (error) {
        console.error(`Failed to geocode address "${address}":`, error);
        throw error;
      }
    });

    return Promise.all(geocodingPromises);
  }

  /**
   * Validate if coordinates are within reasonable bounds
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns boolean indicating if coordinates are valid
   */
  isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 - First latitude
   * @param lon1 - First longitude
   * @param lat2 - Second latitude
   * @param lon2 - Second longitude
   * @returns Distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param degrees - Degrees to convert
   * @returns Radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format coordinates for display
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param precision - Number of decimal places (default: 4)
   * @returns Formatted coordinate string
   */
  formatCoordinates(latitude: number, longitude: number, precision: number = 4): string {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  /**
   * Get address suggestions for autocomplete
   * @param query - The search query (minimum 2 characters)
   * @param userLocation - Optional user location for distance-based ranking
   * @param radius - Optional radius in kilometers for filtering nearby results
   * @returns Promise with array of address suggestions
   */
  async getAddressSuggestions(
    query: string, 
    userLocation?: { latitude: number; longitude: number },
    radius?: number
  ): Promise<AddressSuggestion[]> {
    console.log('getAddressSuggestions called with query:', query, 'userLocation:', userLocation);
    if (!query || query.trim().length < 2) {
      console.log('Query too short, returning empty array');
      return [];
    }

    try {
      // Build URL with query parameters
      const params = new URLSearchParams({
        query: query.trim()
      });
      
      // Add user location if provided
      if (userLocation && this.isValidCoordinates(userLocation.latitude, userLocation.longitude)) {
        params.append('lat', userLocation.latitude.toString());
        params.append('lng', userLocation.longitude.toString());
        
        // Add radius if specified (default to 50km)
        if (radius && radius > 0) {
          params.append('radius', radius.toString());
        }
      }
      
      const url = `${this.baseUrl}/autocomplete?${params.toString()}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData: GeocodingError = await response.json();
        console.error('Autocomplete error response:', errorData);
        throw new Error(errorData.message || `Autocomplete failed with status ${response.status}`);
      }

      const suggestions: AddressSuggestion[] = await response.json();
      console.log('Parsed suggestions:', suggestions);
      return suggestions;
    } catch (error) {
      console.error('Autocomplete error:', error);
      throw error instanceof Error ? error : new Error('Failed to get address suggestions');
    }
  }

  /**
   * Get a human-readable address from coordinates (reverse geocoding)
   * Note: This would require a reverse geocoding service
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Promise with formatted address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // This would typically call a reverse geocoding service
    // For now, we'll return the coordinates as a string
    if (!this.isValidCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates for reverse geocoding');
    }
    
    return this.formatCoordinates(latitude, longitude);
  }
}

export const geocodingService = new GeocodingService();
export type { GeocodingResponse, GeocodingError, AddressSuggestion };
