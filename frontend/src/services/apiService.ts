import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode?: number;
}

// Unified API Service Class
class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth data on unauthorized
          localStorage.removeItem('token');
          localStorage.removeItem('rememberMe');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response;
    
    if (response) {
      return {
        success: false,
        message: response.data?.message || response.data?.msg || 'Request failed',
        error: response.data?.error || error.message,
        statusCode: response.status,
      };
    }

    return {
      success: false,
      message: 'Network error',
      error: error.message,
    };
  }

  // Generic request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    config?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.request({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return {
        success: true,
        data: response.data,
        message: response.data?.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // Public API methods
  async get<T>(endpoint: string, config?: any): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: any): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, config);
  }

  async patch<T>(endpoint: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.post('/api/auth/login', { email, password });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    roles?: string[];
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.post('/api/auth/register', userData);
  }

  async getUser(): Promise<ApiResponse<any>> {
    return this.get('/api/auth/user');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.post('/api/auth/refresh');
  }

  // Driveway methods
  async getDriveways(params?: any): Promise<ApiResponse<any[]>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.get(`/api/driveways${queryString}`);
  }

  async searchDriveways(searchParams: any): Promise<ApiResponse<any[]>> {
    return this.get('/api/driveways/search', { params: searchParams });
  }

  async getDriveway(id: string): Promise<ApiResponse<any>> {
    return this.get(`/api/driveways/${id}`);
  }

  async createDriveway(drivewayData: any): Promise<ApiResponse<any>> {
    return this.post('/api/driveways', drivewayData);
  }

  async updateDriveway(id: string, drivewayData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/driveways/${id}`, drivewayData);
  }

  async deleteDriveway(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api/driveways/${id}`);
  }

  // Booking methods
  async getBookings(): Promise<ApiResponse<any[]>> {
    return this.get('/api/bookings');
  }

  async createBooking(bookingData: any): Promise<ApiResponse<any>> {
    return this.post('/api/bookings', bookingData);
  }

  async updateBooking(id: string, bookingData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/bookings/${id}`, bookingData);
  }

  async cancelBooking(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api/bookings/${id}`);
  }

  // Payment methods
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<ApiResponse<any>> {
    return this.post('/api/payments/create-intent', { amount, currency });
  }

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<any>> {
    return this.post('/api/payments/confirm', { paymentIntentId });
  }

  // Notification methods
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.get('/api/notifications');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<any>> {
    return this.patch(`/api/notifications/${id}/read`);
  }

  // Geocoding methods
  async geocodeAddress(address: string): Promise<ApiResponse<any>> {
    return this.get('/api/geocoding', { params: { address } });
  }

  // File upload methods
  async uploadFile(file: File, type: string = 'image'): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type { ApiResponse, ApiError };
