import React, { useState, useEffect } from 'react';
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

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
  images: string[];
  rating: number;
  distance?: number;
  owner?: {
    name: string;
    rating: number;
  };
  features?: string[];
  amenities?: string[];
}

interface SimpleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveway: Driveway;
  onBookingSuccess?: (bookingId: string) => void;
  clickPosition?: { x: number; y: number };
}

const SimpleBookingModal: React.FC<SimpleBookingModalProps> = ({
  isOpen,
  onClose,
  driveway,
  onBookingSuccess,
  clickPosition
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '09:00', // Default start time
    endTime: '17:00', // Default end time (8 hours later)
    specialRequests: ''
  });
  const [quickDuration, setQuickDuration] = useState<number | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate smart time suggestions
  const generateSmartSuggestions = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
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
        price: Number(driveway.pricePerHour) * 2
      });
      
      // If it's morning, suggest work day
      if (currentHour < 10) {
        suggestions.push({
          id: 'work-day',
          label: 'Work day (9 AM - 5 PM)',
          startTime: '09:00',
          endTime: '17:00',
          description: 'Full work day parking',
          price: Number(driveway.pricePerHour) * 8
        });
      }
    }
    
    // Common scenarios based on time of day
    if (currentHour >= 8 && currentHour <= 10) {
      suggestions.push({
        id: 'morning-meeting',
        label: 'Morning meeting (2 hours)',
        startTime: '10:00',
        endTime: '12:00',
        description: 'Perfect for morning appointments',
        price: Number(driveway.pricePerHour) * 2
      });
    }
    
    if (currentHour >= 11 && currentHour <= 14) {
      suggestions.push({
        id: 'lunch-shopping',
        label: 'Lunch & shopping (2 hours)',
        startTime: '12:00',
        endTime: '14:00',
        description: 'Great for lunch and quick shopping',
        price: Number(driveway.pricePerHour) * 2
      });
    }
    
    if (currentHour >= 16 && currentHour <= 18) {
      suggestions.push({
        id: 'evening-out',
        label: 'Evening out (4 hours)',
        startTime: '18:00',
        endTime: '22:00',
        description: 'Perfect for dinner and entertainment',
        price: Number(driveway.pricePerHour) * 4
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  // Handle quick duration selection
  useEffect(() => {
    if (quickDuration) {
      const now = new Date();
      const endTime = new Date(now.getTime() + (quickDuration * 60 * 1000));
      
      setFormData(prev => ({
        ...prev,
        date: now.toISOString().split('T')[0],
        startTime: now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: endTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
    }
  }, [quickDuration]);

  // Generate smart suggestions when modal opens or date changes
  useEffect(() => {
    const suggestions = generateSmartSuggestions();
    setSmartSuggestions(suggestions);
  }, [formData.date, driveway.pricePerHour]);

  // Scroll to top when modal opens to ensure it's visible
  useEffect(() => {
    if (isOpen) {
      // Scroll to top of page to ensure modal is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSmartSuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime
    }));
    setQuickDuration(null); // Clear quick duration selection
  };

  const calculateTotal = () => {
    if (!formData.startTime || !formData.endTime) {
      console.log('calculateTotal: Missing startTime or endTime', { startTime: formData.startTime, endTime: formData.endTime });
      return 0;
    }
    
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const pricePerHour = Number(driveway.pricePerHour || 0);
    const total = diffHours * pricePerHour;
    
    console.log('calculateTotal:', { 
      startTime: formData.startTime, 
      endTime: formData.endTime, 
      diffHours, 
      pricePerHour, 
      total 
    });
    
    return total;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.date || !formData.startTime || !formData.endTime) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.startTime >= formData.endTime) {
        throw new Error('End time must be after start time');
      }

      const totalAmount = calculateTotal();
      if (totalAmount <= 0) {
        throw new Error('Invalid booking duration');
      }

      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: totalAmount, // Send as dollars, backend will convert to cents
          currency: 'usd',
          description: `Parking at ${driveway.address} on ${formData.date} from ${formData.startTime} to ${formData.endTime}`
        })
      });

      if (response.ok) {
        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
        setCurrentStep('payment');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to create payment intent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = calculateTotal();

  // Payment component
  const PaymentStep = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isElementsReady, setIsElementsReady] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);

    // Stripe and Elements status

    const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Check if Stripe and Elements are properly loaded
      if (!stripe || !elements) {
        setError('Payment system not ready. Please try again.');
        return;
      }

      // Get the payment element to ensure it's mounted
      const paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        setError('Payment form not ready. Please refresh and try again.');
        return;
      }

      // Add a small delay to ensure Elements are fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      setIsProcessing(true);
      setError(null);

      try {
        console.log('Starting payment confirmation...');
        
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin,
          },
          redirect: 'if_required',
        });

        console.log('Payment result:', { error, paymentIntent });

        if (error) {
          console.error('Stripe payment error:', error);
          setError(error.message || 'Payment failed');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          console.log('Payment succeeded, creating booking...');
          
          // Create booking with payment confirmation
          const bookingData = {
            driveway: driveway.id,
            startTime: `${formData.date}T${formData.startTime}`,
            endTime: `${formData.date}T${formData.endTime}`,
            totalAmount: totalAmount,
            specialRequests: formData.specialRequests,
            stripePaymentId: paymentIntent.id
          };

          console.log('🎯 Creating booking with data:', bookingData);
          console.log('🎯 Driveway details:', {
            id: driveway.id,
            address: driveway.address,
            pricePerHour: driveway.pricePerHour,
            isAvailable: driveway.isAvailable
          });

          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(bookingData)
          });

          if (response.ok) {
            const booking = await response.json();
            console.log('✅ Booking created successfully:', booking);
            setCurrentStep('success');
            onBookingSuccess?.(booking.id);
          } else {
            const errorData = await response.json();
            console.error('❌ Booking creation failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            throw new Error(errorData.message || errorData.error || 'Failed to create booking');
          }
        } else {
          setError('Payment was not completed. Please try again.');
        }
      } catch (error) {
        console.error('Payment processing failed:', error);
        setError(error instanceof Error ? error.message : 'Payment processing failed');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="payment-step">
        <div className="payment-summary">
          <h3>Complete Your Booking</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Location:</span>
              <span>{driveway.address}</span>
            </div>
            <div className="summary-row">
              <span>Date:</span>
              <span>{formData.date}</span>
            </div>
            <div className="summary-row">
              <span>Time:</span>
              <span>{formData.startTime} - {formData.endTime}</span>
            </div>
            <div className="summary-row">
              <span>Duration:</span>
              <span>{((new Date(`2000-01-01T${formData.endTime}`).getTime() - new Date(`2000-01-01T${formData.startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handlePaymentSubmit} className="payment-form">
          <PaymentElement 
            key={clientSecret} // Force re-mount when client secret changes
            onReady={() => {
              console.log('PaymentElement is ready');
              setIsElementsReady(true);
              setStripeError(null);
            }}
            onLoadError={(error) => {
              console.error('PaymentElement load error:', error);
              setStripeError(`Payment form failed to load: ${error.error?.message || 'Unknown error'}`);
              setError('Failed to load payment form. Please try again.');
            }}
          />
          
          {error && (
            <div className="error-message">
              {error}
              {error.includes('Payment form not ready') && (
                <button 
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsElementsReady(false);
                    // Force re-render of PaymentElement
                    setTimeout(() => setIsElementsReady(true), 1000);
                  }}
                  className="retry-button"
                  style={{ 
                    marginTop: '8px', 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
          
          {stripeError && (
            <div className="error-message" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
              {stripeError}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setCurrentStep('form')} 
              className="btn-secondary"
            >
              Back
            </button>
                   <button 
                     type="submit" 
                     className={`btn-primary ${isProcessing ? 'btn-loading' : ''}`}
                     disabled={!stripe || !isElementsReady || isProcessing}
                     onClick={(e) => {
                       if (!isElementsReady) {
                         e.preventDefault();
                         setError('Payment form is still loading. Please wait a moment and try again.');
                       }
                     }}
                   >
                     {isProcessing ? 'Processing...' : isElementsReady ? `Pay $${totalAmount.toFixed(2)}` : 'Loading Payment Form...'}
                   </button>
          </div>
        </form>
      </div>
    );
  };

  // Success step
  const SuccessStep = () => (
    <div className="success-step">
      <div className="success-icon">✓</div>
      <h3>Booking Confirmed!</h3>
      <p>Your parking spot has been successfully booked.</p>
      <div className="booking-details">
        <div className="detail-row">
          <span>Location:</span>
          <span>{driveway.address}</span>
        </div>
        <div className="detail-row">
          <span>Date:</span>
          <span>{formData.date}</span>
        </div>
        <div className="detail-row">
          <span>Time:</span>
          <span>{formData.startTime} - {formData.endTime}</span>
        </div>
        <div className="detail-row">
          <span>Total Paid:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <button onClick={onClose} className="btn-primary">
        Close
      </button>
    </div>
  );

  // Calculate modal position based on click location
  const getModalStyle = () => {
    if (!clickPosition) {
      return {}; // Default positioning
    }
    
    const { x, y } = clickPosition;
    const modalWidth = window.innerWidth < 640 ? Math.min(400, window.innerWidth - 32) : 500;
    const modalHeight = window.innerWidth < 640 ? Math.min(500, window.innerHeight - 32) : 600;
    
    // Ensure modal stays within viewport bounds
    const left = Math.min(Math.max(x - modalWidth / 2, 16), window.innerWidth - modalWidth - 16);
    const top = Math.min(Math.max(y - modalHeight / 2, 16), window.innerHeight - modalHeight - 16);
    
    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      transform: 'none',
      width: `${modalWidth}px`,
      maxWidth: '95vw',
      maxHeight: '95vh'
    };
  };

  return (
    <div className="simple-booking-modal-overlay" onClick={onClose}>
      <div 
        className="simple-booking-modal" 
        onClick={(e) => e.stopPropagation()}
        style={getModalStyle()}
      >
        <div className="modal-header">
          <h2>Book Parking Spot</h2>
          <button onClick={onClose} className="close-button" aria-label="Close booking modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {currentStep === 'form' && (
            <>
              {/* Driveway Info */}
              <div className="driveway-info">
                <h3>{driveway.address}</h3>
                <p className="description">{driveway.description}</p>
                <div className="price-info">
                  <span className="price">${Number(driveway.pricePerHour || 0).toFixed(2)}/hour</span>
                  {driveway.distance && (
                    <span className="distance">{driveway.distance.toFixed(0)}m away</span>
                  )}
                </div>
              </div>

              {/* Smart Time Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="smart-suggestions-section">
                  <h4>Smart Suggestions</h4>
                  <p className="suggestions-subtitle">Based on current time and common scenarios</p>
                  <div className="suggestions-grid">
                    {smartSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="suggestion-card"
                        onClick={() => handleSmartSuggestion(suggestion)}
                      >
                        <div className="suggestion-header">
                          <span className="suggestion-label">{suggestion.label}</span>
                          <span className="suggestion-price">${suggestion.price.toFixed(0)}</span>
                        </div>
                        <div className="suggestion-time">
                          {suggestion.startTime} - {suggestion.endTime}
                        </div>
                        <div className="suggestion-description">
                          {suggestion.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Duration Selection */}
              <div className="quick-duration-section">
                <h4>Quick Book</h4>
                <div className="duration-buttons">
                  <button 
                    type="button"
                    className="duration-btn"
                    onClick={() => setQuickDuration(60)}
                  >
                    1 Hour - ${(Number(driveway.pricePerHour) * 1).toFixed(0)}
                  </button>
                  <button 
                    type="button"
                    className="duration-btn"
                    onClick={() => setQuickDuration(120)}
                  >
                    2 Hours - ${(Number(driveway.pricePerHour) * 2).toFixed(0)}
                  </button>
                  <button 
                    type="button"
                    className="duration-btn"
                    onClick={() => setQuickDuration(240)}
                  >
                    4 Hours - ${(Number(driveway.pricePerHour) * 4).toFixed(0)}
                  </button>
                  <button 
                    type="button"
                    className="duration-btn"
                    onClick={() => setQuickDuration(480)}
                  >
                    All Day - ${(Number(driveway.pricePerHour) * 8).toFixed(0)}
                  </button>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleFormSubmit} className="booking-form">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="time-group">
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time *</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="specialRequests">Special Requests (Optional)</label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Any special requirements or notes..."
                rows={3}
              />
            </div>

            {/* Booking Summary */}
            {totalAmount > 0 && (
              <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-row">
                  <span>Rate:</span>
                  <span>${Number(driveway.pricePerHour || 0).toFixed(2)}/hour</span>
                </div>
                <div className="summary-row">
                  <span>Duration:</span>
                  <span>{((new Date(`2000-01-01T${formData.endTime}`).getTime() - new Date(`2000-01-01T${formData.startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

                <div className="form-actions">
                  <button type="button" onClick={onClose} className="btn-secondary">
                    Cancel
                  </button>
                         <button 
                           type="submit" 
                           className={`btn-primary ${isSubmitting ? 'btn-loading' : ''}`}
                           disabled={isSubmitting || totalAmount <= 0}
                           onClick={() => console.log('Continue to Payment clicked', { totalAmount, isSubmitting, disabled: isSubmitting || totalAmount <= 0 })}
                         >
                           {isSubmitting ? 'Processing...' : `Continue to Payment ($${totalAmount.toFixed(2)})`}
                         </button>
                </div>
              </form>
            </>
          )}

          {currentStep === 'payment' && clientSecret && clientSecret.startsWith('pi_') && stripePromise && isStripeConfigured && (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#3b82f6',
                    colorBackground: '#ffffff',
                    colorText: '#111827',
                    colorDanger: '#dc2626',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '6px',
                  }
                }
              }}
            >
              <PaymentStep />
            </Elements>
          )}

          {currentStep === 'payment' && (!clientSecret || !stripePromise || !isStripeConfigured) && (
            <div className="payment-fallback">
              <div className="fallback-header">
                <h3>Payment Processing</h3>
                <p className="fallback-subtitle">Payment system is not configured for this environment.</p>
              </div>
              
              <div className="fallback-info">
                <div className="info-card">
                  <h4>Booking Summary</h4>
                  <div className="booking-summary">
                    <div className="summary-row">
                      <span>Location:</span>
                      <span>{driveway.address}</span>
                    </div>
                    <div className="summary-row">
                      <span>Date:</span>
                      <span>{formData.date}</span>
                    </div>
                    <div className="summary-row">
                      <span>Time:</span>
                      <span>{formData.startTime} - {formData.endTime}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fallback-actions">
                <button onClick={() => setCurrentStep('form')} className="btn-secondary">
                  ← Back to Form
                </button>
                <button 
                  onClick={async () => {
                    setIsSubmitting(true);
                    setError(null);
                    
                    try {
                      // Create booking without payment for testing/demo purposes
                      const bookingData = {
                        driver: 'demo-user', // Demo user for testing
                        driveway: driveway.id,
                        startDate: formData.date,
                        endDate: formData.date,
                        startTime: `${formData.date}T${formData.startTime}`,
                        endTime: `${formData.date}T${formData.endTime}`,
                        totalAmount: totalAmount,
                        specialRequests: formData.specialRequests,
                        paymentStatus: 'pending' // Mark as pending since no payment was processed
                      };
                      
                      console.log('Creating demo booking:', bookingData);
                      
                      const response = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(bookingData),
                      });
                      
                      if (response.ok) {
                        const booking = await response.json();
                        console.log('Demo booking created successfully:', booking);
                        setCurrentStep('success');
                        onBookingSuccess?.();
                      } else {
                        const errorData = await response.json();
                        console.error('Booking creation failed:', errorData);
                        setError(errorData.message || 'Failed to create booking');
                      }
                    } catch (error) {
                      console.error('Booking creation error:', error);
                      setError('Failed to create booking. Please try again.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Booking...' : 'Complete Demo Booking'}
                </button>
              </div>
              
              <div className="fallback-note">
                <p>This is a demo booking. In production, payment would be processed securely.</p>
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <SuccessStep />
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleBookingModal;
