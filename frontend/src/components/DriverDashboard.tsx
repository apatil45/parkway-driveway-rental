import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import MapView from './MapView';
import './DriverDashboard.css';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
  distance?: number;
  rating: number;
  images: string[];
  amenities: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Booking {
  id: string;
  driveway: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number; // Changed from totalPrice to match backend
  status: string;
}

const DriverDashboard: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Driveway[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'bookings'>('search');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockDriveways: Driveway[] = [
    {
      id: '1',
      address: '123 Main Street, Downtown',
      description: 'Spacious driveway with easy access',
      pricePerHour: 5.00,
      distance: 0.8,
      rating: 4.8,
      images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
      amenities: ['Covered', 'Security Cameras', 'Easy Access']
    },
    {
      id: '2',
      address: '456 Oak Avenue, Midtown',
      description: 'Private driveway in quiet neighborhood',
      pricePerHour: 4.50,
      distance: 1.2,
      rating: 4.6,
      images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'],
      amenities: ['Private', 'Well Lit', 'Near Transit']
    },
    {
      id: '3',
      address: '789 Pine Street, Uptown',
      description: 'Large driveway suitable for SUVs',
      pricePerHour: 6.00,
      distance: 1.5,
      rating: 4.9,
      images: ['https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
      amenities: ['Large Vehicle Friendly', '24/7 Access', 'Security']
    }
  ];

  const mockBookings: Booking[] = [
    {
      id: '1',
      driveway: '123 Main Street',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T14:00:00Z',
      startTime: '10:00',
      endTime: '14:00',
      totalAmount: 20.00,
      status: 'confirmed'
    },
    {
      id: '2',
      driveway: '456 Oak Avenue',
      startDate: '2024-01-16T09:00:00Z',
      endDate: '2024-01-16T17:00:00Z',
      startTime: '09:00',
      endTime: '17:00',
      totalAmount: 36.00,
      status: 'pending'
    }
  ];

  const loadBookings = async () => {
    try {
      const response = await fetch(`/api/bookings/driver/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentBookings(data);
      } else {
        // Fallback to mock data if API fails
        setRecentBookings(mockBookings);
      }
          } catch (error) {
      console.error('Failed to load bookings:', error);
      // Fallback to mock data
      setRecentBookings(mockBookings);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        // Automatically search for nearby driveways
        searchNearbyDriveways(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please enable location access.');
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Search for nearby driveways using current location
  const searchNearbyDriveways = async (lat: number, lng: number) => {
    try {
      const currentDate = new Date();
      const currentTime = currentDate.toTimeString().slice(0, 5);
      const endTime = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5); // 2 hours later

      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius: '10000', // 10km radius
        date: currentDate.toISOString().split('T')[0],
        startTime: currentTime,
        endTime: endTime
      });

      console.log('Searching nearby driveways with params:', params.toString());
      const response = await fetch(`/api/driveways/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data);
        setSearchResults(data);
        
        // Show notification with results
        notificationService.showNotification({
          type: 'success',
          title: 'Location Search Complete',
          message: `Found ${data.length} driveways near your location!`,
          context: 'search'
        });
      } else {
        console.log('Search failed, using mock data');
        // Fallback to mock data with coordinates
        const mockWithCoords = mockDriveways.map(driveway => ({
          ...driveway,
          coordinates: { lat: 40.7178 + (Math.random() - 0.5) * 0.01, lng: -74.0431 + (Math.random() - 0.5) * 0.01 },
          distance: Math.round(Math.random() * 2000) + 100
        }));
        setSearchResults(mockWithCoords);
        
        notificationService.showNotification({
          type: 'success',
          title: 'Location Search Complete',
          message: `Found ${mockWithCoords.length} driveways near your location!`,
          context: 'search'
        });
      }
    } catch (error) {
      console.error('Failed to search nearby driveways:', error);
      // Fallback to mock data with coordinates
      const mockWithCoords = mockDriveways.map(driveway => ({
        ...driveway,
        coordinates: { lat: 40.7178 + (Math.random() - 0.5) * 0.01, lng: -74.0431 + (Math.random() - 0.5) * 0.01 },
        distance: Math.round(Math.random() * 2000) + 100
      }));
      setSearchResults(mockWithCoords);
      
      notificationService.showNotification({
        type: 'success',
        title: 'Location Search Complete',
        message: `Found ${mockWithCoords.length} driveways near your location!`,
        context: 'search'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Search for all nearby driveways without time restrictions
  const searchAllNearbyDriveways = async (lat: number, lng: number) => {
    try {
      setIsSearching(true);
      
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius: '10000' // 10km radius
      });

      console.log('Searching all nearby driveways with params:', params.toString());
      const response = await fetch(`/api/driveways/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('All nearby search results:', data);
        setSearchResults(data);
        
        notificationService.showNotification({
          type: 'success',
          title: 'Search Complete',
          message: `Found ${data.length} driveways near your location!`,
          context: 'search'
        });
      } else {
        console.log('Search failed, using mock data');
        // Fallback to mock data with coordinates
        const mockWithCoords = mockDriveways.map(driveway => ({
          ...driveway,
          coordinates: { lat: 40.7178 + (Math.random() - 0.5) * 0.01, lng: -74.0431 + (Math.random() - 0.5) * 0.01 },
          distance: Math.round(Math.random() * 2000) + 100
        }));
        setSearchResults(mockWithCoords);
        
        notificationService.showNotification({
          type: 'success',
          title: 'Search Complete',
          message: `Found ${mockWithCoords.length} driveways near your location!`,
          context: 'search'
        });
      }
    } catch (error) {
      console.error('Failed to search all nearby driveways:', error);
      // Fallback to mock data with coordinates
      const mockWithCoords = mockDriveways.map(driveway => ({
        ...driveway,
        coordinates: { lat: 40.7178 + (Math.random() - 0.5) * 0.01, lng: -74.0431 + (Math.random() - 0.5) * 0.01 },
        distance: Math.round(Math.random() * 2000) + 100
      }));
      setSearchResults(mockWithCoords);
      
      notificationService.showNotification({
        type: 'success',
        title: 'Search Complete',
        message: `Found ${mockWithCoords.length} driveways near your location!`,
        context: 'search'
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadBookings();
    }
  }, [isAuthenticated, user]);

  // Update end time when start time or hours change
  useEffect(() => {
    const updateEndTime = () => {
      const startTimeInput = document.querySelector('input[name="startTime"]') as HTMLInputElement;
      const hoursInput = document.querySelector('input[name="hours"]') as HTMLInputElement;
      const endTimeInput = document.querySelector('input[name="endTime"]') as HTMLInputElement;
      const totalPriceElement = document.getElementById('totalPrice') as HTMLElement;

      if (startTimeInput && hoursInput && endTimeInput && selectedDriveway) {
        const startTime = startTimeInput.value;
        const hours = parseFloat(hoursInput.value) || 0;
        
        if (startTime && hours > 0) {
          const startDateTime = new Date(startTime);
          const endDateTime = new Date(startDateTime.getTime() + (hours * 60 * 60 * 1000));
          endTimeInput.value = endDateTime.toISOString().slice(0, 16);
          
          // Update total price
          const totalPrice = selectedDriveway.pricePerHour * hours;
          if (totalPriceElement) {
            totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
          }
        }
      }
    };

    // Add event listeners when booking modal is open
    if (showBookingModal) {
      const startTimeInput = document.querySelector('input[name="startTime"]');
      const hoursInput = document.querySelector('input[name="hours"]');
      
      if (startTimeInput) startTimeInput.addEventListener('change', updateEndTime);
      if (startTimeInput) startTimeInput.addEventListener('input', updateEndTime);
      if (hoursInput) hoursInput.addEventListener('change', updateEndTime);
      if (hoursInput) hoursInput.addEventListener('input', updateEndTime);
      
      // Initial calculation
      updateEndTime();
      
      return () => {
        if (startTimeInput) startTimeInput.removeEventListener('change', updateEndTime);
        if (startTimeInput) startTimeInput.removeEventListener('input', updateEndTime);
        if (hoursInput) hoursInput.removeEventListener('change', updateEndTime);
        if (hoursInput) hoursInput.removeEventListener('input', updateEndTime);
      };
    }
  }, [showBookingModal, selectedDriveway]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/driveways/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        notificationService.showNotification({
          type: 'success',
          title: 'Search Complete',
          message: `Found ${data.length} available driveways!`,
          context: 'search'
        });
      } else {
        // Fallback to mock data if API fails
        setSearchResults(mockDriveways);
        notificationService.showNotification({
          type: 'success',
          title: 'Search Complete',
          message: 'Found 3 available driveways!',
          context: 'search'
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to mock data
      setSearchResults(mockDriveways);
      notificationService.showNotification({
        type: 'success',
        title: 'Search Complete',
        message: 'Found 3 available driveways!',
        context: 'search'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookDriveway = (driveway: Driveway) => {
    setSelectedDriveway(driveway);
    setShowBookingModal(true);
    
    // Pre-populate form with current time and location after modal opens
    setTimeout(() => {
      const startTimeInput = document.querySelector('input[name="startTime"]') as HTMLInputElement;
      const hoursInput = document.querySelector('input[name="hours"]') as HTMLInputElement;
      
      if (startTimeInput) {
        // Set current time + 30 minutes (to allow for travel time)
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        startTimeInput.value = now.toISOString().slice(0, 16);
      }
      
      if (hoursInput) {
        // Default to 2 hours
        hoursInput.value = '2';
      }
      
      // Trigger the update to calculate end time and total price
      const updateEvent = new Event('input', { bubbles: true });
      if (startTimeInput) startTimeInput.dispatchEvent(updateEvent);
      if (hoursInput) hoursInput.dispatchEvent(updateEvent);
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading user data...</div>;
  }

  if (!isAuthenticated || !user?.roles.includes('driver')) {
    return <div className="error-container">Access Denied or Not Authenticated.</div>;
  }

      return (
    <div className="driver-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Find Parking</h1>
        <p className="dashboard-subtitle">Welcome back, {user?.name || 'Driver'}! Find your perfect parking spot.</p>
        </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action-btn primary"
          onClick={() => setActiveTab('search')}
        >
          Search Driveways
        </button>
        <button 
          className="quick-action-btn secondary"
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
        <input
          type="text"
                  placeholder="Enter location or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
          <button 
                  type="submit" 
                  className="search-btn"
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
            </form>

            {/* Location-based search buttons */}
            <div className="location-search-section">
              <button 
                className="location-btn"
                onClick={getCurrentLocation}
                disabled={isSearching}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Find Driveways Near Me
              </button>
              
              {userLocation && (
                <>
                  <button 
                    className="location-btn secondary"
                    onClick={() => searchAllNearbyDriveways(userLocation.lat, userLocation.lng)}
                    disabled={isSearching}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    Show All Nearby
                  </button>
                  
                  <button 
                    className="map-toggle-btn"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="8" y1="6" x2="21" y2="6"/>
                          <line x1="8" y1="12" x2="21" y2="12"/>
                          <line x1="8" y1="18" x2="21" y2="18"/>
                          <line x1="3" y1="6" x2="3.01" y2="6"/>
                          <line x1="3" y1="12" x2="3.01" y2="12"/>
                          <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        List View
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                          <line x1="8" y1="2" x2="8" y2="18"/>
                          <line x1="16" y1="6" x2="16" y2="22"/>
                        </svg>
                        Map View
                      </>
                    )}
                  </button>
                </>
              )}
              
              {locationError && (
                <div className="location-error">
                  {locationError}
                </div>
              )}
            </div>

            {/* Map View */}
            {showMap && userLocation && (
              <div className="map-section">
                <MapView
                  driveways={searchResults}
                  userLocation={userLocation}
                  onDrivewaySelect={handleBookDriveway}
                  selectedDriveway={selectedDriveway}
                />
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && !showMap && (
              <div className="results-container">
                <h3 className="results-title">
                  Available Driveways
                  {userLocation && (
                    <span className="location-indicator">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Near your location
                    </span>
                  )}
                </h3>
                <div className="driveways-grid">
                  {searchResults.map((driveway) => (
                    <div key={driveway.id} className="driveway-card">
                      <div className="driveway-image">
                        {driveway.images && driveway.images.length > 0 ? (
                          <img 
                            src={driveway.images[0]} 
                            alt={driveway.address}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Driveway';
                            }}
                          />
                        ) : (
                          <div className="placeholder-image">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21,15 16,10 5,21"/>
                            </svg>
                            <p>No image</p>
                          </div>
                        )}
                        <div className="price-badge">${driveway.pricePerHour}/hr</div>
                        {driveway.images && driveway.images.length > 1 && (
                          <div className="image-count-badge">
                            +{driveway.images.length - 1}
                          </div>
                        )}
        </div>
        
                      <div className="driveway-content">
                        <h4 className="driveway-address">{driveway.address}</h4>
                        <p className="driveway-description">{driveway.description}</p>
                        
                        <div className="driveway-meta">
                          <div className="rating">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                            </svg>
                            <span>{driveway.rating}</span>
                          </div>
                          {driveway.distance && (
                            <div className="distance">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              <span>{driveway.distance}m away</span>
                            </div>
                          )}
                        </div>
        
                        <div className="amenities">
                          {driveway.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="amenity-tag">{amenity}</span>
                          ))}
                        </div>

                        <button 
                          className="book-btn"
                          onClick={() => handleBookDriveway(driveway)}
                        >
                          Book Now
                        </button>
          </div>
        </div>
                  ))}
        </div>
        </div>
      )}
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bookings-section">
          <div className="bookings-container">
            <h3 className="bookings-title">Your Recent Bookings</h3>
            
            {recentBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <h4>No bookings yet</h4>
                <p>Start by searching for driveways to make your first booking!</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('search')}
                >
                  Find Parking
                </button>
            </div>
          ) : (
              <div className="bookings-list">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h4 className="booking-location">{booking.driveway}</h4>
                      <span 
                        className="booking-status"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
        </div>
                    
                    <div className="booking-details">
                <div className="booking-time">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>
                    {new Date(booking.startDate).toLocaleDateString()} • {' '}
                    {new Date(booking.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {' '}
                    {new Date(booking.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div className="booking-price">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <span>${Number(booking.totalAmount).toFixed(2)}</span>
                </div>
            </div>

                    {booking.status === 'pending' && (
                      <button 
                        className="cancel-btn"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to cancel this booking?')) {
                            try {
                              const response = await fetch(`/api/bookings/${booking.id}`, {
                                method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                              });

                              if (response.ok) {
                                notificationService.showNotification({
                                  type: 'success',
                                  title: 'Booking Cancelled',
                                  message: 'Your booking has been cancelled successfully.',
                                  context: 'booking'
                                });
                                loadBookings(); // Refresh the bookings list
                              } else {
                                throw new Error('Failed to cancel booking');
                              }
                            } catch (error) {
                              notificationService.showNotification({
                                type: 'error',
                                title: 'Cancellation Failed',
                                message: 'Failed to cancel booking. Please try again.',
                                context: 'booking'
                              });
                            }
                          }
                        }}
                      >
                        Cancel Booking
                      </button>
                    )}
            </div>
                ))}
            </div>
            )}
            </div>
          </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedDriveway && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Driveway</h3>
              <button className="close-btn" onClick={() => setShowBookingModal(false)}>×</button>
          </div>
            
            <div className="booking-info">
              <h4>{selectedDriveway.address}</h4>
              <p className="price">${selectedDriveway.pricePerHour}/hour</p>
              {selectedDriveway.distance && (
                <p className="distance-info">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {selectedDriveway.distance}m from your location
                </p>
              )}
        </div>
            
            <form className="modal-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const startTime = formData.get('startTime') as string;
              const hours = parseFloat(formData.get('hours') as string);
              const startDateTime = new Date(startTime);
              const endDateTime = new Date(startDateTime.getTime() + (hours * 60 * 60 * 1000));
              
        const bookingData = {
                driveway: selectedDriveway.id,
                startTime: startTime,
                endTime: endDateTime.toISOString(),
                totalAmount: selectedDriveway.pricePerHour * hours
              };

              try {
                const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
                  body: JSON.stringify(bookingData)
                });

                if (response.ok) {
                  setShowBookingModal(false);
                  setSelectedDriveway(null);
                  loadBookings();
                  notificationService.showNotification({
                    type: 'success',
                    title: 'Booking Confirmed',
                    message: 'Your booking has been confirmed!',
                    context: 'booking'
                  });
      } else {
                  throw new Error('Failed to create booking');
                }
              } catch (error) {
                notificationService.showNotification({
                  type: 'error',
                  title: 'Booking Failed',
                  message: 'Failed to create booking. Please try again.',
                  context: 'booking'
                });
              }
            }}>
        <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
        <input
                  type="datetime-local" 
                  id="startTime" 
                  name="startTime" 
                  required
                  min={new Date().toISOString().slice(0, 16)}
        />
                <small className="form-help">Pre-filled with current time + 30 minutes for travel</small>
        </div>
        
        <div className="form-group">
                <label htmlFor="hours">Duration (hours)</label>
        <input
          type="number"
                  id="hours" 
                  name="hours" 
            min="1"
                  max="24"
                  defaultValue="2"
          required
          />
        </div>
        
        <div className="form-group">
                <label htmlFor="endTime">End Time (auto-calculated)</label>
        <input
                  type="datetime-local" 
              id="endTime"
          name="endTime"
                  readOnly
                  style={{backgroundColor: '#f5f5f5'}}
                />
        </div>
        
              <div className="booking-summary">
                <div className="summary-row">
                  <span>Price per hour:</span>
                  <span>${selectedDriveway.pricePerHour}</span>
        </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span id="totalPrice">$10.00</span>
        </div>
          </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Booking
                </button>
          </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
