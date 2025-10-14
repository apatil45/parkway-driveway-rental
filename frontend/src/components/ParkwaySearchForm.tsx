import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
// CSS import removed - now using Tailwind CSS

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
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<'now' | 'later'>('now');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Auto-submit functionality removed
  
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

  // Auto-submit effect - DISABLED
  // useEffect(() => {
  //   checkAndAutoSubmit();
  // }, [location, coordinates, searchMode, duration, date, time, autoSubmitEnabled, isLoading]);

  // Set default values when mode changes
  useEffect(() => {
    if (searchMode === 'now') {
      // Set default duration for Park Now mode
      setDuration(120);
    } else {
      // Set default date and time for Schedule mode
      const minDate = getMinDate();
      const currentTime = getESTTime();
      const currentTimeStr = formatTimeForAvailability(currentTime);
      
      setDate(minDate);
      setTime(currentTimeStr);
    }
  }, [searchMode]);

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

  const handleListDriveway = () => {
    // Navigate to owner dashboard to list a driveway
    navigate('/owner-dashboard');
  };

  return (
    <div className="parkway-search-form">
      {/* Header - Parking Focused */}
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find parking near your destination</h1>
        <p className="text-lg text-gray-600">Book private driveways from local homeowners</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Location Input - Parking Focused */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <GeocodingSearch
                onSearch={(query, coords) => {
                  console.log('GeocodingSearch onSearch called:', { query, coords });
                  handleLocationChange(query);
                  if (coords && coords.latitude && coords.longitude) {
                    setCoordinates({ lat: coords.latitude, lng: coords.longitude });
                  }
                }}
                onLocationChange={(query, coords) => {
                  console.log('GeocodingSearch onLocationChange called:', { query, coords });
                  handleLocationChange(query);
                  if (coords && coords.latitude && coords.longitude) {
                    setCoordinates({ lat: coords.latitude, lng: coords.longitude });
                  }
                }}
                placeholder="Where do you need parking?"
                className="location-search"
                userLocation={userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined}
                onCurrentLocationClick={handleCurrentLocation}
              />
            </div>
          </div>
        </div>

        {/* Parking Mode Selection */}
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-2xl p-1 flex">
            <button
              type="button"
              onClick={() => setSearchMode('now')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                searchMode === 'now'
                  ? 'bg-white text-gray-900 shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>Park Now</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('later')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                searchMode === 'later'
                  ? 'bg-white text-gray-900 shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Schedule for Later</span>
            </button>
          </div>
        </div>

        {/* Mode-specific content */}
        {searchMode === 'now' ? (
          /* Park Now Mode */
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Park Now</h3>
                <p className="text-sm text-gray-500">Current time: {currentTime}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                How long do you need parking?
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      duration === option.value 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setDuration(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">Duration selected:</span>
                <span className="text-sm font-medium text-gray-900">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Schedule for Later Mode */
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Schedule for Later</h3>
                <p className="text-sm text-gray-500">Plan your parking in advance</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={getMinDate()}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                      errors.datetime ? 'border-red-300 bg-red-50' : 'bg-white'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    min={getMinTime(date)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                      errors.datetime ? 'border-red-300 bg-red-50' : 'bg-white'
                    }`}
                    required
                  />
                </div>
              </div>
              
              {date && time && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scheduled for:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(date + 'T' + time).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.datetime && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{errors.datetime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Button - Parking Focused */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`px-6 py-3 bg-black text-white font-semibold rounded-lg transition-colors ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-gray-800'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Finding parking...' : 'Find Parking'}
          </button>
          <button 
            type="button" 
            className="text-gray-600 underline hover:text-gray-800"
            onClick={handleListDriveway}
          >
            List your driveway
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParkwaySearchForm;
