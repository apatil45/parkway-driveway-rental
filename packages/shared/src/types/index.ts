// Import Prisma types
import type {
  User,
  Driveway,
  Booking,
  Review,
  Notification,
  UserRole,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Driveway,
  Booking,
  Review,
  Notification,
  UserRole,
  BookingStatus,
  PaymentStatus,
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Driveway types
export interface CreateDrivewayRequest {
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  capacity?: number;
  carSize: string[];
  amenities: string[];
  images: string[];
}

export interface UpdateDrivewayRequest extends Partial<CreateDrivewayRequest> {
  id: string;
}

export interface DrivewaySearchParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  priceMin?: number;
  priceMax?: number;
  carSize?: string[];
  amenities?: string[];
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}

// Booking types
export interface CreateBookingRequest {
  drivewayId: string;
  startTime: string;
  endTime: string;
  specialRequests?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
}

export interface UpdateBookingRequest {
  id: string;
  status?: BookingStatus;
  specialRequests?: string;
}

// Payment types
export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  bookingId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Map types
export interface MapLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Notification types
export interface CreateNotificationRequest {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  userId: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormErrors {
  [key: string]: ValidationError[];
}
