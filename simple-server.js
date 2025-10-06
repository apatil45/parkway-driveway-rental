const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory storage
const users = [];
const driveways = [];
const bookings = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('frontend/dist'));

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, msg: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, msg: 'Invalid or expired token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, roles } = req.body;
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ 
      success: false, 
      msg: 'User already exists' 
    });
  }

  const user = {
    id: 'user-' + Date.now(),
    name,
    email,
    password, // In real app, hash this
    roles: roles || ['driver']
  };
  
  users.push(user);
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    'your-secret-key',
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    msg: 'Registration successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      msg: 'Invalid credentials' 
    });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    'your-secret-key',
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    msg: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles
    }
  });
});

app.get('/api/auth/user', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      msg: 'User not found' 
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles
    }
  });
});

// Driveway routes
app.get('/api/driveways', (req, res) => {
  res.json({
    success: true,
    driveways: driveways.filter(d => d.isAvailable)
  });
});

app.get('/api/driveways/owner', authenticateToken, (req, res) => {
  const userDriveways = driveways.filter(d => d.owner === req.user.userId);
  res.json({
    success: true,
    driveways: userDriveways
  });
});

app.post('/api/driveways', authenticateToken, (req, res) => {
  const { address, description, drivewaySize, carSizeCompatibility, pricePerHour, availability, amenities, images } = req.body;
  
  if (!address) {
    return res.status(400).json({ 
      success: false,
      msg: 'Address is required' 
    });
  }

  const driveway = {
    id: 'driveway-' + Date.now(),
    owner: req.user.userId,
    address,
    description: description || '',
    drivewaySize: drivewaySize || 'medium',
    carSizeCompatibility: carSizeCompatibility || ['small', 'medium'],
    pricePerHour: pricePerHour || 5,
    availability: availability || [],
    amenities: amenities || [],
    images: images || [],
    isAvailable: true,
    createdAt: new Date().toISOString()
  };
  
  driveways.push(driveway);
  
  res.json({
    success: true,
    driveway
  });
});

// Booking routes
app.get('/api/bookings', authenticateToken, (req, res) => {
  const userBookings = bookings.filter(b => b.driver === req.user.userId);
  res.json({
    success: true,
    bookings: userBookings
  });
});

app.post('/api/bookings', authenticateToken, (req, res) => {
  const { driveway, startTime, endTime, totalAmount, specialRequests } = req.body;
  
  if (!driveway || !startTime || !endTime || !totalAmount) {
    return res.status(400).json({ 
      success: false,
      msg: 'Missing required fields' 
    });
  }

  const booking = {
    id: 'booking-' + Date.now(),
    driver: req.user.userId,
    driveway,
    startTime,
    endTime,
    totalAmount,
    specialRequests: specialRequests || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  bookings.push(booking);
  
  res.json({
    success: true,
    booking
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to test the UI`);
  console.log(`📡 Using in-memory storage for testing`);
  console.log(`🔑 JWT Secret: your-secret-key`);
});
