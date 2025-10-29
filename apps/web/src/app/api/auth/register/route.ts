import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { 
  AuthResponse, 
  createApiResponse, 
  createApiError
} from '@parkway/shared';
import { registerSchema, type RegisterInput } from '@/lib/validations';

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
    const validationResult = registerSchema.safeParse(body);
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
    
    const { name, email, password, roles, phone, address }: RegisterInput = validationResult.data;

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

    const response = {
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
