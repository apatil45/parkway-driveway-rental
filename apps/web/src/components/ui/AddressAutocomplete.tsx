'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  distance?: number; // Distance in km from user location
  isRecent?: boolean; // From address history
  isNearby?: boolean; // Nearby places from reverse geocoding
}

interface SavedAddress {
  address: string;
  lat: number;
  lon: number;
  timestamp: number;
  usageCount: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Address history storage key
const ADDRESS_HISTORY_KEY = 'parkway_address_history';
const MAX_HISTORY_ITEMS = 10;

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get saved addresses from localStorage
function getSavedAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ADDRESS_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading address history:', e);
  }
  return [];
}

// Save address to history
function saveAddressToHistory(address: string, lat: number, lon: number) {
  if (typeof window === 'undefined') return;
  try {
    const history = getSavedAddresses();
    const existingIndex = history.findIndex(
      item => item.address.toLowerCase() === address.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Update existing - increment usage and update timestamp
      history[existingIndex].usageCount += 1;
      history[existingIndex].timestamp = Date.now();
    } else {
      // Add new
      history.push({
        address,
        lat,
        lon,
        timestamp: Date.now(),
        usageCount: 1,
      });
    }
    
    // Sort by usage count and timestamp, keep top MAX_HISTORY_ITEMS
    history.sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return b.timestamp - a.timestamp;
    });
    
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(ADDRESS_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (e) {
    console.error('Error saving address history:', e);
  }
}

// Get nearby places using reverse geocoding
async function getNearbyPlaces(lat: number, lon: number): Promise<AddressSuggestion[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Parkway Driveway Rental Platform',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.display_name) {
        return [{
          display_name: data.display_name,
          lat: data.lat,
          lon: data.lon,
          place_id: Date.now(), // Use timestamp as unique ID
          isNearby: true,
        }];
      }
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  return [];
}

