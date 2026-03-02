import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VERIFICATION_FOLDER = 'driveway-rental/verifications';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        createApiError(
          'File upload is not configured. Please contact support.',
          500,
          'CONFIG_ERROR'
        ),
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        createApiError('No file provided', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        createApiError(
          'Invalid file type. Use PDF, JPEG, PNG, or WebP (e.g. deed, lease, utility bill).',
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        createApiError('File too large. Maximum size is 5MB.', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    const cloudinary = (await import('cloudinary')).v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const isPdf = file.type === 'application/pdf';
    const result = isPdf
      ? await cloudinary.uploader.upload(dataURI, {
          folder: VERIFICATION_FOLDER,
          resource_type: 'raw',
        })
      : await cloudinary.uploader.upload(dataURI, {
          folder: VERIFICATION_FOLDER,
          resource_type: 'image',
        });

    return NextResponse.json(
      createApiResponse(
        {
          url: result.secure_url,
          publicId: result.public_id,
        },
        'Document uploaded successfully'
      )
    );
  } catch (error: any) {
    logger.error('Verification document upload error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError(
        error.message || 'Failed to upload document',
        500,
        'UPLOAD_ERROR'
      ),
      { status: 500 }
    );
  }
}
