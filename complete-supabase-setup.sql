-- Complete Supabase Database Setup for Parkway.com
-- Run this entire script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS driveways CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with password column
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255), -- Added for custom authentication
  roles TEXT[] DEFAULT '{"driver"}',
  car_size VARCHAR(50),
  driveway_size VARCHAR(50),
  phone_number VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driveways table
CREATE TABLE driveways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  description TEXT,
  driveway_size VARCHAR(50),
  car_size_compatibility VARCHAR(50),
  price_per_hour DECIMAL(10,2) NOT NULL,
  availability TEXT DEFAULT '24/7',
  amenities TEXT,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driveway_id UUID REFERENCES driveways(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  payment_intent_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users(roles);
CREATE INDEX idx_driveways_owner_id ON driveways(owner_id);
CREATE INDEX idx_driveways_is_active ON driveways(is_active);
CREATE INDEX idx_driveways_price ON driveways(price_per_hour);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_driveway_id ON bookings(driveway_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

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

-- Temporarily disable RLS to insert initial data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE driveways DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Insert sample users with hashed passwords
-- Password for all test users: 'password123'
INSERT INTO users (id, email, name, password, roles, car_size, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@parkway.com', 'Admin User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K', '{"admin"}', 'large', true),
  ('00000000-0000-0000-0000-000000000002', 'owner@parkway.com', 'Property Owner', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K', '{"owner"}', 'medium', true),
  ('00000000-0000-0000-0000-000000000003', 'driver@parkway.com', 'Driver User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K', '{"driver"}', 'small', true),
  ('00000000-0000-0000-0000-000000000004', 'abcd@gmail.com', 'Test User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K', '{"driver"}', 'small', true)
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  updated_at = NOW();

-- Insert sample driveways
INSERT INTO driveways (owner_id, address, description, driveway_size, car_size_compatibility, price_per_hour, amenities, is_active) VALUES
  ('00000000-0000-0000-0000-000000000002', '123 Main St, Jersey City, NJ', 'Spacious driveway in downtown area', 'large', 'all', 15.00, 'Security cameras, Well-lit', true),
  ('00000000-0000-0000-0000-000000000002', '456 Oak Ave, Hoboken, NJ', 'Private driveway with easy access', 'medium', 'small,medium', 12.00, 'Covered parking available', true),
  ('00000000-0000-0000-0000-000000000002', '789 Pine St, Newark, NJ', 'Convenient downtown parking', 'small', 'small', 8.00, 'Near public transport', true);

-- Insert sample bookings
INSERT INTO bookings (user_id, driveway_id, start_time, end_time, status, total_price, payment_status) VALUES
  ('00000000-0000-0000-0000-000000000003', 
   (SELECT id FROM driveways WHERE address = '123 Main St, Jersey City, NJ' LIMIT 1),
   NOW() + INTERVAL '1 hour',
   NOW() + INTERVAL '3 hours',
   'confirmed', 30.00, 'paid');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Welcome to Parkway!', 'Welcome to Parkway.com! Start finding parking spots near you.', 'info', false),
  ('00000000-0000-0000-0000-000000000002', 'New Booking', 'You have a new booking request for your driveway.', 'booking', false);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driveways ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow user registration (insert)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Driveways are publicly readable
CREATE POLICY "Driveways are publicly readable" ON driveways
  FOR SELECT USING (is_active = true);

-- Owners can manage their own driveways
CREATE POLICY "Owners can manage own driveways" ON driveways
  FOR ALL USING (auth.uid() = owner_id);

-- Users can read their own bookings
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully!' as status;
