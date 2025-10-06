const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('frontend/dist'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints for testing
app.get('/api/driveways', (req, res) => {
  res.json({
    success: true,
    driveways: [
      {
        id: 'test-1',
        address: '123 Test Street, Test City',
        description: 'A beautiful driveway in a quiet neighborhood',
        pricePerHour: 5,
        drivewaySize: 'medium',
        carSizeCompatibility: ['small', 'medium'],
        availability: [
          {
            dayOfWeek: 'monday',
            startTime: '08:00',
            endTime: '18:00',
            isAvailable: true
          }
        ],
        amenities: ['Security', 'Covered'],
        images: [],
        owner: 'test-owner'
      }
    ]
  });
});

app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    bookings: []
  });
});

// Mock auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    msg: 'Registration successful',
    token: 'mock-jwt-token',
    user: {
      id: 'test-user',
      name: req.body.name,
      email: req.body.email,
      roles: req.body.roles || ['driver']
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    msg: 'Login successful',
    token: 'mock-jwt-token',
    user: {
      id: 'test-user',
      name: 'Test User',
      email: req.body.email,
      roles: ['driver']
    }
  });
});

app.get('/api/auth/user', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['driver']
    }
  });
});

// Mock driveway creation
app.post('/api/driveways', (req, res) => {
  res.json({
    success: true,
    driveway: {
      id: 'new-driveway-' + Date.now(),
      ...req.body,
      owner: 'test-owner'
    }
  });
});

// Mock booking creation
app.post('/api/bookings', (req, res) => {
  res.json({
    success: true,
    booking: {
      id: 'new-booking-' + Date.now(),
      ...req.body,
      driver: 'test-driver',
      status: 'pending'
    }
  });
});

// Serve React app for all other routes
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to test the UI`);
  console.log(`📡 All API endpoints are mocked for testing`);
});
