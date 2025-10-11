import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import PaymentStatus from './PaymentStatus';
import QuickActions from './QuickActions';
import GeocodingInputWithAutocomplete from './GeocodingInputWithAutocomplete';
import './OwnerDashboard.css';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
  isAvailable: boolean;
  totalEarnings: number;
  bookingsCount: number;
  rating: number;
  images: string[];
  amenities: string[];
}

interface Booking {
  id: string;
  driver: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number; // Changed from totalPrice to match backend
  status: string;
}

const OwnerDashboard: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'driveways' | 'analytics' | 'bookings'>('driveways');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);

  // Mock data for demonstration
  const mockDriveways: Driveway[] = [
    {
      id: '1',
      address: '123 Main Street, Downtown',
      description: 'Spacious driveway with easy access',
      pricePerHour: 5.00,
      isAvailable: true,
      totalEarnings: 245.50,
      bookingsCount: 12,
      rating: 4.8,
      images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
      amenities: ['Covered', 'Security Cameras', 'Easy Access']
    },
    {
      id: '2',
      address: '456 Oak Avenue, Midtown',
      description: 'Private driveway in quiet neighborhood',
      pricePerHour: 4.50,
      isAvailable: true,
      totalEarnings: 180.25,
      bookingsCount: 8,
      rating: 4.6,
      images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'],
      amenities: ['Private', 'Well Lit', 'Near Transit']
    }
  ];

  const mockBookings: Booking[] = [
    {
      id: '1',
      driver: 'John Doe',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T14:00:00Z',
      totalAmount: 20.00,
      status: 'confirmed'
    },
    {
      id: '2',
      driver: 'Jane Smith',
      startTime: '2024-01-16T09:00:00Z',
      endTime: '2024-01-16T17:00:00Z',
      totalAmount: 36.00,
      status: 'pending'
    }
  ];

  const loadDriveways = async () => {
    try {
      const response = await fetch('/api/driveways/owner', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDriveways(data);
      } else {
        // Fallback to mock data if API fails
        setDriveways(mockDriveways);
      }
    } catch (error) {
      console.error('Failed to load driveways:', error);
      // Fallback to mock data
      setDriveways(mockDriveways);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch(`/api/bookings/owner/${user?.id}`, {
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

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDriveways();
      loadBookings();
    }
  }, [isAuthenticated, user]);

  // Handle availability schedule checkboxes
  useEffect(() => {
    const handleCheckboxChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        const dayName = target.name;
        const startInput = document.querySelector(`input[name="${dayName}Start"]`) as HTMLInputElement;
        const endInput = document.querySelector(`input[name="${dayName}End"]`) as HTMLInputElement;
        
        if (startInput && endInput) {
          startInput.disabled = !target.checked;
          endInput.disabled = !target.checked;
          
          if (!target.checked) {
            startInput.value = '';
            endInput.value = '';
          }
        }
      }
    };

    document.addEventListener('change', handleCheckboxChange);
    return () => document.removeEventListener('change', handleCheckboxChange);
  }, [showAddModal, showEditModal]);

  // Pre-populate edit form with existing data
  useEffect(() => {
    if (showEditModal && selectedDriveway) {
      // Pre-populate availability schedule if it exists
      if (selectedDriveway.availability && Array.isArray(selectedDriveway.availability)) {
        const availability = selectedDriveway.availability;
        availability.forEach(dayAvailability => {
          const day = dayAvailability.dayOfWeek;
          const checkbox = document.querySelector(`input[name="${day}"]`) as HTMLInputElement;
          const startInput = document.querySelector(`input[name="${day}Start"]`) as HTMLInputElement;
          const endInput = document.querySelector(`input[name="${day}End"]`) as HTMLInputElement;
          
          if (checkbox && startInput && endInput && dayAvailability.isAvailable) {
            checkbox.checked = true;
            startInput.disabled = false;
            endInput.disabled = false;
            startInput.value = dayAvailability.startTime || '';
            endInput.value = dayAvailability.endTime || '';
          }
        });
      }
    }
  }, [showEditModal, selectedDriveway]);

  const handleAddDriveway = () => {
    setShowAddModal(true);
    notificationService.showNotification({
      type: 'success',
      title: 'Add Driveway',
      message: 'Add driveway form opened!',
      context: 'system'
    });
  };

  const handleEditDriveway = async (driveway: Driveway) => {
    setSelectedDriveway(driveway);
    setShowEditModal(true);
  };

  const handleDeleteDriveway = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this driveway?')) {
      try {
        const response = await fetch(`/api/driveways/${id}`, {
          method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete driveway');
        }

        setDriveways(prev => prev.filter(d => d.id !== id));
        notificationService.showNotification({
          type: 'success',
          title: 'Driveway Deleted',
          message: 'Driveway deleted successfully!',
          context: 'system'
        });
      } catch (error: any) {
        notificationService.showNotification({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to delete driveway',
          context: 'system'
        });
      }
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const driveway = driveways.find(d => d.id === id);
      if (!driveway) return;

      const response = await fetch(`/api/driveways/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isAvailable: !driveway.isAvailable
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update availability');
      }

      setDriveways(prev => prev.map(d => 
        d.id === id ? { ...d, isAvailable: !d.isAvailable } : d
      ));
      notificationService.showNotification({
        type: 'success',
        title: 'Availability Updated',
        message: 'Availability updated successfully!',
        context: 'system'
      });
    } catch (error: any) {
      notificationService.showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update availability',
        context: 'system'
      });
    }
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

  if (!isAuthenticated || !user?.roles.includes('owner')) {
    return <div className="error-container">Access Denied or Not Authenticated.</div>;
  }

  // Calculate total earnings from actual bookings
  const totalEarnings = recentBookings.reduce((sum, booking) => {
    const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
    return sum + (amount || 0);
  }, 0);
  
  // Calculate total bookings count
  const totalBookings = recentBookings.length;

  return (
    <div className="owner-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Manage Driveways</h1>
        <p className="dashboard-subtitle">Welcome back, {user?.name || 'Owner'}! Manage your driveway listings and earnings.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">${totalEarnings.toFixed(2)}</h3>
            <p className="stat-label">Total Earnings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{driveways.length}</h3>
            <p className="stat-label">Listed Driveways</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{totalBookings}</h3>
            <p className="stat-label">Total Bookings</p>
        </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </div>
          <div className="stat-content">
                <h3 className="stat-value">
                  {driveways.length > 0 
                    ? (driveways.reduce((sum, d) => sum + (d.rating || 0), 0) / driveways.length).toFixed(1)
                    : '0.0'
                  }
                </h3>
            <p className="stat-label">Average Rating</p>
          </div>
        </div>
        </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action-btn primary"
          onClick={() => setActiveTab('driveways')}
        >
          My Driveways
        </button>
        <button 
          className="quick-action-btn secondary"
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className="quick-action-btn secondary"
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        </div>
        
      {/* Driveways Tab */}
      {activeTab === 'driveways' && (
        <div className="driveways-section">
          <div className="section-header">
            <h3 className="section-title">Your Driveways</h3>
            <button className="add-btn" onClick={handleAddDriveway}>
              <span className="icon">+</span>
              Add Driveway
            </button>
        </div>

      {driveways.length === 0 ? (
        <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h4>No driveways listed yet</h4>
              <p>Add your first driveway to start earning money!</p>
              <button className="btn-primary" onClick={handleAddDriveway}>
                List Your First Driveway
              </button>
        </div>
      ) : (
            <div className="driveways-grid">
          {driveways.map((driveway) => (
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
                    <div className="availability-badge">
                      {driveway.isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                    {driveway.images && driveway.images.length > 1 && (
                      <div className="image-count-badge">
                        +{driveway.images.length - 1}
                      </div>
                    )}
              </div>
              
                  <div className="driveway-content">
                    <h4 className="driveway-address">{driveway.address}</h4>
                    <p className="driveway-description">{driveway.description}</p>
                    
                    <div className="driveway-stats">
                      <div className="stat">
                        <span className="stat-label">Price:</span>
                        <span className="stat-value">${driveway.pricePerHour}/hr</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Earnings:</span>
                        <span className="stat-value">${recentBookings
                          .filter(booking => booking.drivewayId === driveway.id)
                          .reduce((sum, booking) => {
                            const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
                            return sum + (amount || 0);
                          }, 0).toFixed(2)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Bookings:</span>
                        <span className="stat-value">{recentBookings.filter(booking => booking.drivewayId === driveway.id).length}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Rating:</span>
                        <span className="stat-value">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                          </svg>
                          {driveway.rating || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="amenities">
                      {driveway.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="amenity-tag">{amenity}</span>
                      ))}
                    </div>

                    <div className="driveway-actions">
                      <button 
                        className="action-btn secondary"
                        onClick={() => toggleAvailability(driveway.id)}
                      >
                        {driveway.isAvailable ? 'Make Unavailable' : 'Make Available'}
                      </button>
                      <button 
                        className="action-btn primary"
                        onClick={() => handleEditDriveway(driveway)}
                      >
                        Edit
                      </button>
                      <button 
                        className="action-btn danger"
                        onClick={() => handleDeleteDriveway(driveway.id)}
                      >
                        Delete
                      </button>
                    </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-container">
            <h3 className="analytics-title">Earnings Overview</h3>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>This Month</h4>
                <div className="analytics-value">${(totalEarnings * 0.3).toFixed(2)}</div>
                <div className="analytics-change positive">+12% from last month</div>
              </div>
              
              <div className="analytics-card">
                <h4>This Week</h4>
                <div className="analytics-value">${(totalEarnings * 0.1).toFixed(2)}</div>
                <div className="analytics-change positive">+8% from last week</div>
              </div>
              
              <div className="analytics-card">
                <h4>Average per Booking</h4>
                <div className="analytics-value">${totalBookings > 0 ? (totalEarnings / totalBookings).toFixed(2) : '0.00'}</div>
                <div className="analytics-change neutral">Steady performance</div>
              </div>
            </div>

            <div className="chart-placeholder">
              <div className="chart-icon">📈</div>
              <h4>Earnings Chart</h4>
              <p>Visual representation of your earnings over time</p>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bookings-section">
          <div className="bookings-container">
            <h3 className="bookings-title">Recent Bookings</h3>
            
            {recentBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </div>
                <h4>No bookings yet</h4>
                <p>Bookings will appear here once drivers start booking your driveways!</p>
              </div>
            ) : (
              <div className="bookings-list">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h4 className="booking-driver">{booking.driver}</h4>
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

                    {/* Payment Status */}
                    <PaymentStatus 
                      bookingId={booking.id} 
                      className="booking-payment-status"
                      showDetails={true}
                    />

                    {booking.status === 'pending' && (
                      <div className="booking-actions">
                        <button 
                          className="confirm-btn"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/bookings/${booking.id}/confirm`, {
                                method: 'PUT',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                              });

                              if (response.ok) {
                                notificationService.showNotification({
                                  type: 'success',
                                  title: 'Booking Confirmed',
                                  message: 'The booking has been confirmed successfully.',
                                  context: 'booking'
                                });
                                loadBookings(); // Refresh the bookings list
                              } else {
                                throw new Error('Failed to confirm booking');
                              }
                            } catch (error) {
                              notificationService.showNotification({
                                type: 'error',
                                title: 'Confirmation Failed',
                                message: 'Failed to confirm booking. Please try again.',
                                context: 'booking'
                              });
                            }
                          }}
                        >
                          Confirm
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to reject this booking?')) {
                              try {
                                const response = await fetch(`/api/bookings/${booking.id}/reject`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  }
                                });

                                if (response.ok) {
                                  notificationService.showNotification({
                                    type: 'success',
                                    title: 'Booking Rejected',
                                    message: 'The booking has been rejected.',
                                    context: 'booking'
                                  });
                                  loadBookings(); // Refresh the bookings list
                                } else {
                                  throw new Error('Failed to reject booking');
                                }
                              } catch (error) {
                                notificationService.showNotification({
                                  type: 'error',
                                  title: 'Rejection Failed',
                                  message: 'Failed to reject booking. Please try again.',
                                  context: 'booking'
                                });
                              }
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
          ))}
        </div>
      )}
          </div>
        </div>
      )}

      {/* Add Driveway Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Driveway</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form className="modal-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              // Build availability schedule
              const availability: any[] = [];
              const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              days.forEach(day => {
                if (formData.get(day)) {
                  const startTime = formData.get(`${day}Start`) as string;
                  const endTime = formData.get(`${day}End`) as string;
                  if (startTime && endTime) {
                    availability.push({
                      dayOfWeek: day,
                      isAvailable: true,
                      startTime: startTime,
                      endTime: endTime
                    });
                  }
                }
              });

              // Handle image uploads
              const imageFiles = formData.getAll('images') as File[];
              let uploadedImages: string[] = [];
              
              if (imageFiles.length > 0 && imageFiles[0].size > 0) {
                try {
                  const uploadFormData = new FormData();
                  imageFiles.forEach(file => {
                    if (file.size > 0) {
                      uploadFormData.append('images', file);
                    }
                  });

                  const uploadResponse = await fetch('/api/upload/images', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: uploadFormData
                  });

                  if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    console.log('Upload response:', uploadData);
                    // Handle both possible response formats
                    if (uploadData.imageUrls) {
                      uploadedImages = uploadData.imageUrls;
                    } else if (uploadData.images) {
                      uploadedImages = uploadData.images.map((img: any) => img.imageUrl);
                    }
                  }
                } catch (error) {
                  console.error('Image upload failed:', error);
                  notificationService.showNotification({
                    type: 'error',
                    title: 'Image Upload Failed',
                    message: 'Failed to upload images, but driveway will be created without images.',
                    context: 'system'
                  });
                }
              }

              const drivewayData = {
                address: formData.get('address') as string,
                description: formData.get('description') as string,
                pricePerHour: parseFloat(formData.get('pricePerHour') as string),
                drivewaySize: formData.get('drivewaySize') as string,
                amenities: (formData.get('amenities') as string).split(',').map(s => s.trim()),
                availability: availability,
                images: uploadedImages,
                isAvailable: true
              };

              try {
                const response = await fetch('/api/driveways', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify(drivewayData)
                });

                if (response.ok) {
                  setShowAddModal(false);
                  loadDriveways();
                  notificationService.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Driveway added successfully!',
                    context: 'system'
                  });
                } else {
                  throw new Error('Failed to add driveway');
                }
              } catch (error) {
                notificationService.showNotification({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to add driveway',
                  context: 'system'
                });
              }
            }}>
              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <div style={{ position: 'relative' }}>
                  <GeocodingInputWithAutocomplete
                    value=""
                    onChange={(address) => {
                      // Update the hidden input value
                      const hiddenInput = document.getElementById('address') as HTMLInputElement;
                      if (hiddenInput) {
                        hiddenInput.value = address;
                      }
                    }}
                    placeholder="Enter driveway address"
                    label=""
                    className="form-input"
                  />
                  <input 
                    type="hidden" 
                    id="address" 
                    name="address" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows={3}
                  placeholder="Describe your driveway..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="pricePerHour">Price per Hour ($)</label>
                <input 
                  type="number" 
                  id="pricePerHour" 
                  name="pricePerHour" 
                  min="1" 
                  step="0.5"
                  defaultValue="5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="drivewaySize">Driveway Size</label>
                <select id="drivewaySize" name="drivewaySize" required>
                  <option value="small">Small (1 car)</option>
                  <option value="medium">Medium (2 cars)</option>
                  <option value="large">Large (3+ cars)</option>
                  <option value="extra-large">Extra Large (4+ cars)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amenities">Amenities (comma-separated)</label>
                <input 
                  type="text" 
                  id="amenities" 
                  name="amenities" 
                  placeholder="e.g., Covered, Security, Easy Access"
                />
              </div>

              <div className="form-group">
                <label htmlFor="images">Images</label>
                <input 
                  type="file" 
                  id="images" 
                  name="images" 
                  multiple
                  accept="image/*"
                />
                <small>Upload up to 5 images of your driveway</small>
              </div>

              <div className="form-group">
                <label>Availability Schedule</label>
                <div className="availability-schedule">
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="monday" value="monday" />
                      Monday
                    </label>
                    <input type="time" name="mondayStart" placeholder="Start" />
                    <input type="time" name="mondayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="tuesday" value="tuesday" />
                      Tuesday
                    </label>
                    <input type="time" name="tuesdayStart" placeholder="Start" />
                    <input type="time" name="tuesdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="wednesday" value="wednesday" />
                      Wednesday
                    </label>
                    <input type="time" name="wednesdayStart" placeholder="Start" />
                    <input type="time" name="wednesdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="thursday" value="thursday" />
                      Thursday
                    </label>
                    <input type="time" name="thursdayStart" placeholder="Start" />
                    <input type="time" name="thursdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="friday" value="friday" />
                      Friday
                    </label>
                    <input type="time" name="fridayStart" placeholder="Start" />
                    <input type="time" name="fridayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="saturday" value="saturday" />
                      Saturday
                    </label>
                    <input type="time" name="saturdayStart" placeholder="Start" />
                    <input type="time" name="saturdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="sunday" value="sunday" />
                      Sunday
                    </label>
                    <input type="time" name="sundayStart" placeholder="Start" />
                    <input type="time" name="sundayEnd" placeholder="End" />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Driveway
            </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Driveway Modal */}
      {showEditModal && selectedDriveway && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Driveway</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <form className="modal-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              // Build availability schedule
              const availability: any[] = [];
              const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              days.forEach(day => {
                if (formData.get(day)) {
                  const startTime = formData.get(`${day}Start`) as string;
                  const endTime = formData.get(`${day}End`) as string;
                  if (startTime && endTime) {
                    availability.push({
                      dayOfWeek: day,
                      isAvailable: true,
                      startTime: startTime,
                      endTime: endTime
                    });
                  }
                }
              });

              // Handle image uploads
              const imageFiles = formData.getAll('images') as File[];
              let uploadedImages: string[] = selectedDriveway.images || [];
              
              if (imageFiles.length > 0 && imageFiles[0].size > 0) {
                try {
                  const uploadFormData = new FormData();
                  imageFiles.forEach(file => {
                    if (file.size > 0) {
                      uploadFormData.append('images', file);
                    }
                  });

                  const uploadResponse = await fetch('/api/upload/images', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: uploadFormData
                  });

                  if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    const newImages = uploadData.images.map((img: any) => img.imageUrl);
                    uploadedImages = [...uploadedImages, ...newImages];
                  }
                } catch (error) {
                  console.error('Image upload failed:', error);
                  notificationService.showNotification({
                    type: 'error',
                    title: 'Image Upload Failed',
                    message: 'Failed to upload new images, but driveway will be updated.',
                    context: 'system'
                  });
                }
              }

              const drivewayData = {
                address: formData.get('address') as string,
                description: formData.get('description') as string,
                pricePerHour: parseFloat(formData.get('pricePerHour') as string),
                drivewaySize: formData.get('drivewaySize') as string,
                amenities: (formData.get('amenities') as string).split(',').map(s => s.trim()),
                availability: availability,
                images: uploadedImages,
                isAvailable: true
              };

              try {
                const response = await fetch(`/api/driveways/${selectedDriveway.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify(drivewayData)
                });

                if (response.ok) {
                  setShowEditModal(false);
                  setSelectedDriveway(null);
                  loadDriveways();
                  notificationService.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Driveway updated successfully!',
                    context: 'system'
                  });
                } else {
                  throw new Error('Failed to update driveway');
                }
              } catch (error) {
                notificationService.showNotification({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to update driveway',
                  context: 'system'
                });
              }
            }}>
              <div className="form-group">
                <label htmlFor="edit-address">Address *</label>
                <div style={{ position: 'relative' }}>
                  <GeocodingInputWithAutocomplete
                    value={selectedDriveway.address}
                    onChange={(address) => {
                      // Update the hidden input value
                      const hiddenInput = document.getElementById('edit-address') as HTMLInputElement;
                      if (hiddenInput) {
                        hiddenInput.value = address;
                      }
                    }}
                    placeholder="Enter driveway address"
                    label=""
                    className="form-input"
                  />
                  <input 
                    type="hidden" 
                    id="edit-address" 
                    name="address" 
                    required 
                    defaultValue={selectedDriveway.address}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea 
                  id="edit-description" 
                  name="description" 
                  rows={3}
                  defaultValue={selectedDriveway.description}
                  placeholder="Describe your driveway..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-pricePerHour">Price per Hour ($)</label>
                <input 
                  type="number" 
                  id="edit-pricePerHour" 
                  name="pricePerHour" 
                  min="1" 
                  step="0.5"
                  defaultValue={selectedDriveway.pricePerHour}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-drivewaySize">Driveway Size</label>
                <select id="edit-drivewaySize" name="drivewaySize" required>
                  <option value="small" selected={selectedDriveway.drivewaySize === 'small'}>Small (1 car)</option>
                  <option value="medium" selected={selectedDriveway.drivewaySize === 'medium'}>Medium (2 cars)</option>
                  <option value="large" selected={selectedDriveway.drivewaySize === 'large'}>Large (3+ cars)</option>
                  <option value="extra-large" selected={selectedDriveway.drivewaySize === 'extra-large'}>Extra Large (4+ cars)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-amenities">Amenities (comma-separated)</label>
                <input 
                  type="text" 
                  id="edit-amenities" 
                  name="amenities" 
                  defaultValue={selectedDriveway.amenities?.join(', ')}
                  placeholder="e.g., Covered, Security, Easy Access"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-images">Images</label>
                <input 
                  type="file" 
                  id="edit-images" 
                  name="images" 
                  multiple
                  accept="image/*"
                />
                <small>Upload up to 5 images of your driveway</small>
              </div>

              <div className="form-group">
                <label>Availability Schedule</label>
                <div className="availability-schedule">
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="monday" value="monday" />
                      Monday
                    </label>
                    <input type="time" name="mondayStart" placeholder="Start" />
                    <input type="time" name="mondayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="tuesday" value="tuesday" />
                      Tuesday
                    </label>
                    <input type="time" name="tuesdayStart" placeholder="Start" />
                    <input type="time" name="tuesdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="wednesday" value="wednesday" />
                      Wednesday
                    </label>
                    <input type="time" name="wednesdayStart" placeholder="Start" />
                    <input type="time" name="wednesdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="thursday" value="thursday" />
                      Thursday
                    </label>
                    <input type="time" name="thursdayStart" placeholder="Start" />
                    <input type="time" name="thursdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="friday" value="friday" />
                      Friday
                    </label>
                    <input type="time" name="fridayStart" placeholder="Start" />
                    <input type="time" name="fridayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="saturday" value="saturday" />
                      Saturday
                    </label>
                    <input type="time" name="saturdayStart" placeholder="Start" />
                    <input type="time" name="saturdayEnd" placeholder="End" />
                  </div>
                  <div className="schedule-row">
                    <label>
                      <input type="checkbox" name="sunday" value="sunday" />
                      Sunday
                    </label>
                    <input type="time" name="sundayStart" placeholder="Start" />
                    <input type="time" name="sundayEnd" placeholder="End" />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Driveway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default OwnerDashboard;
