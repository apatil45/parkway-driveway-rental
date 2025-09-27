/**
 * Robust Booking Service with retry logic, validation, and comprehensive error handling
 */

import axios from 'axios';
import { retryWithBackoff } from '../utils/retryUtils';
import { notificationService } from './notificationService';

export interface BookingRequest {
  driveway: string;
  driver: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  driverLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface BookingResponse {
  id: string;
  status: string;
  message?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  bookingId: string;
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class RobustBookingService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * Validate booking request before submission
   */
  validateBookingRequest(request: BookingRequest): BookingValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!request.driveway) {
      errors.push('Driveway ID is required');
    }
    if (!request.driver) {
      errors.push('Driver ID is required');
    }
    if (!request.startTime) {
      errors.push('Start time is required');
    }
    if (!request.endTime) {
      errors.push('End time is required');
    }
    if (!request.totalPrice || request.totalPrice <= 0) {
      errors.push('Valid total price is required');
    }

    // Time validation
    if (request.startTime && request.endTime) {
      const startTime = new Date(`2000-01-01T${request.startTime}:00`);
      const endTime = new Date(`2000-01-01T${request.endTime}:00`);
      
      if (startTime >= endTime) {
        errors.push('End time must be after start time');
      }
      
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (durationHours > 24) {
        warnings.push('Booking duration exceeds 24 hours');
      }
      if (durationHours < 0.5) {
        warnings.push('Booking duration is less than 30 minutes');
      }
    }

    // Price validation
    if (request.totalPrice > 1000) {
      warnings.push('Booking price exceeds $1000');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create booking with retry logic and comprehensive error handling
   */
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    // Validate request first
    const validation = this.validateBookingRequest(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        notificationService.showNotification({
          type: 'warning',
          title: 'Booking Warning',
          message: warning,
          context: 'booking',
          duration: 5000
        });
      });
    }

    const bookingData = {
      driveway: request.driveway,
      driver: request.driver,
      startTime: request.startTime,
      endTime: request.endTime,
      totalPrice: request.totalPrice,
      driverLocation: request.driverLocation,
      status: 'pending'
    };

    try {
      const response = await retryWithBackoff(
        () => axios.post<BookingResponse>('/api/bookings', bookingData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000 // 10 second timeout
        }),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            // Retry on network errors, timeouts, and 5xx server errors
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Booking Created',
        message: 'Your booking has been created successfully!',
        context: 'booking'
      });

      return response.data;
    } catch (error: any) {
      console.error('Booking creation failed:', error);
      
      let errorMessage = 'Failed to create booking';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Booking Failed',
        message: errorMessage,
        context: 'booking',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Create payment intent with retry logic
   */
  async createPaymentIntent(bookingId: string): Promise<PaymentIntentResponse> {
    try {
      const response = await retryWithBackoff(
        () => axios.post<PaymentIntentResponse>('/api/payments/create-payment-intent', 
          { bookingId }, 
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000 // 15 second timeout for payment
          }
        ),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      
      let errorMessage = 'Failed to create payment intent';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Payment Setup Failed',
        message: errorMessage,
        context: 'payment',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Confirm booking after successful payment
   */
  async confirmBooking(bookingId: string, paymentIntentId: string): Promise<void> {
    try {
      await retryWithBackoff(
        () => axios.put(`/api/bookings/${bookingId}`, 
          { paymentIntentId, status: 'confirmed' }, 
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000
          }
        ),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed and payment processed successfully!',
        context: 'booking'
      });
    } catch (error: any) {
      console.error('Booking confirmation failed:', error);
      
      let errorMessage = 'Failed to confirm booking';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Confirmation Failed',
        message: errorMessage,
        context: 'booking',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Cancel booking with retry logic
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      await retryWithBackoff(
        () => axios.put(`/api/bookings/${bookingId}`, 
          { status: 'cancelled', cancellationReason: reason }, 
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000
          }
        ),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled successfully.',
        context: 'booking'
      });
    } catch (error: any) {
      console.error('Booking cancellation failed:', error);
      
      let errorMessage = 'Failed to cancel booking';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: errorMessage,
        context: 'booking',
        priority: 'high'
      });

      throw error;
    }
  }
}

export const robustBookingService = new RobustBookingService();
