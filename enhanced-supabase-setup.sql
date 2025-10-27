-- Complete Updated Supabase Database Schema for Parkway.com
-- Run this entire script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS driveways CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with enhanced fields
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255), -- For custom authentication
  roles TEXT[] DEFAULT '{"driver"}',
  car_size VARCHAR(50),
  driveway_size VARCHAR(50),
  phone_number VARCHAR(20),
  address TEXT,
  profile_image VARCHAR(500), -- Profile picture URL
  rating DECIMAL(3,2) DEFAULT 0.0, -- User rating (0-5)
  total_reviews INTEGER DEFAULT 0, -- Number of reviews received
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Email/phone verification
  stripe_customer_id VARCHAR(255), -- Stripe customer ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driveways table with enhanced fields
CREATE TABLE driveways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  description TEXT,
  driveway_size VARCHAR(50),
  car_size_compatibility VARCHAR(50),
  price_per_hour DECIMAL(10,2) NOT NULL,
  availability TEXT DEFAULT '24/7', -- Legacy field
  amenities TEXT[], -- Array of amenities
  features TEXT[], -- Array of features
  images TEXT[], -- Array of image URLs
  coordinates POINT, -- PostGIS point for lat/lng
  latitude DECIMAL(10,8), -- Separate lat field for easier queries
  longitude DECIMAL(11,8), -- Separate lng field for easier queries
  rating DECIMAL(3,2) DEFAULT 0.0, -- Driveway rating
  total_reviews INTEGER DEFAULT 0, -- Number of reviews
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true, -- Current availability status
  max_vehicle_size VARCHAR(50), -- Maximum vehicle size allowed
  security_features TEXT[], -- Security features array
  access_instructions TEXT, -- How to access the driveway
  cancellation_policy TEXT, -- Cancellation policy
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability schedule table (for complex scheduling)
CREATE TABLE driveway_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driveway_id UUID REFERENCES driveways(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  price_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Price adjustment for this time slot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table with enhanced fields
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driveway_id UUID REFERENCES driveways(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  total_price DECIMAL(10,2) NOT NULL,
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
  stripe_payment_id VARCHAR(255), -- Stripe payment ID
  vehicle_info JSONB, -- Store vehicle details (make, model, license plate)
  special_requests TEXT, -- Special requests from user
  cancellation_reason TEXT, -- Reason for cancellation
  refund_amount DECIMAL(10,2) DEFAULT 0.0, -- Refund amount if cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driveway_id UUID REFERENCES driveways(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_type VARCHAR(20) DEFAULT 'booking', -- booking, driveway, user
  is_verified BOOLEAN DEFAULT false, -- Verified purchase review
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table with enhanced fields
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error, booking, payment
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500), -- URL for action button
  action_text VARCHAR(100), -- Text for action button
  metadata JSONB, -- Additional data
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- succeeded, failed, pending, cancelled
  payment_method VARCHAR(50), -- card, bank_transfer, etc.
  refund_amount DECIMAL(10,2) DEFAULT 0.0,
  refund_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users(roles);
CREATE INDEX idx_users_rating ON users(rating);
CREATE INDEX idx_driveways_owner_id ON driveways(owner_id);
CREATE INDEX idx_driveways_is_active ON driveways(is_active);
CREATE INDEX idx_driveways_is_available ON driveways(is_available);
CREATE INDEX idx_driveways_price ON driveways(price_per_hour);
CREATE INDEX idx_driveways_rating ON driveways(rating);
CREATE INDEX idx_driveways_coordinates ON driveways USING GIST(coordinates);
CREATE INDEX idx_driveways_lat_lng ON driveways(latitude, longitude);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_driveway_id ON bookings(driveway_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_driveway_id ON reviews(driveway_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driveways_updated_at BEFORE UPDATE ON driveways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Temporarily disable RLS to insert initial data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE driveways DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE driveway_availability DISABLE ROW LEVEL SECURITY;

-- Insert sample users with hashed passwords
-- Password for all test users: 'password123'
INSERT INTO users (id, email, name, password, roles, car_size, phone_number, rating, is_active, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@parkway.com', 'Admin User', '$2a$12$CB1KjYYqq3I9sHHCVpWDrOrFd97VkFnfTNehZZ7sVFVn9sB4HugR.', '{"admin"}', 'large', '+1-555-0101', 4.8, true, true),
  ('00000000-0000-0000-0000-000000000002', 'owner@parkway.com', 'Property Owner', '$2a$12$CB1KjYYqq3I9sHHCVpWDrOrFd97VkFnfTNehZZ7sVFVn9sB4HugR.', '{"owner"}', 'medium', '+1-555-0102', 4.5, true, true),
  ('00000000-0000-0000-0000-000000000003', 'driver@parkway.com', 'Driver User', '$2a$12$CB1KjYYqq3I9sHHCVpWDrOrFd97VkFnfTNehZZ7sVFVn9sB4HugR.', '{"driver"}', 'small', '+1-555-0103', 4.2, true, true),
  ('00000000-0000-0000-0000-000000000004', 'abcd@gmail.com', 'Test User', '$2a$12$CB1KjYYqq3I9sHHCVpWDrOrFd97VkFnfTNehZZ7sVFVn9sB4HugR.', '{"driver"}', 'small', '+1-555-0104', 4.0, true, true)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  updated_at = NOW();

-- Insert sample driveways with coordinates
INSERT INTO driveways (owner_id, address, description, driveway_size, car_size_compatibility, price_per_hour, amenities, features, latitude, longitude, rating, is_active, is_available, access_instructions) VALUES
  ('00000000-0000-0000-0000-000000000002', '123 Main St, Jersey City, NJ', 'Spacious driveway in downtown area with security cameras', 'large', 'all', 15.00, '{"Security cameras", "Well-lit", "Covered parking"}', '{"Easy access", "Wide entrance", "Level surface"}', 40.7178, -74.0431, 4.5, true, true, 'Ring doorbell #123, gate code: 4567'),
  ('00000000-0000-0000-0000-000000000002', '456 Oak Ave, Hoboken, NJ', 'Private driveway with easy access near PATH station', 'medium', 'small,medium', 12.00, '{"Covered parking", "Security gate", "Well-lit"}', '{"Near public transport", "Quiet street", "Easy parking"}', 40.7440, -74.0324, 4.3, true, true, 'Call owner 15 minutes before arrival'),
  ('00000000-0000-0000-0000-000000000002', '789 Pine St, Newark, NJ', 'Convenient downtown parking near restaurants', 'small', 'small', 8.00, '{"Near restaurants", "Public transport nearby"}', '{"Downtown location", "Walkable area"}', 40.7357, -74.1724, 4.1, true, true, 'Text owner for gate access');

-- Insert sample bookings
INSERT INTO bookings (user_id, driveway_id, start_time, end_time, status, total_price, payment_status, vehicle_info) VALUES
  ('00000000-0000-0000-0000-000000000003',
   (SELECT id FROM driveways WHERE address = '123 Main St, Jersey City, NJ' LIMIT 1),
   NOW() + INTERVAL '1 hour',
   NOW() + INTERVAL '3 hours',
   'confirmed', 30.00, 'paid', '{"make": "Toyota", "model": "Camry", "color": "Silver", "license": "ABC123"}');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, priority, action_url, action_text) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Welcome to Parkway!', 'Welcome to Parkway.com! Start finding parking spots near you.', 'info', 'medium', '/driver-dashboard', 'Get Started'),
  ('00000000-0000-0000-0000-000000000002', 'New Booking Request', 'You have a new booking request for your driveway at 123 Main St.', 'booking', 'high', '/owner-dashboard', 'View Booking'),
  ('00000000-0000-0000-0000-000000000003', 'Booking Confirmed', 'Your booking at 123 Main St has been confirmed!', 'success', 'medium', '/driver-dashboard', 'View Details');

-- Insert sample reviews
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, driveway_id, rating, comment, review_type, is_verified) VALUES
  ((SELECT id FROM bookings LIMIT 1), 
   '00000000-0000-0000-0000-000000000003', 
   '00000000-0000-0000-0000-000000000002',
   (SELECT id FROM driveways WHERE address = '123 Main St, Jersey City, NJ' LIMIT 1),
   5, 'Great driveway, easy access and secure!', 'booking', true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driveways ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driveway_availability ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Driveways policies
CREATE POLICY "Driveways are publicly readable" ON driveways
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage own driveways" ON driveways
  FOR ALL USING (auth.uid() = owner_id);

-- Bookings policies
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Payment transactions policies
CREATE POLICY "Users can read own payments" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Driveway availability policies
CREATE POLICY "Driveway availability is publicly readable" ON driveway_availability
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage driveway availability" ON driveway_availability
  FOR ALL USING (auth.uid() = (SELECT owner_id FROM driveways WHERE id = driveway_id));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Enhanced database setup completed successfully!' as status;
SELECT 'Features added: coordinates, ratings, reviews, enhanced notifications, payment tracking' as features;
SELECT 'Test users created with password: password123' as credentials;
