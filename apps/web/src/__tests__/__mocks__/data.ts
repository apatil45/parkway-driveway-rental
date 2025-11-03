// Test data fixtures

export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  roles: ['DRIVER'],
  phone: '1234567890',
  address: '123 Test St',
  avatar: 'https://example.com/avatar.jpg',
  isActive: true,
};

export const mockOwner = {
  id: 'owner-123',
  name: 'Owner User',
  email: 'owner@example.com',
  roles: ['OWNER'],
  phone: '0987654321',
  address: '456 Owner St',
  avatar: null,
  isActive: true,
};

export const mockDriveway = {
  id: 'driveway-123',
  title: 'Downtown Parking Spot',
  description: 'Convenient parking in downtown',
  address: '123 Main St, City, State 12345',
  latitude: 40.7128,
  longitude: -74.0060,
  pricePerHour: 5.00,
  capacity: 2,
  carSize: ['small', 'medium'],
  amenities: ['covered', 'security'],
  images: ['https://example.com/image1.jpg'],
  ownerId: 'owner-123',
  owner: mockOwner,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockBooking = {
  id: 'booking-123',
  drivewayId: 'driveway-123',
  userId: 'user-123',
  startTime: new Date('2024-12-25T10:00:00Z'),
  endTime: new Date('2024-12-25T12:00:00Z'),
  status: 'PENDING',
  totalPrice: 10.00,
  specialRequests: 'Near entrance please',
  vehicleInfo: {
    make: 'Toyota',
    model: 'Camry',
    color: 'Blue',
    licensePlate: 'ABC123',
  },
  driveway: mockDriveway,
  user: mockUser,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockReview = {
  id: 'review-123',
  drivewayId: 'driveway-123',
  userId: 'user-123',
  rating: 5,
  comment: 'Great parking spot!',
  user: mockUser,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockNotification = {
  id: 'notification-123',
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  message: 'Your booking has been confirmed',
  isRead: false,
  createdAt: new Date('2024-01-01'),
};

export const mockStats = {
  totalBookings: 10,
  activeBookings: 3,
  totalRevenue: 150.00,
  averageRating: 4.5,
  totalDriveways: 5,
  pendingBookings: 2,
};

