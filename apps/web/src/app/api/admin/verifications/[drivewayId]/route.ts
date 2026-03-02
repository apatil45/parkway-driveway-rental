import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminVerificationReviewSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/admin/verifications/[drivewayId]
 * Approve or reject a pending verification.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ drivewayId: string }> }
) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.error!;
  }

  const { drivewayId } = await params;
  const body = await request.json();
  const parsed = adminVerificationReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createApiError(
        parsed.error.errors.map((e) => e.message).join('; '),
        400,
        'VALIDATION_ERROR'
      ),
      { status: 400 }
    );
  }

  const { action, rejectionReason } = parsed.data;

  const driveway = await prisma.driveway.findUnique({
    where: { id: drivewayId },
    select: { id: true, verificationStatus: true },
  });

  if (!driveway) {
    return NextResponse.json(
      createApiError('Driveway not found', 404, 'NOT_FOUND'),
      { status: 404 }
    );
  }
  if (driveway.verificationStatus !== 'PENDING') {
    return NextResponse.json(
      createApiError('This listing is not pending verification', 400, 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const now = new Date();
  if (action === 'approve') {
    await prisma.driveway.update({
      where: { id: drivewayId },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: now,
        verificationRejectedAt: null,
        verificationRejectionReason: null,
      },
    });
    return NextResponse.json(
      createApiResponse({ status: 'verified' }, 'Verification approved')
    );
  }

  await prisma.driveway.update({
    where: { id: drivewayId },
    data: {
      verificationStatus: 'REJECTED',
      verificationRejectedAt: now,
      verificationRejectionReason: rejectionReason ?? 'Document did not meet verification requirements.',
    },
  });
  return NextResponse.json(
    createApiResponse({ status: 'rejected' }, 'Verification rejected')
  );
}
