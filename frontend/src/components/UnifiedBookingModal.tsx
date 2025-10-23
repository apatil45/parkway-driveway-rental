import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './SimpleBookingModal.css';

// Stripe configuration
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Check if we have a valid Stripe key
const isStripeConfigured = stripePublicKey && 
  !stripePublicKey.includes('your_stripe_public_key_here') && 
  !stripePublicKey.includes('...') &&
  stripePublicKey.startsWith('pk_');

// Only load Stripe if properly configured
const stripePromise = isStripeConfigured ? loadStripe(stripePublicKey) : null;

interface UnifiedBookingModalProps {
  onBookingSuccess?: (bookingIds: string[]) => void;
}

const UnifiedBookingModal: React.FC<UnifiedBookingModalProps> = ({ onBookingSuccess }) => {
  const {
    isBookingModalOpen,
    selectedSlots,
    closeBookingModal,
    removeSlotFromSelection,
    totalSelectedSlots
  } = useBooking();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    specialRequests: ''
  });
  
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isBookingModalOpen) {
      setCurrentStep('form');
      setError(null);
      setClientSecret(null);
      generateSmartSuggestions();
    }
  }, [isBookingModalOpen]);

  // Generate smart time suggestions
  const generateSmartSuggestions = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toISOString().split('T')[0];
    const selectedDate = formData.date;
    
    const suggestions = [];
    
    // If booking for today, suggest next available hour
    if (selectedDate === today) {
      const nextHour = new Date(now);
      nextHour.setHours(currentHour + 1, 0, 0, 0);
      
      suggestions.push({
        id: 'next-hour',
        label: 'Next available hour',
        startTime: nextHour.toTimeString().slice(0, 5),
        endTime: new Date(nextHour.getTime() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5),
        description: 'Perfect for quick errands',
        price: calculateTotalPrice(2)
      });
      
      // If it's morning, suggest work day
      if (currentHour < 10) {
        suggestions.push({
          id: 'work-day',
          label: 'Work day (9 AM - 5 PM)',
          startTime: '09:00',
          endTime: '17:00',
          description: 'Full work day parking',
          price: calculateTotalPrice(8)
        });
      }
    }
    
    // Common parking durations
    const commonDurations = [
      { hours: 1, label: '1 hour', description: 'Quick stop' },
      { hours: 2, label: '2 hours', description: 'Shopping or meeting' },
      { hours: 4, label: '4 hours', description: 'Half day' },
      { hours: 8, label: '8 hours', description: 'Full day' }
    ];
    
    commonDurations.forEach(duration => {
      const startTime = '09:00';
      const endTime = new Date(`2000-01-01T${startTime}`).getTime() + (duration.hours * 60 * 60 * 1000);
      const endTimeStr = new Date(endTime).toTimeString().slice(0, 5);
      
      suggestions.push({
        id: `duration-${duration.hours}`,
        label: duration.label,
        startTime,
        endTime: endTimeStr,
        description: duration.description,
        price: calculateTotalPrice(duration.hours)
      });
    });
    
    setSmartSuggestions(suggestions);
  };

  // Calculate total price for all selected slots
  const calculateTotalPrice = (hours: number) => {
    return selectedSlots.reduce((total, slot) => {
      return total + (Number(slot.driveway.pricePerHour || 0) * hours);
    }, 0);
  };

  // Calculate total duration in hours
  const calculateDuration = () => {
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  // Handle smart suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime
    }));
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSlots.length === 0) {
      setError('Please select at least one parking slot');
      return;
    }

    const duration = calculateDuration();
    if (duration <= 0) {
      setError('End time must be after start time');
      return;
    }

    if (duration > 24) {
      setError('Booking cannot exceed 24 hours');
      return;
    }

    setError(null);
    
    // If Stripe is configured, proceed to payment
    if (isStripeConfigured) {
      try {
        setIsSubmitting(true);
        
        // Create payment intent
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            amount: Math.round(calculateTotalPrice(duration) * 100), // Convert to cents
            currency: 'usd',
            metadata: {
              slotCount: selectedSlots.length,
              duration: duration.toString()
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { client_secret } = await response.json();
        setClientSecret(client_secret);
        setCurrentStep('payment');
      } catch (error) {
        console.error('Payment setup error:', error);
        setError('Failed to setup payment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Demo mode - skip payment
      setCurrentStep('payment');
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!isStripeConfigured) {
      // Demo mode - create bookings directly
      await createDemoBookings();
      return;
    }

    const stripe = await stripePromise;
    const elements = useElements();
    
    if (!stripe || !elements) {
      setError('Payment system not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/booking-success',
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
      } else {
        // Payment succeeded, create bookings
        await createBookings();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create bookings (both demo and real)
  const createBookings = async () => {
    const duration = calculateDuration();
    const bookingPromises = selectedSlots.map(async (slot) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          drivewayId: slot.driveway.id,
          startDate: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          specialRequests: formData.specialRequests,
          totalAmount: Number(slot.driveway.pricePerHour) * duration
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create booking for ${slot.driveway.address}`);
      }

      return response.json();
    });

    try {
      const bookings = await Promise.all(bookingPromises);
      console.log('All bookings created successfully:', bookings);
      
      setCurrentStep('success');
      onBookingSuccess?.(bookings.map(b => b.id));
    } catch (error) {
      console.error('Booking creation error:', error);
      setError('Failed to create some bookings. Please try again.');
    }
  };

  // Demo booking creation (no payment)
  const createDemoBookings = async () => {
    const duration = calculateDuration();
    
    try {
      const bookingPromises = selectedSlots.map(async (slot) => {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            drivewayId: slot.driveway.id,
            startDate: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            specialRequests: formData.specialRequests,
            totalAmount: Number(slot.driveway.pricePerHour) * duration
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to create booking for ${slot.driveway.address}`);
        }

        return response.json();
      });

      const bookings = await Promise.all(bookingPromises);
      console.log('Demo bookings created successfully:', bookings);
      
      setCurrentStep('success');
      onBookingSuccess?.(bookings.map(b => b.id));
    } catch (error) {
      console.error('Demo booking creation error:', error);
      setError('Failed to create bookings. Please try again.');
    }
  };

  // Get modal positioning style
  const getModalStyle = () => {
    if (selectedSlots.length > 0 && selectedSlots[0].clickPosition) {
      const { x, y } = selectedSlots[0].clickPosition;
      return {
        position: 'fixed' as const,
        top: Math.min(y, window.innerHeight - 400),
        left: Math.min(x, window.innerWidth - 400),
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        maxWidth: '95vw',
        maxHeight: '95vh'
      };
    }
    
    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      maxWidth: '95vw',
      maxHeight: '95vh'
    };
  };

  if (!isBookingModalOpen) return null;

  return (
    <div className="simple-booking-modal-overlay" onClick={closeBookingModal}>
      <div 
        className="simple-booking-modal" 
        onClick={(e) => e.stopPropagation()}
        style={getModalStyle()}
      >
        <div className="modal-header">
          <h2>
            Book Parking {totalSelectedSlots > 1 ? `Spots (${totalSelectedSlots})` : 'Spot'}
          </h2>
          <button onClick={closeBookingModal} className="close-button" aria-label="Close booking modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {currentStep === 'form' && (
            <>
              {/* Selected Slots Display */}
              <div className="selected-slots-section">
                <h3>Selected Parking Spots ({totalSelectedSlots})</h3>
                <div className="slots-list">
                  {selectedSlots.map((slot, index) => (
                    <div key={slot.driveway.id} className="slot-item">
                      <div className="slot-info">
                        <h4>{slot.driveway.address}</h4>
                        <p className="slot-price">${Number(slot.driveway.pricePerHour || 0).toFixed(2)}/hour</p>
                        {slot.driveway.distance && (
                          <p className="slot-distance">{slot.driveway.distance.toFixed(0)}m away</p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeSlotFromSelection(slot.driveway.id)}
                        className="remove-slot-btn"
                        aria-label={`Remove ${slot.driveway.address}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Time Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="smart-suggestions-section">
                  <h3>Quick Time Options</h3>
                  <div className="suggestions-grid">
                    {smartSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        className="suggestion-card"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="suggestion-header">
                          <span className="suggestion-label">{suggestion.label}</span>
                          <span className="suggestion-price">${suggestion.price.toFixed(2)}</span>
                        </div>
                        <p className="suggestion-description">{suggestion.description}</p>
                        <p className="suggestion-time">{suggestion.startTime} - {suggestion.endTime}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Form */}
              <form onSubmit={handleFormSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startTime">Start Time</label>
                    <input
                      type="time"
                      id="startTime"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endTime">End Time</label>
                    <input
                      type="time"
                      id="endTime"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="specialRequests">Special Requests (Optional)</label>
                  <textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                  />
                </div>

                {/* Total Price Display */}
                <div className="total-price-section">
                  <div className="price-breakdown">
                    <div className="price-row">
                      <span>Duration:</span>
                      <span>{calculateDuration().toFixed(1)} hours</span>
                    </div>
                    <div className="price-row">
                      <span>Total for {totalSelectedSlots} spot{totalSelectedSlots > 1 ? 's' : ''}:</span>
                      <span className="total-price">${calculateTotalPrice(calculateDuration()).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={closeBookingModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : isStripeConfigured ? 'Continue to Payment' : 'Complete Booking'}
                  </button>
                </div>
              </form>
            </>
          )}

          {currentStep === 'payment' && (
            <div className="payment-section">
              {isStripeConfigured ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm 
                    onSubmit={handlePaymentSubmit}
                    isSubmitting={isSubmitting}
                    error={error}
                    onBack={() => setCurrentStep('form')}
                  />
                </Elements>
              ) : (
                <div className="demo-payment">
                  <h3>Demo Booking</h3>
                  <p>This is a demonstration booking. No payment will be processed.</p>
                  <div className="demo-actions">
                    <button onClick={() => setCurrentStep('form')} className="btn-secondary">
                      Back to Form
                    </button>
                    <button 
                      onClick={createDemoBookings}
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating Booking...' : 'Complete Demo Booking'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'success' && (
            <div className="success-section">
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h3>Booking Successful!</h3>
              <p>Your parking reservation{totalSelectedSlots > 1 ? 's have' : ' has'} been confirmed.</p>
              <div className="booking-summary">
                <p><strong>Spots Booked:</strong> {totalSelectedSlots}</p>
                <p><strong>Date:</strong> {formData.date}</p>
                <p><strong>Time:</strong> {formData.startTime} - {formData.endTime}</p>
                <p><strong>Total:</strong> ${calculateTotalPrice(calculateDuration()).toFixed(2)}</p>
              </div>
              <button onClick={closeBookingModal} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Payment Form Component
const PaymentForm: React.FC<{
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
}> = ({ onSubmit, isSubmitting, error, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="payment-form">
      <h3>Payment Information</h3>
      <div className="payment-element">
        <PaymentElement />
      </div>
      
      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}

      <div className="payment-actions">
        <button onClick={onBack} className="btn-secondary" disabled={isSubmitting}>
          Back
        </button>
        <button 
          onClick={onSubmit}
          className="btn-primary"
          disabled={!stripe || !elements || isSubmitting}
        >
          {isSubmitting ? 'Processing Payment...' : 'Complete Payment'}
        </button>
      </div>
    </div>
  );
};

export default UnifiedBookingModal;
