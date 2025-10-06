const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Parkway.com server is working!',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request:', req.body);
  
  const { email, password, firstName, lastName, phone, role } = req.body;
  
  // Basic validation
  if (!email || !password || !firstName || !lastName || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Return success
  res.status(201).json({
    message: 'User registered successfully!',
    token: 'demo-token-123',
    user: {
      id: 1,
      email,
      firstName,
      lastName,
      phone,
      role: role || 'driver'
    }
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  res.json({
    message: 'Login successful!',
    token: 'demo-token-123',
    user: {
      id: 1,
      email,
      firstName: 'Demo',
      lastName: 'User',
      role: 'driver'
    }
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'driver'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚗 Parkway.com server running on port', PORT);
  console.log('📱 Health check: http://localhost:3000/api/health');
  console.log('✅ Registration: http://localhost:3000/api/auth/register');
  console.log('✅ Login: http://localhost:3000/api/auth/login');
});
