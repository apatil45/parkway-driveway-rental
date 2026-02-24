import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      createApiError('Service temporarily unavailable. Please try again later.', 503, 'SERVER_CONFIG'),
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid email';
      return NextResponse.json(createApiError(msg, 400, 'VALIDATION_ERROR'), { status: 400 });
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true },
    });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json(
        createApiResponse(
          { message: 'If an account exists with this email, you will receive reset instructions.' },
          'If an account exists with this email, you will receive reset instructions.'
        ),
        { status: 200 }
      );
    }

    const resetToken = jwt.sign(
      { email: user.email, purpose: 'password-reset' },
      secret,
      { expiresIn: '1h' }
    );

    // In production you would send an email with the reset link.
    // For now we return the link in dev only so the flow is testable without email config.
    const baseUrl = request.nextUrl.origin;
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      createApiResponse(
        {
          message: 'If an account exists with this email, you will receive reset instructions.',
          ...(isDev ? { resetLink } : {}),
        },
        'If an account exists with this email, you will receive reset instructions.'
      ),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createApiError('Something went wrong. Please try again later.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
