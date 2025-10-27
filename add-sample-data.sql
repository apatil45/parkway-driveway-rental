-- Add sample bookings and notifications to complete the database setup
-- This script adds realistic sample data for testing

-- Add sample bookings
INSERT INTO bookings (id, user_id, driveway_id, start_time, end_time, status, total_price, vehicle_info, special_requests, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com (driver)
    'e2628eb2-dcb3-4311-aa35-5f83f3781cb2', -- 123 Main St, Jersey City
    '2025-10-27 10:00:00+00',
    '2025-10-27 12:00:00+00',
    'confirmed',
    30.00,
    '{"make": "Toyota", "model": "Camry", "color": "Silver", "license": "ABC123"}',
    'Please leave space for easy exit',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003', -- driver@parkway.com
    '456 Oak Ave, Hoboken, NJ',
    '2025-10-28 14:00:00+00',
    '2025-10-28 16:00:00+00',
    'confirmed',
    24.00,
    '{"make": "Honda", "model": "Civic", "color": "Blue", "license": "XYZ789"}',
    'Near entrance please',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com
    '789 Pine St, Newark, NJ',
    '2025-10-29 09:00:00+00',
    '2025-10-29 11:00:00+00',
    'pending',
    16.00,
    '{"make": "Ford", "model": "Focus", "color": "Red", "license": "DEF456"}',
    'Quiet area preferred',
    NOW(),
    NOW()
  );

-- Add sample notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com
    'Booking Confirmed',
    'Your parking spot at 123 Main St, Jersey City has been confirmed for Oct 27, 10:00 AM - 12:00 PM',
    'booking',
    false,
    NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com
    'Payment Processed',
    'Payment of $30.00 has been processed successfully for your booking',
    'payment',
    true,
    NOW() - INTERVAL '1 hour'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003', -- driver@parkway.com
    'Booking Confirmed',
    'Your parking spot at 456 Oak Ave, Hoboken has been confirmed for Oct 28, 2:00 PM - 4:00 PM',
    'booking',
    false,
    NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002', -- owner@parkway.com
    'New Booking Received',
    'You have a new booking request for your driveway at 123 Main St, Jersey City',
    'booking_request',
    false,
    NOW() - INTERVAL '30 minutes'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002', -- owner@parkway.com
    'Payment Received',
    'Payment of $30.00 has been received for booking at 123 Main St, Jersey City',
    'payment',
    true,
    NOW() - INTERVAL '2 hours'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com
    'Welcome to Parkway!',
    'Welcome to Parkway.com! Start exploring available parking spots in your area.',
    'welcome',
    true,
    NOW() - INTERVAL '1 day'
  );

-- Add sample reviews
INSERT INTO reviews (id, booking_id, user_id, driveway_id, rating, comment, created_at)
VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000004' LIMIT 1),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com
    'e2628eb2-dcb3-4311-aa35-5f83f3781cb2', -- 123 Main St, Jersey City
    5,
    'Great spot! Easy to find and very convenient. Owner was helpful and responsive.',
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000003' LIMIT 1),
    '00000000-0000-0000-0000-000000000003', -- driver@parkway.com
    '456 Oak Ave, Hoboken, NJ',
    4,
    'Good location, clean area. Would book again.',
    NOW() - INTERVAL '2 hours'
  );

-- Add sample payments
INSERT INTO payments (id, booking_id, user_id, amount, currency, status, payment_method, stripe_payment_intent_id, created_at)
VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000004' LIMIT 1),
    '00000000-0000-0000-0000-000000000004', -- abcd@gmail.com
    30.00,
    'USD',
    'completed',
    'card',
    'pi_demo_payment_intent_123',
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000003' LIMIT 1),
    '00000000-0000-0000-0000-000000000003', -- driver@parkway.com
    24.00,
    'USD',
    'completed',
    'card',
    'pi_demo_payment_intent_456',
    NOW() - INTERVAL '2 hours'
  );

-- Update driveway ratings based on reviews
UPDATE driveways 
SET average_rating = (
  SELECT AVG(rating)::numeric(3,2) 
  FROM reviews 
  WHERE driveway_id = driveways.id
),
rating_count = (
  SELECT COUNT(*) 
  FROM reviews 
  WHERE driveway_id = driveways.id
)
WHERE id IN (
  SELECT DISTINCT driveway_id 
  FROM reviews
);

-- Update user ratings based on reviews received
UPDATE users 
SET rating = (
  SELECT AVG(r.rating)::numeric(3,2)
  FROM reviews r
  JOIN driveways d ON r.driveway_id = d.id
  WHERE d.owner_id = users.id
),
rating_count = (
  SELECT COUNT(*)
  FROM reviews r
  JOIN driveways d ON r.driveway_id = d.id
  WHERE d.owner_id = users.id
)
WHERE id IN (
  SELECT DISTINCT d.owner_id
  FROM driveways d
  JOIN reviews r ON d.id = r.driveway_id
);

-- Display summary
SELECT 
  'Sample Data Added Successfully!' as status,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM notifications) as total_notifications,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COUNT(*) FROM payments) as total_payments;
