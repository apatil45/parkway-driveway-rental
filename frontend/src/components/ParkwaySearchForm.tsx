import React, { useState, useEffect } from 'react';
import { 
  getMinDate, 
  getMinTime, 
  validateDateTime, 
  getESTTime, 
  formatTimeForAvailability,
  DURATION_OPTIONS,
  calculateEndTime,
  formatDuration,
  getCurrentTimeDisplay
} from '../utils/timeUtils';
import GeocodingSearch from './GeocodingSearch';
import './ParkwaySearchForm.css';

interface UserLocation {
  lat: number;
  lng: number;
}

interface SearchData {
  location: string;
  coordinates?: { lat: number; lng: number };
  searchMode: 'now' | 'later';
  // For 'now' mode
  duration?: number; // in minutes
  // For 'later' mode
  date?: string;
  time?: string;
}

interface ParkwaySearchFormProps {
  onSearch: (data: SearchData) => void;
  userLocation: UserLocation | null;
  isLoading: boolean;
}

const ParkwaySearchForm: React.FC<ParkwaySearchFormProps> = ({
  onSearch,
  userLocation,
  isLoading
}) => {
  const [searchMode, setSearchMode] = useState<'now' | 'later'>('now');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Park Now mode state
  const [duration, setDuration] = useState(120); // Default 2 hours
  const [currentTime, setCurrentTime] = useState('');
  
  // Schedule for Later mode state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Update current time display every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(getCurrentTimeDisplay());
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // Set default values when mode changes
  useEffect(() => {
    if (searchMode === 'now') {
      // Set default duration for Park Now mode
      setDuration(120);
      
      // Auto-fill current location for Park Now mode
      if (userLocation && !location) {
        setLocation('Current Location');
        setCoordinates(userLocation);
      }
    } else {
      // Set default date and time for Schedule mode
      const minDate = getMinDate();
      const currentTime = getESTTime();
      const currentTimeStr = formatTimeForAvailability(currentTime);
      
      setDate(minDate);
      setTime(currentTimeStr);
    }
  }, [searchMode, userLocation, location]);

  // Real-time validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Location validation
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Mode-specific validation
    if (searchMode === 'later') {
      // Date and time validation for Schedule mode
      if (date && time) {
        const validation = validateDateTime(date, time);
        if (!validation.isValid) {
          newErrors.datetime = validation.error || 'Invalid date or time';
        }
      }
    } else {
      // Duration validation for Park Now mode
      if (!duration || duration < 30) {
        newErrors.duration = 'Duration must be at least 30 minutes';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    // Clear location error when user starts typing
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
    
    // Here you could add geocoding to get coordinates
    // For now, we'll use user location if available
    if (userLocation && value.toLowerCase().includes('current')) {
      setCoordinates(userLocation);
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    // Clear datetime error when user changes date
    if (errors.datetime) {
      setErrors(prev => ({ ...prev, datetime: '' }));
    }
    
    // Update time if needed (if date is today, ensure time is not in past)
    if (value && time) {
      const minTimeForDate = getMinTime(value);
      if (time < minTimeForDate) {
        setTime(minTimeForDate);
      }
    }
    
    // Validate immediately
    setTimeout(() => validateForm(), 100);
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    // Clear datetime error when user changes time
    if (errors.datetime) {
      setErrors(prev => ({ ...prev, datetime: '' }));
    }
    
    // Validate immediately
    setTimeout(() => validateForm(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    const searchData: SearchData = {
      location: location.trim(),
      coordinates: coordinates || userLocation,
      searchMode
    };

    if (searchMode === 'now') {
      // For Park Now mode, calculate start and end times
      const timeRange = calculateEndTime(duration);
      searchData.duration = duration;
    } else {
      // For Schedule mode, use selected date and time
      searchData.date = date;
      searchData.time = time;
    }

    onSearch(searchData);
  };

  const handleCurrentLocation = () => {
    if (userLocation) {
      setLocation('Current Location');
      setCoordinates(userLocation);
    } else {
      alert('Location not available');
    }
  };

  return (
    <div className="parkway-search-form">
      <div className="search-header">
        <h2>WHERE DO YOU NEED PARKING?</h2>
        <p>Search for available parking spots near your destination</p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="search-mode-tabs">
        <button
          type="button"
          className={`mode-tab ${searchMode === 'now' ? 'active' : ''}`}
          onClick={() => setSearchMode('now')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          Park Now
        </button>
        <button
          type="button"
          className={`mode-tab ${searchMode === 'later' ? 'active' : ''}`}
          onClick={() => setSearchMode('later')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Schedule for Later
        </button>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        {/* Location Input */}
        <div className="form-group">
          <label htmlFor="location" className="form-label">Where do you need parking?</label>
          <GeocodingSearch
            onSearch={(query, coords) => {
              console.log('GeocodingSearch onSearch called:', { query, coords });
              handleLocationChange(query);
              if (coords && coords.latitude && coords.longitude) {
                setCoordinates({ lat: coords.latitude, lng: coords.longitude });
              }
            }}
            placeholder="Enter destination address"
            className="location-search"
          />
        </div>

        {/* Mode-specific content */}
        {searchMode === 'now' ? (
          /* Park Now Mode */
          <div className="park-now-section">
            <div className="current-time-display">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>Current time: {currentTime}</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">How long do you need parking?</label>
              <div className="duration-options">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`duration-option ${duration === option.value ? 'selected' : ''}`}
                    onClick={() => setDuration(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="parking-summary">
              <div className="summary-item">
                <span className="label">Available:</span>
                <span className="value">Now</span>
              </div>
              <div className="summary-item">
                <span className="label">Duration:</span>
                <span className="value">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Schedule for Later Mode */
          <div className="schedule-section">
            <div className="datetime-group">
              <div className="form-group">
                <label htmlFor="date" className="form-label">Date</label>
                <div className="input-with-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={getMinDate()}
                    className={`datetime-input ${errors.datetime ? 'error' : ''}`}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="time" className="form-label">Time</label>
                <div className="input-with-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    min={getMinTime(date)}
                    className={`datetime-input ${errors.datetime ? 'error' : ''}`}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <div className="form-errors">
            {errors.location && (
              <div className="error-message location-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errors.location}
              </div>
            )}
            {errors.datetime && (
              <div className="error-message datetime-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errors.datetime}
              </div>
            )}
            {errors.duration && (
              <div className="error-message duration-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errors.duration}
              </div>
            )}
          </div>
        )}

        {/* Popular Destinations */}
        <div className="popular-destinations">
          <h3>Popular Destinations</h3>
          <div className="destination-list">
            <button
              type="button"
              onClick={() => handleLocationChange('Jersey City Downtown')}
              className="destination-item"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <div className="destination-info">
                <span className="destination-name">Jersey City Downtown</span>
                <span className="destination-address">Jersey City, NJ 07302</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleLocationChange('Newark Airport')}
              className="destination-item"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 22h20"/>
                <path d="M6.36 17.4L4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l17.1 8.55a2 2 0 0 0 1.8 0L22 20l-2-4-2.36.4"/>
                <path d="M18.4 8.59l.91-.4a2 2 0 0 0 1-1.75l-.05-.95a2 2 0 0 0-1.74-1.73L16 4.6 12 5l.4.41a2 2 0 0 1 0 2.82l-.4.41 4-.4 2.4.17z"/>
              </svg>
              <div className="destination-info">
                <span className="destination-name">Newark Airport</span>
                <span className="destination-address">Newark, NJ 07114</span>
              </div>
            </button>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="search-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="button-spinner"></div>
              Searching...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              {searchMode === 'now' ? 'Find Parking Now' : 'Find Parking'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ParkwaySearchForm;
