const jwt = require('jsonwebtoken');
const { db } = require('../models/supabase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        msg: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from Supabase
    const user = await db.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: 'Invalid token - user not found'
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      msg: 'Invalid token'
    });
  }
};

module.exports = { authenticateToken };
