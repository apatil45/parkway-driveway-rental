import axios from 'axios';

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  amount: number;
  currency: string;
  error?: string;
  message?: string;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  message: string;
  booking: {
    id: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    startDate: string;
    endDate: string;
  };
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  booking: {
    id: string;
    status: string;
    paymentStatus: string;
    stripeStatus: string | null;
    totalAmount: number;
    stripePaymentId: string | null;
  };
  error?: string;
}

class PaymentService {
  private baseURL = '/api/payments';

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(bookingId: string): Promise<PaymentIntentResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/create-payment-intent`, {
        bookingId
      });
      return response.data;
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      return {
        success: false,
        clientSecret: '',
        amount: 0,
        currency: 'usd',
        error: error.response?.data?.error || 'Failed to create payment intent',
        message: error.response?.data?.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Confirm a payment after successful Stripe processing
   */
  async confirmPayment(bookingId: string, paymentIntentId: string): Promise<PaymentConfirmationResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/confirm-payment`, {
        bookingId,
        paymentIntentId
      });
      return response.data;
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      return {
        success: false,
        message: '',
        booking: {
          id: '',
          status: '',
          paymentStatus: '',
          totalAmount: 0,
          startDate: '',
          endDate: ''
        },
        error: error.response?.data?.error || 'Failed to confirm payment'
      };
    }
  }

  /**
   * Get payment status for a booking
   */
  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/status/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get payment status error:', error);
      return {
        success: false,
        booking: {
          id: '',
          status: '',
          paymentStatus: '',
          stripeStatus: null,
          totalAmount: 0,
          stripePaymentId: null
        },
        error: error.response?.data?.error || 'Failed to get payment status'
      };
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get payment status display text
   */
  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Payment Pending';
      case 'paid':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'refunded':
        return 'Payment Refunded';
      default:
        return 'Unknown Status';
    }
  }

  /**
   * Get payment status color for UI
   */
  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // amber
      case 'paid':
        return '#10b981'; // emerald
      case 'failed':
        return '#ef4444'; // red
      case 'refunded':
        return '#6b7280'; // gray
      default:
        return '#6b7280'; // gray
    }
  }
}

export const paymentService = new PaymentService();
