import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { 
  AuthResponse, 
  createApiResponse, 
  createApiError 
} from '@parkway/shared';
import { loginSchema, type LoginInput } from '@/lib/validations';

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError(
          'Validation failed: ' + validationResult.error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }
    
    const { email, password }: LoginInput = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
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

    const response = {
      user: userData,
      token,
      refreshToken
    };

    return NextResponse.json(createApiResponse(response, 'Login successful'));
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      createApiError('Internal server error', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
