import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './SimpleBookingModal.css';

// Stripe configuration
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Use a valid test key if environment variable is not set or is placeholder
const validStripeKey = stripePublicKey && !stripePublicKey.includes('your_stripe_public_key_here') 
  ? stripePublicKey 
  : 'pk_test_51SG9Tc2MWNtZFiP8...'; // This should be replaced with your actual test key

// For development/testing, we'll disable Stripe if no valid key is available
const isStripeConfigured = validStripeKey && !validStripeKey.includes('...');

const stripePromise = loadStripe(validStripeKey);

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
}

const SimpleBookingModal: React.FC<SimpleBookingModalProps> = ({
  isOpen,
  onClose,
  driveway,
  onBookingSuccess
}) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    specialRequests: ''
  });
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours * Number(driveway.pricePerHour || 0);
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
      if (!stripe || !elements) return;

      setIsProcessing(true);
      setError(null);

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin,
          },
          redirect: 'if_required',
        });

        if (error) {
          setError(error.message || 'Payment failed');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Create booking with payment confirmation
          const bookingData = {
            driveway: driveway.id,
            startTime: `${formData.date}T${formData.startTime}`,
            endTime: `${formData.date}T${formData.endTime}`,
            totalAmount: totalAmount,
            specialRequests: formData.specialRequests,
            stripePaymentId: paymentIntent.id
          };

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
            console.log('Booking created successfully:', booking);
            setCurrentStep('success');
            onBookingSuccess?.(booking.id);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create booking');
          }
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
                   >
                     {isProcessing ? 'Processing...' : isElementsReady ? `Pay $${totalAmount.toFixed(2)}` : 'Loading...'}
                   </button>
          </div>
        </form>
      </div>
    );
  };

  // Success step
  const SuccessStep = () => (
    <div className="success-step">
      <div className="success-icon">✅</div>
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

  return (
    <div className="simple-booking-modal-overlay" onClick={onClose}>
      <div className="simple-booking-modal" onClick={(e) => e.stopPropagation()}>
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
                         >
                           {isSubmitting ? 'Processing...' : 'Continue to Payment'}
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
            <div className="error-message">
              <p>Payment system is not properly configured. Stripe keys are missing or invalid.</p>
              <p>For testing purposes, you can complete the booking without payment.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={() => setCurrentStep('form')} className="btn-secondary">
                  Back to Form
                </button>
                <button 
                  onClick={() => {
                    // Skip payment for testing
                    setCurrentStep('success');
                    onBookingSuccess?.('test-booking-id');
                  }} 
                  className="btn-primary"
                >
                  Complete Booking (Test Mode)
                </button>
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
