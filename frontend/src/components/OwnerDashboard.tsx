import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import PaymentStatus from './PaymentStatus';
import QuickActions from './QuickActions';
import GeocodingInputWithAutocomplete from './GeocodingInputWithAutocomplete';
import AvailabilitySchedule from './AvailabilitySchedule';

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
  availability?: string; // Add missing property
  drivewaySize?: string; // Add missing property
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
  drivewayId?: string; // Add missing property
}

const OwnerDashboard: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'driveways' | 'analytics' | 'bookings'>('driveways');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);


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
        console.error('Failed to load driveways:', response.statusText);
        setDriveways([]);
      }
    } catch (error) {
      console.error('Failed to load driveways:', error);
      setDriveways([]);
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
        console.error('Failed to load bookings:', response.statusText);
        setRecentBookings([]);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setRecentBookings([]);
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

  // Calculate real time-based analytics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Filter bookings by time periods
  const thisMonthBookings = recentBookings.filter(booking => {
    const bookingDate = new Date(booking.startDate);
    return bookingDate >= startOfMonth;
  });
  
  const thisWeekBookings = recentBookings.filter(booking => {
    const bookingDate = new Date(booking.startDate);
    return bookingDate >= startOfWeek;
  });
  
  // Calculate earnings for each period
  const thisMonthEarnings = thisMonthBookings.reduce((sum, booking) => {
    const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
    return sum + (amount || 0);
  }, 0);
  
  const thisWeekEarnings = thisWeekBookings.reduce((sum, booking) => {
    const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
    return sum + (amount || 0);
  }, 0);
  
  // Calculate growth percentages (compare with previous periods)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(startOfWeek);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  
  const lastMonthBookings = recentBookings.filter(booking => {
    const bookingDate = new Date(booking.startDate);
    return bookingDate >= lastMonthStart && bookingDate <= lastMonthEnd;
  });
  
  const lastWeekBookings = recentBookings.filter(booking => {
    const bookingDate = new Date(booking.startDate);
    return bookingDate >= lastWeekStart && bookingDate <= lastWeekEnd;
  });
  
  const lastMonthEarnings = lastMonthBookings.reduce((sum, booking) => {
    const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
    return sum + (amount || 0);
  }, 0);
  
  const lastWeekEarnings = lastWeekBookings.reduce((sum, booking) => {
    const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
    return sum + (amount || 0);
  }, 0);
  
  // Calculate growth percentages
  const monthlyGrowth = lastMonthEarnings > 0 ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100) : 0;
  const weeklyGrowth = lastWeekEarnings > 0 ? ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Manage Driveways</h1>
          <p className="text-lg sm:text-xl text-gray-600">Welcome back, {user?.name || 'Owner'}! Manage your driveway listings and earnings.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">${totalEarnings.toFixed(2)}</h3>
                <p className="text-gray-600 font-medium">Total Earnings</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-blue-600 mb-1">{driveways.length}</h3>
                <p className="text-gray-600 font-medium">Listed Driveways</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-purple-600 mb-1">{totalBookings}</h3>
                <p className="text-gray-600 font-medium">Total Bookings</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-yellow-600 mb-1">
                  {driveways.length > 0 
                    ? (driveways.reduce((sum, d) => sum + (d.rating || 0), 0) / driveways.length).toFixed(1)
                    : '0.0'
                  }
                </h3>
                <p className="text-gray-600 font-medium">Average Rating</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          <button 
            className={`btn ${activeTab === 'driveways' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab('driveways')}
          >
            My Driveways
          </button>
          <button 
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </div>
        
        {/* Driveways Tab */}
        {activeTab === 'driveways' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Your Driveways</h3>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddDriveway}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Driveway
                </button>
              </div>
            </div>

            {driveways.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">No driveways listed yet</h4>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Add your first driveway to start earning money from drivers who need parking!</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddDriveway}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  List Your First Driveway
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {driveways.map((driveway) => (
                    <div key={driveway.id} className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        {driveway.images && driveway.images.length > 0 ? (
                          <img 
                            src={driveway.images[0]} 
                            alt={driveway.address}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Driveway';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21,15 16,10 5,21"/>
                            </svg>
                            <p className="text-sm mt-2">No image</p>
                          </div>
                        )}
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
                          driveway.isAvailable 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {driveway.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                        {driveway.images && driveway.images.length > 1 && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                            +{driveway.images.length - 1}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{driveway.address}</h4>
                        <p className="text-gray-600 text-sm mb-4">{driveway.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Price</div>
                            <div className="font-semibold text-green-600">${driveway.pricePerHour}/hr</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Earnings</div>
                            <div className="font-semibold text-blue-600">${recentBookings
                              .filter(booking => booking.drivewayId === driveway.id)
                              .reduce((sum, booking) => {
                                const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
                                return sum + (amount || 0);
                              }, 0).toFixed(2)}</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Bookings</div>
                            <div className="font-semibold text-purple-600">{recentBookings.filter(booking => booking.drivewayId === driveway.id).length}</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Rating</div>
                            <div className="flex items-center justify-center gap-1 font-semibold text-yellow-600">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                              </svg>
                              {driveway.rating || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {driveway.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            className="btn btn-outline btn-sm flex-1"
                            onClick={() => toggleAvailability(driveway.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                              {driveway.isAvailable ? (
                                <path d="M18 6L6 18M6 6l12 12"/>
                              ) : (
                                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              )}
                            </svg>
                            {driveway.isAvailable ? 'Make Unavailable' : 'Make Available'}
                          </button>
                          <button 
                            className="btn btn-primary btn-sm flex-1"
                            onClick={() => handleEditDriveway(driveway)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                            onClick={() => handleDeleteDriveway(driveway.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="card">
            <div className="card-body">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-compact">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">${thisMonthEarnings.toFixed(2)}</div>
                    <div className={`flex items-center gap-1 ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyGrowth >= 0 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
                          <polyline points="17,6 23,6 23,12"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/>
                          <polyline points="17,18 23,18 23,12"/>
                        </svg>
                      )}
                      <span className="text-sm font-medium">
                        {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-compact">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">This Week</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">${thisWeekEarnings.toFixed(2)}</div>
                    <div className={`flex items-center gap-1 ${weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {weeklyGrowth >= 0 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
                          <polyline points="17,6 23,6 23,12"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/>
                          <polyline points="17,18 23,18 23,12"/>
                        </svg>
                      )}
                      <span className="text-sm font-medium">
                        {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}% from last week
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-compact">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Average per Booking</h3>
                    <div className="text-3xl font-bold text-purple-600 mb-2">${totalBookings > 0 ? (totalEarnings / totalBookings).toFixed(2) : '0.00'}</div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span className="text-sm font-medium">
                        {totalBookings} total bookings
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-compact">
                <div className="card-body">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Earnings Breakdown</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-700">Recent Performance</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">This Month</span>
                          <span className="font-semibold text-green-600">${thisMonthEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">This Week</span>
                          <span className="font-semibold text-blue-600">${thisWeekEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Total All Time</span>
                          <span className="font-semibold text-purple-600">${totalEarnings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-700">Booking Statistics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Total Bookings</span>
                          <span className="font-semibold text-gray-900">{totalBookings}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">This Month</span>
                          <span className="font-semibold text-gray-900">{thisMonthBookings.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">This Week</span>
                          <span className="font-semibold text-gray-900">{thisWeekBookings.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {totalBookings === 0 && (
                    <div className="text-center py-8 mt-6">
                      <div className="text-4xl mb-4">📊</div>
                      <h4 className="text-lg font-medium text-gray-700 mb-2">No Data Yet</h4>
                      <p className="text-gray-500">Analytics will appear here once you start receiving bookings.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="card">
            <div className="card-body">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Bookings</h2>
            
              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <line x1="8" y1="6" x2="21" y2="6"/>
                      <line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/>
                      <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600">Bookings will appear here once drivers start booking your driveways!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="card-compact">
                      <div className="card-body">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{booking.driver}</h3>
                            <span 
                              className="badge"
                              style={{ backgroundColor: getStatusColor(booking.status) }}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <span className="text-sm">
                              {new Date(booking.startDate).toLocaleDateString()} • {' '}
                              {new Date(booking.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {' '}
                              {new Date(booking.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="1" x2="12" y2="23"/>
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            <span className="text-sm font-semibold text-green-600">${Number(booking.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div className="mb-4">
                          <PaymentStatus 
                            bookingId={booking.id} 
                            showDetails={true}
                          />
                        </div>

                        {booking.status === 'pending' && (
                          <div className="flex gap-3">
                            <button 
                              className="btn btn-primary btn-sm"
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
                              className="btn btn-outline btn-sm"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Add Driveway Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New Driveway</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <form className="p-6 space-y-4" onSubmit={async (e) => {
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
                <label htmlFor="address" className="form-label">Address *</label>
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
                <label htmlFor="description" className="form-label">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows={3}
                  placeholder="Describe your driveway..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="pricePerHour" className="form-label">Price per Hour ($)</label>
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
                <label htmlFor="drivewaySize" className="form-label">Driveway Size</label>
                <select id="drivewaySize" name="drivewaySize" required>
                  <option value="small">Small (1 car)</option>
                  <option value="medium">Medium (2 cars)</option>
                  <option value="large">Large (3+ cars)</option>
                  <option value="extra-large">Extra Large (4+ cars)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amenities" className="form-label">Amenities (comma-separated)</label>
                <input 
                  type="text" 
                  id="amenities" 
                  name="amenities" 
                  placeholder="e.g., Covered, Security, Easy Access"
                />
              </div>

              <div className="form-group">
                <label htmlFor="images" className="form-label">Images</label>
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
                <AvailabilitySchedule
                  value={[]}
                  onChange={(availability) => {
                    // Store availability in a ref or state for form submission
                    console.log('Availability changed:', availability);
                  }}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Driveway
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driveway Modal */}
      {showEditModal && selectedDriveway && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Edit Driveway</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <form className="p-6 space-y-4" onSubmit={async (e) => {
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
                <label htmlFor="edit-address" className="form-label">Address *</label>
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
                <label htmlFor="edit-description" className="form-label">Description</label>
                <textarea 
                  id="edit-description" 
                  name="description" 
                  rows={3}
                  defaultValue={selectedDriveway.description}
                  placeholder="Describe your driveway..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-pricePerHour" className="form-label">Price per Hour ($)</label>
                <input 
                  type="number" 
                  id="edit-pricePerHour" 
                  name="pricePerHour" 
                  min="1" 
                  step="0.5"
                  defaultValue={selectedDriveway.pricePerHour}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-drivewaySize" className="form-label">Driveway Size</label>
                <select id="edit-drivewaySize" name="drivewaySize" required className="form-select">
                  <option value="small" selected={selectedDriveway.drivewaySize === 'small'}>Small (1 car)</option>
                  <option value="medium" selected={selectedDriveway.drivewaySize === 'medium'}>Medium (2 cars)</option>
                  <option value="large" selected={selectedDriveway.drivewaySize === 'large'}>Large (3+ cars)</option>
                  <option value="extra-large" selected={selectedDriveway.drivewaySize === 'extra-large'}>Extra Large (4+ cars)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-amenities" className="form-label">Amenities</label>
                <input 
                  type="text" 
                  id="edit-amenities" 
                  name="amenities" 
                  defaultValue={selectedDriveway.amenities?.join(', ')}
                  placeholder="Covered, Security, Easy Access"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-images" className="form-label">Images</label>
                <input 
                  type="file" 
                  id="edit-images" 
                  name="images" 
                  multiple
                  accept="image/*"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <AvailabilitySchedule
                  value={Array.isArray(selectedDriveway?.availability) ? selectedDriveway.availability : []}
                  onChange={(availability) => {
                    // Store availability in a ref or state for form submission
                    console.log('Availability changed:', availability);
                  }}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Driveway
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
};

export default OwnerDashboard;
