const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('roles')
    .custom((value) => {
      if (!value) return true; // Optional field
      const roles = Array.isArray(value) ? value : [value];
      const validRoles = ['driver', 'owner'];
      const invalidRoles = roles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles: ${invalidRoles.join(', ')}. Must be driver and/or owner.`);
      }
      return true;
    }),
  
  body('carSize')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid car size'),
  
  body('drivewaySize')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid driveway size'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Driveway validation
const validateDriveway = [
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 255 })
    .withMessage('Address must be less than 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('carSizeCompatibility')
    .optional()
    .isArray()
    .withMessage('Car size compatibility must be an array'),
  
  body('carSizeCompatibility.*')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid car size compatibility'),
  
  body('drivewaySize')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid driveway size'),
  
  handleValidationErrors
];

// Rate limiting helper
const createRateLimit = (windowMs, max, message) => {
  return {
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  };
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateDriveway,
  handleValidationErrors,
  createRateLimit
};
