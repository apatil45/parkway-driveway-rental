import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset link is invalid or expired'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/\d/, 'Password must include at least one number'),
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
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json(createApiError(msg, 400, 'VALIDATION_ERROR'), { status: 400 });
    }
    const { token, newPassword } = parsed.data;

    let payload: { email?: string; purpose?: string };
    try {
      payload = jwt.verify(token, secret) as { email?: string; purpose?: string };
    } catch {
      return NextResponse.json(
        createApiError('Reset link is invalid or has expired. Please request a new one.', 400, 'INVALID_TOKEN'),
        { status: 400 }
      );
    }
    if (payload.purpose !== 'password-reset' || !payload.email) {
      return NextResponse.json(
        createApiError('Reset link is invalid. Please request a new one.', 400, 'INVALID_TOKEN'),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        createApiError('Reset link is invalid or has expired. Please request a new one.', 400, 'INVALID_TOKEN'),
        { status: 400 }
      );
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      createApiResponse({}, 'Your password has been reset. You can now sign in.'),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createApiError('Something went wrong. Please try again later.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
