import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import StripePaymentModal from './StripePaymentModal';
import './SmartBookingModal.css';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
  coordinates?: { lat: number; lng: number };
  amenities: string[];
  rating: number;
  images: string[];
}

interface SmartBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveway: Driveway;
  onBookingSuccess?: (bookingId: string) => void;
}

type BookingStep = 'date' | 'time' | 'payment' | 'confirm';

const SmartBookingModal: React.FC<SmartBookingModalProps> = ({
  isOpen,
  onClose,
  driveway,
  onBookingSuccess
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    selectedDate: '',
    startTime: '',
    endTime: '',
    totalHours: 0,
    totalPrice: 0,
    specialRequests: '',
    useOptimizations: true
  });


  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('date');
    }
  }, [isOpen]);

  // Calculate total price
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
      
      const totalPrice = totalHours * driveway.pricePerHour;
      
      setFormData(prev => ({
        ...prev,
        totalHours,
        totalPrice: Math.round(totalPrice * 100) / 100
      }));
    }
  }, [formData.startTime, formData.endTime, driveway.pricePerHour]);

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({ ...prev, selectedDate: date }));
    setCurrentStep('time');
  };

  const handleTimeSelect = (startTime: string, endTime: string) => {
    setFormData(prev => ({ ...prev, startTime, endTime }));
    setCurrentStep('payment');
  };


  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsSubmitting(true);
    
    const bookingData = {
      driveway: driveway.id,
      startTime: `${formData.selectedDate}T${formData.startTime}`,
      endTime: `${formData.selectedDate}T${formData.endTime}`,
      totalAmount: formData.totalPrice,
      specialRequests: formData.specialRequests,
      stripePaymentId: paymentIntentId
    };
    
    console.log('Sending booking data:', bookingData);
    console.log('Driveway object:', driveway);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('Booking API response status:', response.status);
      
      if (response.ok) {
        const booking = await response.json();
        console.log('Booking created successfully:', booking);
        notificationService.showSuccess('Booking confirmed! 🎉');
        onBookingSuccess?.(booking.id);
        setCurrentStep('confirm');
        setShowPaymentModal(false);
      } else {
        const errorData = await response.json();
        console.error('Booking API error:', errorData);
        throw new Error(errorData.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking creation failed:', error);
      notificationService.showError('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Check if user is authenticated and has driver role
  if (!user) {
    return (
      <div className="smart-booking-modal-overlay" role="dialog" aria-modal="true">
        <div className="smart-booking-modal">
          <div className="modal-header">
            <h2>Authentication Required</h2>
            <button onClick={onClose} className="close-button" aria-label="Close booking modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="modal-content">
            <p>Please log in to book a parking spot.</p>
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has driver role
  if (!user.roles || !user.roles.includes('driver')) {
    return (
      <div className="smart-booking-modal-overlay" role="dialog" aria-modal="true">
        <div className="smart-booking-modal">
          <div className="modal-header">
            <h2>Driver Role Required</h2>
            <button onClick={onClose} className="close-button" aria-label="Close booking modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="modal-content">
            <p>You need to have a driver role to book parking spots. Please contact support to update your account.</p>
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="smart-booking-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-booking-title"
      aria-describedby="smart-booking-description"
    >
      <div className="smart-booking-modal">
        <div className="modal-header">
          <div className="header-content">
            <h2 id="smart-booking-title">🧠 Smart Booking</h2>
            <p id="smart-booking-description" className="modal-subtitle">
              Book your parking space with our intelligent booking system
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="close-button" 
            aria-label="Close booking modal"
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Date Selection Step */}
          {currentStep === 'date' && (
            <div className="date-selection-step">
              <h3>Select Date</h3>
              <p className="step-description">Choose your preferred parking date from the available options below.</p>
              <div className="date-grid" role="group" aria-label="Available dates">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const isToday = i === 0;
                  const isSelected = formData.selectedDate === dateStr;
                  
                  return (
                    <button
                      key={dateStr}
                      className={`date-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(dateStr)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${date.toLocaleDateString('en', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}${isToday ? ' (Today)' : ''}`}
                      type="button"
                    >
                      <div className="date-day">{date.getDate()}</div>
                      <div className="date-month">{date.toLocaleDateString('en', { month: 'short' })}</div>
                      <div className="date-weekday">{date.toLocaleDateString('en', { weekday: 'short' })}</div>
                      {isToday && <div className="today-badge" aria-label="Today">Today</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Selection Step */}
          {currentStep === 'time' && (
            <div className="time-selection-step">
              <h3>Select Time</h3>
              <p className="step-description">Choose your parking start and end times for {new Date(formData.selectedDate).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
              
              <div className="time-inputs">
                <div className="time-input-group">
                  <label htmlFor="start-time">Start Time</label>
                  <input
                    id="start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    aria-describedby="start-time-help"
                    required
                  />
                  <small id="start-time-help" className="input-help">When do you want to start parking?</small>
                </div>
                <div className="time-input-group">
                  <label htmlFor="end-time">End Time</label>
                  <input
                    id="end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    aria-describedby="end-time-help"
                    required
                  />
                  <small id="end-time-help" className="input-help">When do you plan to leave?</small>
                </div>
              </div>
              
              {formData.startTime && formData.endTime && (
                <div className="time-summary" role="region" aria-label="Booking summary">
                  <div className="summary-card">
                    <div className="summary-item">
                      <span className="label">Duration:</span>
                      <span className="value">{formData.totalHours.toFixed(1)} hours</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Rate:</span>
                      <span className="value">${Number(driveway.pricePerHour || 0).toFixed(2)}/hour</span>
                    </div>
                    <div className="summary-item total">
                      <span className="label">Total:</span>
                      <span className="value">${formData.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="step-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep('date')}
                  type="button"
                >
                  ← Back to Date
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleTimeSelect(formData.startTime, formData.endTime)}
                  disabled={!formData.startTime || !formData.endTime}
                  type="button"
                >
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="payment-step">
              <h3>💳 Payment</h3>
              <p className="step-description">Review your booking details and proceed to secure payment.</p>
              
              <div className="booking-summary" role="region" aria-label="Booking summary">
                <h4>Booking Details</h4>
                <div className="summary-card">
                  <div className="summary-item">
                    <span className="label">📍 Location:</span>
                    <span className="value">{driveway.address}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(formData.selectedDate).toLocaleDateString('en', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Time:</span>
                    <span className="value">{formData.startTime} - {formData.endTime}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Duration:</span>
                    <span className="value">{formData.totalHours.toFixed(1)} hours</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Rate:</span>
                    <span className="value">${Number(driveway.pricePerHour || 0).toFixed(2)}/hour</span>
                  </div>
                  <div className="summary-item total">
                    <span className="label">Total Amount:</span>
                    <span className="value">${formData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="special-requests">
                <label htmlFor="special-requests">Special Requests (Optional)</label>
                <textarea
                  id="special-requests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special instructions or requests for your parking..."
                  rows={3}
                  aria-describedby="special-requests-help"
                />
                <small id="special-requests-help" className="input-help">
                  Let the owner know about any special needs or instructions
                </small>
              </div>
              
              <div className="step-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep('time')}
                  type="button"
                >
                  ← Back to Time
                </button>
                <button 
                  className="btn btn-primary payment-button"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      💳 Pay & Book Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirm' && (
            <div className="confirmation-step">
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
              </div>
              <h3>🎉 Booking Confirmed!</h3>
              <p className="confirmation-message">
                Your parking space has been successfully booked and payment processed.
              </p>
              
              <div className="confirmation-details" role="region" aria-label="Booking confirmation details">
                <div className="confirmation-card">
                  <div className="confirmation-item">
                    <span className="label">📍 Location:</span>
                    <span className="value">{driveway.address}</span>
                  </div>
                  <div className="confirmation-item">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(formData.selectedDate).toLocaleDateString('en', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="confirmation-item">
                    <span className="label">Time:</span>
                    <span className="value">{formData.startTime} - {formData.endTime}</span>
                  </div>
                  <div className="confirmation-item">
                    <span className="label">Amount Paid:</span>
                    <span className="value">${formData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="confirmation-actions">
                <button 
                  className="btn btn-primary"
                  onClick={onClose}
                  type="button"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <StripePaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={formData.totalPrice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default SmartBookingModal;
