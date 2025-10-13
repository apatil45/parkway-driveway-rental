import React, { useState, useCallback, useRef, useEffect } from 'react';
import { geocodingService, AddressSuggestion } from '../services/geocodingService';

interface GeocodingInputWithAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onSuccess?: (coordinates: { latitude: number; longitude: number }) => void;
  onError?: (error: string) => void;
}

const GeocodingInputWithAutocomplete: React.FC<GeocodingInputWithAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter address...",
  label = "Address",
  required = false,
  disabled = false,
  className = "",
  onSuccess,
  onError
}) => {
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
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const results = await geocodingService.getAddressSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Handle input change with debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, coordinates || undefined);
    setError(null);
    
    // Clear coordinates if address changes
    if (coordinates && newValue !== value) {
      setCoordinates(null);
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
    onChange(suggestion.address, coords);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    onSuccess?.(coords);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && !isGeocoding) {
        e.preventDefault();
        handleGeocode();
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
          handleGeocode();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle geocoding
  const handleGeocode = useCallback(async () => {
    if (!value.trim()) {
      setError('Please enter an address to geocode');
      return;
    }

    setIsGeocoding(true);
    setError(null);

    try {
      const result = await geocodingService.geocodeAddress(value);
      setCoordinates(result);
      onChange(value, result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to geocode address';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsGeocoding(false);
    }
  }, [value, onChange, onSuccess, onError]);

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
    <div className={`geocoding-input-autocomplete ${className}`}>
      {label && (
        <label className="geocoding-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="geocoding-input-group">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`geocoding-field ${error ? 'error' : ''} ${coordinates ? 'success' : ''}`}
          aria-label={label}
          aria-describedby={error ? 'geocoding-error' : coordinates ? 'geocoding-coordinates' : undefined}
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          role="combobox"
        />
        
        <button
          type="button"
          onClick={handleGeocode}
          disabled={disabled || isGeocoding || !value.trim()}
          className="geocoding-button"
          aria-label="Geocode address"
        >
          {isGeocoding ? (
            <div className="geocoding-spinner" aria-hidden="true">
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

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="suggestions-dropdown"
          role="listbox"
          aria-label="Address suggestions"
        >
          {isLoadingSuggestions ? (
            <div className="suggestion-item loading">
              <div className="suggestion-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="suggestion-address">
                  {suggestion.address}
                </div>
                {(suggestion.city || suggestion.state) && (
                  <div className="suggestion-details">
                    {[suggestion.city, suggestion.state, suggestion.zipcode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <div id="geocoding-error" className="geocoding-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          {error}
        </div>
      )}

      {coordinates && (
        <div id="geocoding-coordinates" className="geocoding-coordinates">
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

export default GeocodingInputWithAutocomplete;
