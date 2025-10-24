-- Supabase Database Schema for Parkway.com
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
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
CREATE TABLE IF NOT EXISTS driveways (
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
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users(roles);
CREATE INDEX IF NOT EXISTS idx_driveways_owner_id ON driveways(owner_id);
CREATE INDEX IF NOT EXISTS idx_driveways_is_active ON driveways(is_active);
CREATE INDEX IF NOT EXISTS idx_driveways_price ON driveways(price_per_hour);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driveway_id ON bookings(driveway_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driveways ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Driveways are publicly readable" ON driveways;
DROP POLICY IF EXISTS "Owners can manage own driveways" ON driveways;
DROP POLICY IF EXISTS "Users can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

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

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop existing ones first)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_driveways_updated_at ON driveways;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driveways_updated_at BEFORE UPDATE ON driveways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO users (id, email, name, roles, car_size, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@parkway.com', 'Admin User', '{"admin"}', 'large', true),
  ('00000000-0000-0000-0000-000000000002', 'owner@parkway.com', 'Property Owner', '{"owner"}', 'medium', true),
  ('00000000-0000-0000-0000-000000000003', 'driver@parkway.com', 'Driver User', '{"driver"}', 'small', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample driveways
INSERT INTO driveways (owner_id, address, description, driveway_size, car_size_compatibility, price_per_hour, amenities, is_active) VALUES
  ('00000000-0000-0000-0000-000000000002', '123 Main St, Jersey City, NJ', 'Spacious driveway in downtown area', 'large', 'all', 15.00, 'Security cameras, Well-lit', true),
  ('00000000-0000-0000-0000-000000000002', '456 Oak Ave, Hoboken, NJ', 'Private driveway with easy access', 'medium', 'small,medium', 12.00, 'Covered parking available', true)
ON CONFLICT DO NOTHING;
