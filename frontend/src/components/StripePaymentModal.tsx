import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { paymentService, PaymentIntentResponse } from '../services/paymentService';
import { notificationService } from '../services/notificationService';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_your_stripe_public_key_here');

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string; // Optional since we might not have a booking yet
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

interface PaymentFormProps {
  bookingId?: string;
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  bookingId, 
  amount, 
  onPaymentSuccess, 
  onClose 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      console.log('Creating payment intent for amount:', amount);
      
      // Create payment intent directly with amount (no booking ID needed yet)
      const response = await fetch('/api/payments/create-payment-intent-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          description: `Parkway.com driveway booking - $${amount}`
        })
      });

      console.log('Payment intent response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment intent error:', errorData);
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      console.log('Payment intent data:', data);
      
      if (data.success && data.clientSecret) {
        console.log('Setting client secret:', data.clientSecret);
        setClientSecret(data.clientSecret);
      } else {
        const errorMsg = data.error || 'Failed to create payment intent';
        console.error('Payment intent failed:', errorMsg);
        setError(errorMsg);
        notificationService.showError(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize payment';
      console.error('Payment intent creation error:', errorMessage);
      setError(errorMessage);
      notificationService.showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-form-container">
      <div className="payment-amount">
        <h3>Payment Amount</h3>
        <div className="amount-display">
          {paymentService.formatAmount(amount)}
        </div>
      </div>

      {clientSecret ? (
        <div>
          <p>Client Secret: {clientSecret.substring(0, 20)}...</p>
          <Elements stripe={stripePromise} options={{
            clientSecret: clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#3b82f6',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#ef4444',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
              },
            },
          }}>
            <StripePaymentForm
              amount={amount}
              onPaymentSuccess={onPaymentSuccess}
              onClose={onClose}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              error={error}
              setError={setError}
            />
          </Elements>
        </div>
      ) : (
        <div className="loading-spinner">Loading payment options...</div>
      )}
    </div>
  );
};

// Separate component that uses Stripe hooks
const StripePaymentForm: React.FC<{
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  error: string;
  setError: (error: string) => void;
}> = ({ amount, onPaymentSuccess, onClose, isProcessing, setIsProcessing, error, setError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !isElementReady) {
      setError('Payment form is not ready. Please wait...');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get the payment element to ensure it's mounted
      const paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        throw new Error('Payment element not found. Please refresh and try again.');
      }

      // Confirm payment with Stripe using PaymentElement
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        notificationService.showError(stripeError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful - pass the payment intent ID to create booking
        notificationService.showSuccess('Payment successful! Creating your booking...');
        onPaymentSuccess(paymentIntent.id);
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment processing failed';
      setError(errorMessage);
      notificationService.showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-method">
        <h3>Payment Method</h3>
        <div className="payment-element-container">
          <PaymentElement 
            onReady={() => {
              console.log('PaymentElement is ready');
              setIsElementReady(true);
            }}
            onChange={(event) => {
              console.log('PaymentElement onChange:', event);
              if (event.error) {
                setError(event.error.message || 'Payment form error');
              } else {
                setError('');
              }
            }}
            onLoadError={(error) => {
              console.error('PaymentElement load error:', error);
              setError('Failed to load payment form');
            }}
          />
        </div>
        {error && <div className="payment-error">{error}</div>}
      </div>

      <div className="payment-actions">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || !isElementReady || isProcessing}
        >
          {isProcessing ? 'Processing...' : 
           !isElementReady ? 'Loading...' : 
           `Pay ${paymentService.formatAmount(amount)}`}
        </button>
      </div>

      {isProcessing && (
        <div className="payment-processing">
          <div className="spinner"></div>
          <p>Processing your payment...</p>
        </div>
      )}
    </form>
  );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  amount,
  onPaymentSuccess
}) => {
  if (!isOpen) return null;

  const elementsOptions: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="stripe-payment-modal-overlay">
      <div className="stripe-payment-modal">
        <div className="modal-header">
          <h2>Complete Payment</h2>
          <button onClick={onClose} className="close-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          <PaymentForm
            bookingId={bookingId}
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
            onClose={onClose}
          />
        </div>

        <div className="modal-footer">
          <div className="security-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Your payment is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;