export default function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Enter address...',
  label,
  required = false,
  disabled = false,
  className = '',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<AddressSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          
          // Get nearby places for quick suggestions
          const nearby = await getNearbyPlaces(latitude, longitude);
          setNearbyPlaces(nearby);
        },
        () => {
          // Silently fail - user can manually search
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }
  }, []);

  // Fetch suggestions from Nominatim API with smart ranking
  const fetchSuggestions = useCallback(async (query: string) => {
    // Show recent addresses and nearby places when query is too short
    if (!query || query.length < 2) {
      const recentAddresses = getSavedAddresses()
        .slice(0, 3)
        .map(addr => ({
          display_name: addr.address,
          lat: String(addr.lat),
          lon: String(addr.lon),
          place_id: addr.timestamp,
          isRecent: true,
          distance: userLocation
            ? calculateDistance(userLocation.lat, userLocation.lon, addr.lat, addr.lon)
            : undefined,
        }));
      
      const allSuggestions = [...recentAddresses, ...nearbyPlaces];
      if (allSuggestions.length > 0) {
        setSuggestions(allSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    setLoading(true);
    try {
      // Use Nominatim API (OpenStreetMap) - completely free
      // Increase limit to get more results for better ranking
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&bounded=1`,
        {
          headers: {
            'User-Agent': 'Parkway Driveway Rental Platform', // Required by Nominatim
          },
        }
      );

      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        
        // Get saved addresses for matching
        const savedAddresses = getSavedAddresses();
        
        // Enhance suggestions with ranking data
        const enhancedSuggestions = data.map(suggestion => {
          const lat = parseFloat(suggestion.lat);
          const lon = parseFloat(suggestion.lon);
          
          // Check if it's in history
          const savedMatch = savedAddresses.find(
            saved => 
              Math.abs(saved.lat - lat) < 0.001 && 
              Math.abs(saved.lon - lon) < 0.001
          );
          
          // Calculate distance if user location is available
          let distance: number | undefined;
          if (userLocation) {
            distance = calculateDistance(userLocation.lat, userLocation.lon, lat, lon);
          }
          
          return {
            ...suggestion,
            distance,
            isRecent: !!savedMatch,
          };
        });
        
        // Smart ranking: prioritize by relevance, distance, and history
        const rankedSuggestions = enhancedSuggestions.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          
          // History boost (high priority)
          if (a.isRecent) scoreA += 100;
          if (b.isRecent) scoreB += 100;
          
          // Distance boost (closer = higher score)
          if (a.distance !== undefined && b.distance !== undefined) {
            scoreA += Math.max(0, 50 - a.distance); // Closer = higher score
            scoreB += Math.max(0, 50 - b.distance);
          } else if (a.distance !== undefined) scoreA += 25;
          else if (b.distance !== undefined) scoreB += 25;
          
          // Exact match boost (if query matches start of address)
          const queryLower = query.toLowerCase();
          if (a.display_name.toLowerCase().startsWith(queryLower)) scoreA += 10;
          if (b.display_name.toLowerCase().startsWith(queryLower)) scoreB += 10;
          
          return scoreB - scoreA; // Higher score first
        });
        
        // Take top 8 suggestions
        setSuggestions(rankedSuggestions.slice(0, 8));
        setShowSuggestions(rankedSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address autocomplete error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [userLocation, nearbyPlaces]);

  // Debounced fetch function
  const debouncedFetch = useRef(
    debounce((query: string) => {
      fetchSuggestions(query);
    }, 300)
  ).current;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    // Show suggestions even with 0-1 characters (recent/nearby)
    // Full search from 2 characters
    if (newValue.length >= 2) {
      debouncedFetch(newValue);
    } else if (newValue.length === 0 || newValue.length === 1) {
      // Show recent addresses and nearby places
      debouncedFetch(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const address = suggestion.display_name;
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    // Save to history
    saveAddressToHistory(address, lat, lon);
    
    // Close suggestions first
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Update input value - this should trigger onChange in parent
    onChange(address);
    
    // Trigger location select callback immediately
    if (onLocationSelect) {
      onLocationSelect(lat, lon);
    }
    
    // Small delay to ensure state updates before blurring
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 50);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && showSuggestions) {
      const selectedElement = containerRef.current?.querySelector(
        `[data-suggestion-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Show recent addresses and nearby places when focused with empty/short input
            if (value.length < 2) {
              const recentAddresses = getSavedAddresses()
                .slice(0, 3)
                .map(addr => ({
                  display_name: addr.address,
                  lat: String(addr.lat),
                  lon: String(addr.lon),
                  place_id: addr.timestamp,
                  isRecent: true,
                  distance: userLocation
                    ? calculateDistance(userLocation.lat, userLocation.lon, addr.lat, addr.lon)
                    : undefined,
                }));
              
              const allSuggestions = [...recentAddresses, ...nearbyPlaces];
              if (allSuggestions.length > 0) {
                setSuggestions(allSuggestions);
                setShowSuggestions(true);
              }
            } else if (suggestions.length > 0) {
              setShowSuggestions(true);
            } else if (value.length >= 2) {
              // Trigger search if we have enough characters
              debouncedFetch(value);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const isRecent = suggestion.isRecent;
            const isNearby = suggestion.isNearby;
            const distance = suggestion.distance;
            
            return (
              <button
                key={`${suggestion.place_id}-${index}`}
                type="button"
                data-suggestion-index={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                  index === selectedIndex ? 'bg-primary-50' : ''
                } ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {isRecent ? (
                    <ClockIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 block truncate">
                      {suggestion.display_name}
                    </span>
                    {(isRecent || isNearby || distance !== undefined) && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {isRecent && (
                          <span className="text-xs text-orange-600 font-medium">Recent</span>
                        )}
                        {isNearby && (
                          <span className="text-xs text-blue-600 font-medium">Nearby</span>
                        )}
                        {distance !== undefined && distance < 50 && (
                          <span className="text-xs text-gray-500">
                            {distance < 1 
                              ? `${Math.round(distance * 1000)}m away` 
                              : `${distance.toFixed(1)}km away`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

