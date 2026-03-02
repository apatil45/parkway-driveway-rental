import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAdmin } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/verifications
 * List driveways with PENDING verification (for admin queue).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.error!;
  }

  try {
    const pending = await prisma.driveway.findMany({
      where: { verificationStatus: 'PENDING' },
      orderBy: { verificationSubmittedAt: 'asc' },
      select: {
        id: true,
        title: true,
        address: true,
        verificationSubmittedAt: true,
        verificationDocumentUrls: true,
        verificationExtractedAddress: true,
        verificationExtractedName: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      createApiResponse(
        { verifications: pending },
        'Verifications list retrieved'
      )
    );
  } catch (error: any) {
    return NextResponse.json(
      createApiError('Failed to load verifications', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
