import React, { useState, useCallback, useRef, useEffect } from 'react';
import { geocodingService, AddressSuggestion } from '../services/geocodingService';
import './GeocodingSearch.css';

interface GeocodingSearchProps {
  onSearch: (query: string, coordinates?: { latitude: number; longitude: number }) => void;
  onLocationChange?: (query: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  userLocation?: { latitude: number; longitude: number };
  onCurrentLocationClick?: () => void;
}

const GeocodingSearch: React.FC<GeocodingSearchProps> = ({
  onSearch,
  onLocationChange,
  placeholder = "Enter location or address...",
  className = "",
  disabled = false,
  userLocation,
  onCurrentLocationClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search for suggestions
  const searchSuggestions = useCallback(async (query: string) => {
    console.log('Searching suggestions for:', query);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      console.log('Calling geocodingService.getAddressSuggestions...');
      // Pass user location for distance-based ranking
      const results = await geocodingService.getAddressSuggestions(
        query, 
        userLocation, 
        50 // 50km radius for nearby results
      );
      console.log('Received suggestions:', results);
      setSuggestions(results);
      const shouldShow = results.length > 0;
      console.log('Setting showSuggestions to:', shouldShow);
      setShowSuggestions(shouldShow);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [userLocation]);

  const handleGeocodeAndSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a location to search');
      return;
    }

    setIsGeocoding(true);
    setError(null);

    try {
      // First try to geocode the address
      const geocodeResult = await geocodingService.geocodeAddress(searchQuery);
      setCoordinates(geocodeResult);
      
      // DISABLED: Don't automatically trigger search
      // onSearch(searchQuery, geocodeResult);
    } catch (geocodeError) {
      console.warn('Geocoding failed, searching with text only:', geocodeError);
      
      // DISABLED: Don't automatically trigger search
      setCoordinates(null);
      // onSearch(searchQuery);
    } finally {
      setIsGeocoding(false);
    }
  }, [searchQuery, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setError(null);
    
    // Clear coordinates if search query changes
    if (coordinates && newValue !== searchQuery) {
      setCoordinates(null);
    }

    // Show suggestions immediately if there's text
    if (newValue.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const coords = { latitude: suggestion.latitude, longitude: suggestion.longitude };
    setCoordinates(coords);
    setSearchQuery(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    // Notify parent of location change but don't trigger search
    if (onLocationChange) {
      onLocationChange(suggestion.address, coords);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && !isGeocoding) {
        e.preventDefault();
        handleGeocodeAndSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleGeocodeAndSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearchClick = () => {
    if (!isGeocoding) {
      handleGeocodeAndSearch();
    }
  };

  const handleInputFocus = () => {
    // Show suggestions if there's already text and suggestions available
    if (searchQuery.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };


  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`geocoding-search ${className} ${showSuggestions ? 'has-suggestions' : ''}`}>
      <div className="search-input-group">
        {/* Location Icon */}
        {onCurrentLocationClick && (
          <div 
            className="location-icon cursor-pointer"
            onClick={onCurrentLocationClick}
          >
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`search-input ${error ? 'error' : ''} ${coordinates ? 'success' : ''}`}
          aria-label="Search location"
          aria-describedby={error ? 'search-error' : coordinates ? 'search-coordinates' : 'search-help'}
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          role="combobox"
        />
        
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={disabled || isGeocoding || !searchQuery.trim()}
          className="search-button"
          aria-label="Search for driveways"
        >
          {isGeocoding ? (
            <div className="search-spinner" aria-hidden="true">
              <div className="spinner"></div>
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Debug: showSuggestions={showSuggestions.toString()}, suggestions.length={suggestions.length}, searchQuery="{searchQuery}"
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="suggestions-dropdown"
          role="listbox"
          aria-label="Location suggestions"
          style={{ display: 'block', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999 }}
        >

          {isLoadingSuggestions ? (
            <div className="suggestion-item loading">
              <div className="suggestion-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : (
            suggestions.map((suggestion, index) => {
              // Format the address nicely
              const formatAddress = (addr: string) => {
                // Remove redundant parts and clean up formatting
                return addr
                  .replace(/\s+/g, ' ')
                  .replace(/,\s*,/g, ',')
                  .trim();
              };

              // Create a clean location string
              const locationParts = [
                suggestion.city,
                suggestion.state,
                suggestion.zipcode
              ].filter(Boolean);
              
              const locationString = locationParts.length > 0 
                ? locationParts.join(', ')
                : '';

              // Format distance if available
              const formatDistance = (distance: number | undefined) => {
                if (!distance) return '';
                if (distance < 1) {
                  return `${Math.round(distance * 1000)}m away`;
                } else {
                  return `${distance.toFixed(1)}km away`;
                }
              };

              return (
                <div
                  key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                  className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="suggestion-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-address">
                      {formatAddress(suggestion.address)}
                    </div>
                    <div className="suggestion-details">
                      {locationString}
                      {suggestion.distance && (
                        <span className="suggestion-distance">
                          {formatDistance(suggestion.distance)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <div id="search-error" className="search-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          {error}
        </div>
      )}

      {coordinates && (
        <div id="search-coordinates" className="search-coordinates">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>Location verified: {geocodingService.formatCoordinates(coordinates.latitude, coordinates.longitude)}</span>
        </div>
      )}

    </div>
  );
};

export default GeocodingSearch;
