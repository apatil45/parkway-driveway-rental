const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // Get token from header - check both x-auth-token and Authorization Bearer
  let token = req.header('x-auth-token');
  
  // If no x-auth-token, check Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  console.log('Auth middleware - Token received:', !!token);
  console.log('Auth middleware - Request URL:', req.url);
  console.log('Auth middleware - Request method:', req.method);

  // Check if not token
  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('Auth middleware - Token verified, user:', req.user);
    next();
  } catch (err) {
    console.log('Auth middleware - Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
