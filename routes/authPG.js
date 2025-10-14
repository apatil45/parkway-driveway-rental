const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserPG');
const { authenticateToken: auth } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;

    // Log the request for debugging
    console.log('Registration request:', { name, email, roles });

    // Basic validation
    if (!name || !email || !password) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        success: false,
        msg: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        msg: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ 
        success: false,
        msg: 'User already exists' 
      });
    }

    // Ensure roles is an array
    const userRoles = Array.isArray(roles) ? roles : [roles || 'driver'];

    // Create user (password will be hashed by model hooks)
    user = await User.create({
      name,
      email,
      password,
      roles: userRoles
    });

    // Generate token using the middleware function
    const { generateToken } = require('../middleware/auth');
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    console.error('Register Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: 'Email and password are required' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }

    // Check password using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate token using the middleware function
    const { generateToken } = require('../middleware/auth');
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    console.error('Login Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      raw: false
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'User not found' 
      });
    }
    
    res.json(user.toJSON());
  } catch (err) {
    console.error('Get User Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error fetching user data' 
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { carSize, drivewaySize, phoneNumber, address, onboardingCompleted } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update user fields
    const updateData = {};
    if (carSize !== undefined) updateData.carSize = carSize;
    if (drivewaySize !== undefined) updateData.drivewaySize = drivewaySize;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (err) {
    console.error('Update Profile Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating profile' 
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    // Generate new token with same user data
    const payload = { user: { id: req.user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
