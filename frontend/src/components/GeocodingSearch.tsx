import React, { useState, useCallback } from 'react';
import { geocodingService } from '../services/geocodingService';
import './GeocodingSearch.css';

interface GeocodingSearchProps {
  onSearch: (query: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const GeocodingSearch: React.FC<GeocodingSearchProps> = ({
  onSearch,
  placeholder = "Enter location or address...",
  className = "",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      
      // Search with both query and coordinates
      onSearch(searchQuery, geocodeResult);
    } catch (geocodeError) {
      console.warn('Geocoding failed, searching with text only:', geocodeError);
      
      // If geocoding fails, search with text only
      setCoordinates(null);
      onSearch(searchQuery);
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
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGeocoding) {
      e.preventDefault();
      handleGeocodeAndSearch();
    }
  };

  const handleSearchClick = () => {
    if (!isGeocoding) {
      handleGeocodeAndSearch();
    }
  };

  return (
    <div className={`geocoding-search ${className}`}>
      <div className="search-input-group">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`search-input ${error ? 'error' : ''} ${coordinates ? 'success' : ''}`}
          aria-label="Search location"
          aria-describedby={error ? 'search-error' : coordinates ? 'search-coordinates' : 'search-help'}
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

      {!error && !coordinates && searchQuery.trim() && (
        <div id="search-help" className="search-help">
          Press Enter or click search to find driveways near this location
        </div>
      )}
    </div>
  );
};

export default GeocodingSearch;
