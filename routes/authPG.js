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
  const { name, email, password, roles } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password) {
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

    // Create user
    user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      roles: userRoles
    });

    // Create JWT token
    const payload = { userId: user.id };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error('JWT Error:', err);
        return res.status(500).json({ 
          success: false,
          msg: 'Server error creating token' 
        });
      }
      res.json({ 
        success: true,
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          roles: user.roles 
        } 
      });
    });
  } catch (err) {
    console.error('Register Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error during registration' 
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

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const payload = { userId: user.id };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error('JWT Error:', err);
        return res.status(500).json({ 
          success: false,
          msg: 'Server error creating token' 
        });
      }
      res.json({ 
        success: true,
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          roles: user.roles 
        } 
      });
    });
  } catch (err) {
    console.error('Login Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error during login' 
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
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (err) {
    console.error('Get User Route Error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error fetching user data' 
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
