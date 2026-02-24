import {
  loginSchema,
  registerSchema,
  createDrivewaySchema,
  createBookingSchema,
  createReviewSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('rejects short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow('at least 8 characters');
    });

    it('rejects missing email', () => {
      const invalidData = {
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('rejects missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        roles: ['DRIVER'],
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('rejects short name', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'Password123',
        roles: ['DRIVER'],
      };
      expect(() => registerSchema.parse(invalidData)).toThrow('at least 2 characters');
    });

    it('rejects password without uppercase', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roles: ['DRIVER'],
      };
      expect(() => registerSchema.parse(invalidData)).toThrow('uppercase letter');
    });

    it('rejects password without lowercase', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PASSWORD123',
        roles: ['DRIVER'],
      };
      expect(() => registerSchema.parse(invalidData)).toThrow('lowercase letter');
    });

    it('rejects password without number', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password',
        roles: ['DRIVER'],
      };
      expect(() => registerSchema.parse(invalidData)).toThrow('number');
    });

    it('rejects empty roles array', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        roles: [],
      };
      expect(() => registerSchema.parse(invalidData)).toThrow('At least one role is required');
    });

    it('accepts optional phone', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        roles: ['DRIVER'],
        phone: '1234567890',
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('accepts optional address', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        roles: ['DRIVER'],
        address: '123 Main St',
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });
  });

  describe('createDrivewaySchema', () => {
    const baseValidData = {
      title: 'Downtown Parking',
      description: 'Great spot',
      address: '123 Main St, City, State 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      pricePerHour: 5.00,
      capacity: 2,
      carSize: ['small', 'medium'],
      amenities: ['covered'],
      images: ['https://example.com/image.jpg'],
      rightToListConfirmed: true as const,
    };

    it('validates correct driveway data', () => {
      expect(() => createDrivewaySchema.parse(baseValidData)).not.toThrow();
    });

    it('rejects when rightToListConfirmed is missing or false', () => {
      expect(() => createDrivewaySchema.parse({ ...baseValidData, rightToListConfirmed: undefined })).toThrow('right to list');
      expect(() => createDrivewaySchema.parse({ ...baseValidData, rightToListConfirmed: false })).toThrow('right to list');
    });

    it('rejects short title', () => {
      const invalidData = {
        title: 'AB',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('at least 3 characters');
    });

    it('rejects short address', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('at least 5 characters');
    });

    it('rejects invalid latitude (too high)', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 91,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('Invalid latitude');
    });

    it('rejects invalid latitude (too low)', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: -91,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow();
    });

    it('rejects invalid longitude (too high)', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: 181,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('Invalid longitude');
    });

    it('rejects negative price', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: -5.00,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('greater than 0');
    });

    it('rejects zero price', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 0,
        capacity: 1,
        carSize: ['small'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('greater than 0');
    });

    it('rejects capacity less than 1', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 0,
        rightToListConfirmed: true,
        carSize: ['small'],
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('at least 1');
    });

    it('rejects empty carSize array', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: [],
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow('At least one car size is required');
    });

    it('accepts valid image URLs', () => {
      const validData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid image URLs', () => {
      const invalidData = {
        title: 'Downtown Parking',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 1,
        carSize: ['small'],
        images: ['not-a-url'],
        rightToListConfirmed: true,
      };
      expect(() => createDrivewaySchema.parse(invalidData)).toThrow();
    });
  });

  describe('createBookingSchema', () => {
    it('validates correct booking data', () => {
      const validData = {
        drivewayId: 'clx1234567890abcdefghij',
        startTime: '2024-12-25T10:00:00Z',
        endTime: '2024-12-25T12:00:00Z',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Blue',
          licensePlate: 'ABC123',
        },
      };
      expect(() => createBookingSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid driveway ID', () => {
      const invalidData = {
        drivewayId: 'invalid',
        startTime: '2024-12-25T10:00:00Z',
        endTime: '2024-12-25T12:00:00Z',
      };
      expect(() => createBookingSchema.parse(invalidData)).toThrow('Invalid driveway ID');
    });

    it('rejects invalid start time format', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        startTime: 'not-a-datetime',
        endTime: '2024-12-25T12:00:00Z',
      };
      expect(() => createBookingSchema.parse(invalidData)).toThrow('Invalid start time format');
    });

    it('rejects invalid end time format', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        startTime: '2024-12-25T10:00:00Z',
        endTime: 'not-a-datetime',
      };
      expect(() => createBookingSchema.parse(invalidData)).toThrow('Invalid end time format');
    });

    it('rejects missing vehicle info fields', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        startTime: '2024-12-25T10:00:00Z',
        endTime: '2024-12-25T12:00:00Z',
        vehicleInfo: {
          make: 'Toyota',
          // missing model, color, licensePlate
        },
      };
      expect(() => createBookingSchema.parse(invalidData)).toThrow();
    });

    it('accepts optional special requests', () => {
      const validData = {
        drivewayId: 'clx1234567890abcdefghij',
        startTime: '2024-12-25T10:00:00Z',
        endTime: '2024-12-25T12:00:00Z',
        specialRequests: 'Near entrance please',
      };
      expect(() => createBookingSchema.parse(validData)).not.toThrow();
    });
  });

  describe('createReviewSchema', () => {
    it('validates correct review data', () => {
      const validData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 5,
        comment: 'Great parking spot!',
      };
      expect(() => createReviewSchema.parse(validData)).not.toThrow();
    });

    it('rejects rating below 1', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 0,
      };
      expect(() => createReviewSchema.parse(invalidData)).toThrow('at least 1');
    });

    it('rejects rating above 5', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 6,
      };
      expect(() => createReviewSchema.parse(invalidData)).toThrow('at most 5');
    });

    it('rejects non-integer rating', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 4.5,
      };
      expect(() => createReviewSchema.parse(invalidData)).toThrow();
    });

    it('rejects comment over 500 characters', () => {
      const invalidData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 5,
        comment: 'a'.repeat(501),
      };
      expect(() => createReviewSchema.parse(invalidData)).toThrow('less than 500 characters');
    });

    it('accepts comment exactly 500 characters', () => {
      const validData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 5,
        comment: 'a'.repeat(500),
      };
      expect(() => createReviewSchema.parse(validData)).not.toThrow();
    });

    it('accepts empty comment', () => {
      const validData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 5,
        comment: '',
      };
      expect(() => createReviewSchema.parse(validData)).not.toThrow();
    });

    it('accepts missing comment', () => {
      const validData = {
        drivewayId: 'clx1234567890abcdefghij',
        rating: 5,
      };
      expect(() => createReviewSchema.parse(validData)).not.toThrow();
    });
  });
});

