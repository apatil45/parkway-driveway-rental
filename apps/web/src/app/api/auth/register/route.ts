import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { 
  RegisterRequest, 
  AuthResponse, 
  createApiResponse, 
  createApiError,
  validateEmail,
  validatePassword 
} from '@parkway/shared';

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  ) as string;
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  ) as string;
};

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { name, email, password, roles, phone, address } = body;

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        createApiError('Invalid email format', 400, 'INVALID_EMAIL'),
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        createApiError(
          'Password validation failed: ' + passwordValidation.errors.join(', '),
          400,
          'WEAK_PASSWORD'
        ),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        createApiError('User already exists with this email', 409, 'USER_EXISTS'),
        { status: 409 }
      );
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

    return NextResponse.json(
      createApiResponse(response, 'User registered successfully', 201),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      createApiError('Internal server error', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
