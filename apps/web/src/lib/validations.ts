import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Please enter your full name (at least 2 characters)'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/\d/, 'Password must include at least one number'),
  roles: z.array(z.enum(['DRIVER', 'OWNER'])).min(1, 'Please select at least one role'),
  phone: z.string().optional(),
  address: z.string().optional()
});

// Driveway validation schemas
export const createDrivewaySchema = z.object({
  title: z.string().min(3, 'Please enter a title (at least 3 characters)'),
  description: z.string().optional(),
  address: z.string().min(5, 'Please enter a complete address (at least 5 characters)'),
  latitude: z.number().min(-90).max(90, 'Invalid location. Please select a valid address.'),
  longitude: z.number().min(-180).max(180, 'Invalid location. Please select a valid address.'),
  pricePerHour: z.number().min(0.01, 'Price must be greater than $0.01 per hour'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1 vehicle').default(1),
  carSize: z.array(z.enum(['small', 'medium', 'large', 'extra-large'])).min(1, 'Please select at least one vehicle size'),
  amenities: z.array(z.enum(['covered', 'security', 'ev_charging', 'easy_access'])).default([]),
  images: z.array(z.string().url()).default([]),
  /** Phase 1: self-declaration that user has the right to list this space */
  rightToListConfirmed: z.literal(true, { errorMap: () => ({ message: 'You must confirm you have the right to list this space.' }) }),
});

export const updateDrivewaySchema = createDrivewaySchema.partial().extend({
  id: z.string().cuid()
});

// Booking validation schemas
export const createBookingSchema = z.object({
  drivewayId: z.string().cuid('Invalid driveway ID'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  specialRequests: z.string().optional(),
  vehicleInfo: z.object({
    make: z.string().min(1, 'Vehicle make is required'),
    model: z.string().min(1, 'Vehicle model is required'),
    color: z.string().min(1, 'Vehicle color is required'),
    licensePlate: z.string().min(1, 'License plate is required')
  }).optional()
});

export const updateBookingSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED']).optional(),
  specialRequests: z.string().optional()
});

// Review validation schemas
export const createReviewSchema = z.object({
  drivewayId: z.string().cuid('Please select a valid parking space'),
  rating: z.number().int().min(1, 'Please select a rating').max(5, 'Rating cannot exceed 5 stars'),
  comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional().or(z.literal(''))
});

// Favorite validation schemas
export const favoriteDrivewaySchema = z.object({
  drivewayId: z.string().cuid('Invalid driveway ID')
});


// Query parameter validation schemas
export const drivewaySearchSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).default('10'),
  location: z.string().optional(),
  priceMin: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  priceMax: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  carSize: z.string().optional(),
  amenities: z.string().optional(),
  sort: z.string().optional().transform((v) => (v && ['price_asc', 'price_desc', 'rating_desc', 'distance_asc'].includes(v) ? v : undefined)),
});

export const bookingQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).default('10'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED']).optional()
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type FavoriteDrivewayInput = z.infer<typeof favoriteDrivewaySchema>;
export type CreateDrivewayInput = z.infer<typeof createDrivewaySchema>;
export type UpdateDrivewayInput = z.infer<typeof updateDrivewaySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type DrivewaySearchParams = z.infer<typeof drivewaySearchSchema>;
export type BookingQueryParams = z.infer<typeof bookingQuerySchema>;

// Contact form validation
export const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name (at least 2 characters)'),
  email: z.string().email('Please enter a valid email address'),
  type: z.enum(['general', 'support', 'sales', 'technical']),
  subject: z.string().min(3, 'Please enter a subject (at least 3 characters)'),
  message: z.string().min(10, 'Please enter your message (at least 10 characters)'),
});
export type ContactInput = z.infer<typeof contactSchema>;
