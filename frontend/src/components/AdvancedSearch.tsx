import React, { useState, useEffect, useRef } from 'react';
import './AdvancedSearch.css';

interface SearchFilters {
  location: string;
  priceRange: [number, number];
  availability: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  amenities: string[];
  carSize: string;
  sortBy: 'price' | 'distance' | 'rating' | 'availability';
  sortOrder: 'asc' | 'desc';
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'location' | 'amenity' | 'recent';
  count?: number;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onLocationChange: (location: string) => void;
  initialFilters?: Partial<SearchFilters>;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onLocationChange,
  initialFilters,
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    priceRange: [0, 100],
    availability: {
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: ''
    },
    amenities: [],
    carSize: 'medium',
    sortBy: 'distance',
    sortOrder: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock suggestions data - in real app, this would come from API
  const mockSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'Downtown Seattle', type: 'location', count: 45 },
    { id: '2', text: 'University District', type: 'location', count: 23 },
    { id: '3', text: 'Capitol Hill', type: 'location', count: 18 },
    { id: '4', text: 'Belltown', type: 'location', count: 12 },
    { id: '5', text: 'Fremont', type: 'location', count: 8 },
    { id: '6', text: 'Covered Parking', type: 'amenity', count: 67 },
    { id: '7', text: 'Security Cameras', type: 'amenity', count: 34 },
    { id: '8', text: 'EV Charging', type: 'amenity', count: 19 },
    { id: '9', text: 'Near Metro', type: 'amenity', count: 28 },
    { id: '10', text: 'Recent: Pike Place Market', type: 'recent' }
  ];

  const availableAmenities = [
    'Covered Parking',
    'Security Cameras',
    'EV Charging',
    'Near Metro',
    'Well Lit',
    '24/7 Access',
    'Valet Service',
    'Car Wash',
    'Tire Pressure Check'
  ];

  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
    onLocationChange(value);
    
    if (value.length > 1) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFilters(prev => ({ ...prev, location: suggestion.text }));
    onLocationChange(suggestion.text);
    setShowSuggestions(false);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAvailabilityChange = (key: keyof SearchFilters['availability'], value: string) => {
    setFilters(prev => ({
      ...prev,
      availability: { ...prev.availability, [key]: value }
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      await onSearch(filters);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      priceRange: [0, 100],
      availability: {
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
      },
      amenities: [],
      carSize: 'medium',
      sortBy: 'distance',
      sortOrder: 'asc'
    });
    onLocationChange('');
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    };
  };

  const setCurrentDateTime = () => {
    const { date, time } = getCurrentDateTime();
    handleAvailabilityChange('startDate', date);
    handleAvailabilityChange('startTime', time);
  };

  return (
    <div className={`advanced-search ${className}`}>
      {/* Main Search Bar */}
      <div className="search-main">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Enter location, address, or landmark..."
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="search-input"
              autoComplete="off"
            />
            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="search-spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="search-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className={`suggestion-item suggestion-${suggestion.type}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-text">{suggestion.text}</span>
                  {suggestion.count && (
                    <span className="suggestion-count">{suggestion.count} spots</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
          </svg>
          Filters
          {filters.amenities.length > 0 && (
            <span className="filter-badge">{filters.amenities.length}</span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="search-filters">
          <div className="filters-header">
            <h3>Search Filters</h3>
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear All
            </button>
          </div>

          <div className="filters-grid">
            {/* Price Range */}
            <div className="filter-group">
              <label className="filter-label">Price Range (per hour)</label>
              <div className="price-range">
                <span className="price-label">${filters.priceRange[0]}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="price-slider"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="price-slider"
                />
                <span className="price-label">${filters.priceRange[1]}</span>
              </div>
            </div>

            {/* Car Size */}
            <div className="filter-group">
              <label className="filter-label">Car Size</label>
              <select
                value={filters.carSize}
                onChange={(e) => handleFilterChange('carSize', e.target.value)}
                className="filter-select"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <div className="sort-controls">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="filter-select"
                >
                  <option value="distance">Distance</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="availability">Availability</option>
                </select>
                <button
                  type="button"
                  className={`sort-order ${filters.sortOrder}`}
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Quick Time Selection */}
            <div className="filter-group">
              <label className="filter-label">Quick Time Selection</label>
              <div className="quick-time-buttons">
                <button
                  type="button"
                  className="quick-time-btn"
                  onClick={setCurrentDateTime}
                >
                  Now
                </button>
                <button
                  type="button"
                  className="quick-time-btn"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleAvailabilityChange('startDate', tomorrow.toISOString().split('T')[0]);
                    handleAvailabilityChange('startTime', '09:00');
                  }}
                >
                  Tomorrow 9 AM
                </button>
                <button
                  type="button"
                  className="quick-time-btn"
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleAvailabilityChange('startDate', nextWeek.toISOString().split('T')[0]);
                    handleAvailabilityChange('startTime', '10:00');
                  }}
                >
                  Next Week
                </button>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="filter-group amenities-group">
            <label className="filter-label">Amenities</label>
            <div className="amenities-grid">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span className="amenity-text">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="filter-group datetime-group">
            <label className="filter-label">Date & Time</label>
            <div className="datetime-grid">
              <div className="datetime-input">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.availability.startDate}
                  onChange={(e) => handleAvailabilityChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="datetime-input">
                <label>Start Time</label>
                <input
                  type="time"
                  value={filters.availability.startTime}
                  onChange={(e) => handleAvailabilityChange('startTime', e.target.value)}
                />
              </div>
              <div className="datetime-input">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.availability.endDate}
                  onChange={(e) => handleAvailabilityChange('endDate', e.target.value)}
                  min={filters.availability.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="datetime-input">
                <label>End Time</label>
                <input
                  type="time"
                  value={filters.availability.endTime}
                  onChange={(e) => handleAvailabilityChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Search Actions */}
          <div className="search-actions">
            <button
              type="button"
              className="search-apply-btn"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="search-spinner"></div>
                  Searching...
                </>
              ) : (
                'Apply Filters & Search'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
