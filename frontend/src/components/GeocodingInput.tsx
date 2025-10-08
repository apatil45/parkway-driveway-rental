import React, { useState, useCallback } from 'react';
import { geocodingService } from '../services/geocodingService';
import './GeocodingInput.css';

interface GeocodingInputProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onError?: (error: string) => void;
  onSuccess?: (coordinates: { latitude: number; longitude: number }) => void;
}

const GeocodingInput: React.FC<GeocodingInputProps> = ({
  value,
  onChange,
  placeholder = "Enter address...",
  label = "Address",
  required = false,
  disabled = false,
  className = "",
  onError,
  onSuccess
}) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, coordinates || undefined);
    setError(null);
    
    // Clear coordinates if address changes
    if (coordinates && newValue !== value) {
      setCoordinates(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGeocoding) {
      e.preventDefault();
      handleGeocode();
    }
  };

  return (
    <div className={`geocoding-input ${className}`}>
      {label && (
        <label className="geocoding-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="geocoding-input-group">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`geocoding-field ${error ? 'error' : ''} ${coordinates ? 'success' : ''}`}
          aria-label={label}
          aria-describedby={error ? 'geocoding-error' : coordinates ? 'geocoding-coordinates' : undefined}
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
          <span>Coordinates: {geocodingService.formatCoordinates(coordinates.latitude, coordinates.longitude)}</span>
        </div>
      )}

      {!error && !coordinates && value.trim() && (
        <div className="geocoding-help">
          Press Enter or click the search button to geocode this address
        </div>
      )}
    </div>
  );
};

export default GeocodingInput;
