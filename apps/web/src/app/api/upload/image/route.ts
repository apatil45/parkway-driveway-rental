import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    // Check authentication
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json(
        createApiError('Unauthorized', 401, 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Check if Cloudinary is configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        createApiError('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET', 500, 'CONFIG_ERROR'),
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        createApiError('No file provided', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        createApiError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        createApiError('File too large. Maximum size is 10MB.', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const cloudinary = (await import('cloudinary')).v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'driveway-rental',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        { format: 'auto' }
      ],
    });

    return NextResponse.json(
      createApiResponse(
        {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
        'Image uploaded successfully'
      )
    );
  } catch (error: any) {
    logger.error('Image upload error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError(
        error.message || 'Failed to upload image',
        500,
        'UPLOAD_ERROR'
      ),
      { status: 500 }
    );
  }
}

