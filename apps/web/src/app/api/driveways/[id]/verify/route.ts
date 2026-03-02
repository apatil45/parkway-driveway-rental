import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { submitVerificationSchema } from '@/lib/validations';
import { runVerificationPipeline } from '@/services/VerificationService';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/driveways/[id]/verify
 * Owner submits address-proof documents (URLs from upload API). Runs hybrid pipeline:
 * auto-verify / auto-reject or sets PENDING for manual review.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const { id: drivewayId } = await params;
    const driveway = await prisma.driveway.findUnique({
      where: { id: drivewayId },
      select: { id: true, ownerId: true, address: true, verificationStatus: true },
    });

    if (!driveway) {
      return NextResponse.json(
        createApiError('Driveway not found', 404, 'NOT_FOUND'),
        { status: 404 }
      );
    }
    if (driveway.ownerId !== userId) {
      return NextResponse.json(
        createApiError('You can only submit verification for your own listings', 403, 'FORBIDDEN'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = submitVerificationSchema.safeParse(body);
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

    const { documentUrls } = parsed.data;

    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const ownerName = owner?.name ?? '';

    const pipelineResult = await runVerificationPipeline({
      documentUrls,
      listingAddress: driveway.address,
      ownerName,
    });

    const now = new Date();
    const updateData: Record<string, unknown> = {
      verificationDocumentUrls: documentUrls,
      verificationSubmittedAt: now,
      verificationConfidence: pipelineResult.confidence,
      verificationAutoResult: pipelineResult.result,
      verificationExtractedAddress: pipelineResult.extractedAddress,
      verificationExtractedName: pipelineResult.extractedName,
      verificationProvider: 'in_house',
      verificationRejectedAt: null,
      verificationRejectionReason: null,
      verifiedAt: null,
    };

    if (pipelineResult.result === 'verified') {
      updateData.verificationStatus = 'VERIFIED';
      updateData.verifiedAt = now;
    } else if (pipelineResult.result === 'rejected') {
      updateData.verificationStatus = 'REJECTED';
      updateData.verificationRejectedAt = now;
      updateData.verificationRejectionReason = pipelineResult.rejectionReason ?? 'Document did not match listing.';
    } else {
      updateData.verificationStatus = 'PENDING';
    }

    await prisma.driveway.update({
      where: { id: drivewayId },
      data: updateData as any,
    });

    return NextResponse.json(
      createApiResponse(
        {
          status: pipelineResult.result === 'verified' ? 'verified' : pipelineResult.result === 'rejected' ? 'rejected' : 'pending',
          message:
            pipelineResult.result === 'verified'
              ? 'Listing verified successfully.'
              : pipelineResult.result === 'rejected'
                ? pipelineResult.rejectionReason ?? 'Verification rejected.'
                : 'Document submitted. A team member will review it shortly.',
        },
        'Verification submitted'
      )
    );
  } catch (error: any) {
    logger.error('Submit verification error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError(
        error.message || 'Failed to submit verification',
        500,
        'INTERNAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/driveways/[id]/verify
 * Owner gets verification status and rejection reason (if any).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const { id: drivewayId } = await params;
    const driveway = await prisma.driveway.findUnique({
      where: { id: drivewayId },
      select: {
        id: true,
        ownerId: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        verifiedAt: true,
        verificationRejectedAt: true,
        verificationRejectionReason: true,
      },
    });

    if (!driveway) {
      return NextResponse.json(
        createApiError('Driveway not found', 404, 'NOT_FOUND'),
        { status: 404 }
      );
    }
    if (driveway.ownerId !== userId) {
      return NextResponse.json(
        createApiError('Forbidden', 403, 'FORBIDDEN'),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createApiResponse(
        {
          verificationStatus: driveway.verificationStatus,
          submittedAt: driveway.verificationSubmittedAt?.toISOString() ?? null,
          verifiedAt: driveway.verifiedAt?.toISOString() ?? null,
          rejectedAt: driveway.verificationRejectedAt?.toISOString() ?? null,
          rejectionReason: driveway.verificationRejectionReason ?? null,
        },
        'Verification status retrieved'
      )
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Get verification status error', {}, err);
    const message = process.env.NODE_ENV === 'development' ? err.message : 'Failed to get verification status';
    return NextResponse.json(
      createApiError(message, 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
