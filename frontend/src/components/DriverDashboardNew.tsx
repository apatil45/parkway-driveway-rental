import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PaymentStatus from './PaymentStatus';
import SmartBookingModal from './SmartBookingModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import QuickActions from './QuickActions';
import UberStyleInterface from './UberStyleInterface';
import './DriverDashboard.css';

interface Booking {
  id: string;
  driveway: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  stripePaymentId?: string;
}

const DriverDashboardNew: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDriveway, setSelectedDriveway] = useState<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Fetch recent bookings
  useEffect(() => {
    if (user?.id) {
      fetchRecentBookings();
    }
  }, [user?.id]);

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch(`/api/bookings/driver/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const bookings = await response.json();
      setRecentBookings(bookings.slice(0, 5)); // Show only recent 5 bookings
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookingsError('Failed to load recent bookings');
    }
  };

  const handleBookDriveway = (driveway: any) => {
    setSelectedDriveway(driveway);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedDriveway(null);
    fetchRecentBookings(); // Refresh bookings
  };

  const handleBookingCancel = () => {
    setShowBookingModal(false);
    setSelectedDriveway(null);
  };

  if (isLoading) {
    return (
      <div className="driver-dashboard">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="driver-dashboard-new">
      {/* Main Uber-style Interface */}
      <div className="main-interface">
        <UberStyleInterface />
      </div>

      {/* Recent Bookings Section */}
      <div className="recent-bookings-section">
        <div className="section-header">
          <h2>Recent Bookings</h2>
          <p>Your latest parking reservations</p>
        </div>

        {bookingsError ? (
          <ErrorDisplay 
            message={bookingsError}
            onRetry={fetchRecentBookings}
          />
        ) : recentBookings.length > 0 ? (
          <div className="bookings-grid">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h3>Booking #{booking.id.slice(-8)}</h3>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="booking-details">
                  <div className="detail-row">
                    <span className="label">Driveway:</span>
                    <span className="value">{booking.driveway}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">
                      {new Date(booking.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">
                      {booking.startTime} - {booking.endTime}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">${booking.totalAmount}</span>
                  </div>
                </div>

                {booking.stripePaymentId && (
                  <div className="payment-status">
                    <PaymentStatus bookingId={booking.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-bookings">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M9 9h6v6H9z"/>
            </svg>
            <h3>No recent bookings</h3>
            <p>Your parking reservations will appear here.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <QuickActions />
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDriveway && (
        <SmartBookingModal
          isOpen={showBookingModal}
          onClose={handleBookingCancel}
          driveway={selectedDriveway}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default DriverDashboardNew;
