import React, { useState, useEffect } from 'react';
import { paymentService, PaymentStatusResponse } from '../services/paymentService';

interface PaymentStatusProps {
  bookingId: string;
  className?: string;
  showDetails?: boolean;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ 
  bookingId, 
  className = '',
  showDetails = false 
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (bookingId) {
      fetchPaymentStatus();
    }
  }, [bookingId]);

  const fetchPaymentStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await paymentService.getPaymentStatus(bookingId);
      
      if (response.success) {
        setPaymentStatus(response);
      } else {
        setError(response.error || 'Failed to load payment status');
      }
    } catch (err: any) {
      setError('Failed to load payment status');
      console.error('Payment status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`payment-status loading ${className}`}>
        <div className="status-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`payment-status error ${className}`}>
        <div className="error-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <span className="error-text">{error}</span>
      </div>
    );
  }

  if (!paymentStatus) {
    return null;
  }

  const { booking } = paymentStatus;
  const statusColor = paymentService.getPaymentStatusColor(booking.paymentStatus);
  const statusText = paymentService.getPaymentStatusText(booking.paymentStatus);

  return (
    <div className={`payment-status ${className}`}>
      <div className="status-header">
        <div 
          className="status-indicator"
          style={{ backgroundColor: statusColor }}
        >
          <div className="status-dot"></div>
        </div>
        <div className="status-info">
          <div className="status-text">{statusText}</div>
          {showDetails && (
            <div className="status-details">
              <div className="amount">
                {paymentService.formatAmount(booking.totalAmount)}
              </div>
              {booking.stripePaymentId && (
                <div className="payment-id">
                  ID: {booking.stripePaymentId.slice(-8)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="status-actions">
          <button 
            onClick={fetchPaymentStatus}
            className="refresh-button"
            title="Refresh status"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;
