import React, { useState } from 'react';
import './ParkwaySearchForm.css';

interface UserLocation {
  lat: number;
  lng: number;
}

interface SearchData {
  location: string;
  date: string;
  time: string;
  coordinates?: { lat: number; lng: number };
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
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();

  // Set default date and time
  React.useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('09:00');
  }, []);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    // Here you could add geocoding to get coordinates
    // For now, we'll use user location if available
    if (userLocation && value.toLowerCase().includes('current')) {
      setCoordinates(userLocation);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      alert('Please enter a location');
      return;
    }

    const searchData: SearchData = {
      location: location.trim(),
      date,
      time,
      coordinates: coordinates || userLocation
    };

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
      <div className="form-header">
        <h2>Find Parking</h2>
        <p>Search for available parking spots near your destination</p>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        {/* Location Input */}
        <div className="form-group">
          <label htmlFor="location" className="form-label">Where do you need parking?</label>
          <div className="location-input-group">
            <div className="location-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Enter destination address"
              className="location-input"
              required
            />
            <button
              type="button"
              onClick={handleCurrentLocation}
              className="current-location-btn"
              title="Use current location"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Date and Time */}
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
                onChange={(e) => setDate(e.target.value)}
                className="datetime-input"
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
                onChange={(e) => setTime(e.target.value)}
                className="datetime-input"
                required
              />
            </div>
          </div>
        </div>

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
              Find Parking
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ParkwaySearchForm;
