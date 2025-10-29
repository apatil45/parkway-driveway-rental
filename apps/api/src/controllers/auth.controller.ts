import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '@parkway/database';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  createApiResponse, 
  createApiError,
  validateEmail,
  validatePassword 
} from '@parkway/shared';
import { asyncHandler } from '../middleware/error.middleware';

// Validation rules
export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('roles').isArray().withMessage('Roles must be an array')
];

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );
};

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createApiError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  const { name, email, password, roles, phone, address }: RegisterRequest = req.body;

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json(createApiError('Invalid email format', 400, 'INVALID_EMAIL'));
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json(createApiError(
      'Password validation failed: ' + passwordValidation.errors.join(', '),
      400,
      'WEAK_PASSWORD'
    ));
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(409).json(createApiError('User already exists with this email', 409, 'USER_EXISTS'));
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roles,
      phone,
      address
    },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      phone: true,
      address: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const response: AuthResponse = {
    user,
    token,
    refreshToken
  };

  res.status(201).json(createApiResponse(response, 'User registered successfully', 201));
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createApiError('Validation failed', 400, 'VALIDATION_ERROR'));
  }

  const { email, password }: LoginRequest = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.isActive) {
    return res.status(401).json(createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json(createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
  }

  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Return user data (excluding password)
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    phone: user.phone,
    address: user.address,
    avatar: user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  const response: AuthResponse = {
    user: userData,
    token,
    refreshToken
  };

  res.json(createApiResponse(response, 'Login successful'));
});

// Get current user
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      phone: true,
      address: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    return res.status(404).json(createApiError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.json(createApiResponse(user, 'User data retrieved successfully'));
});
