import { NextRequest, NextResponse } from 'next/server';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { createBookingSchema, bookingQuerySchema, type CreateBookingInput, type BookingQueryParams } from '@/lib/validations';
import { sendEmail, emailTemplates } from '@/lib/email';
import { requireAuth } from '@/lib/auth-middleware';
import { PricingService } from '@/services/PricingService';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request); 
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = bookingQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryValidation.success) {
      return NextResponse.json(
        createApiError(
          'Please check your search filters and try again.',
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }
    
    const { page, limit, status }: BookingQueryParams & { status?: string } = queryValidation.data as any;
    const skip = (page - 1) * limit;

    // Get user's driveways to include bookings for owned driveways
    const userDriveways = await prisma.driveway.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const drivewayIds = userDriveways.map((d: { id: string }) => d.id);

    // Include bookings where user is the driver OR owner of the driveway
    const whereClause: any = {
      OR: [
        { userId }, // User's own bookings
        ...(drivewayIds.length > 0 ? [{ drivewayId: { in: drivewayIds } }] : []) // Bookings for user's driveways
      ],
      ...(status ? { status } : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          driveway: {
            select: {
              id: true,
              title: true,
              address: true,
              images: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.booking.count({ where: whereClause })
    ]);

    return NextResponse.json(createApiResponse({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Bookings retrieved successfully'));
  } catch (error) {
    logger.error('Get bookings error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      createApiError('Unable to load your bookings. Please try again in a moment.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use centralized auth middleware
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await request.json();
    
    // Validate input
    const validationResult = createBookingSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      let userMessage = 'Please check your booking details and try again.';
      
      // Provide specific user-friendly messages for common validation errors
      if (firstError.path.includes('startTime') || firstError.path.includes('endTime')) {
        userMessage = 'Please select valid start and end times for your booking.';
      } else if (firstError.path.includes('drivewayId')) {
        userMessage = 'Please select a valid parking space.';
      } else if (firstError.message) {
        // Use a sanitized version of the error message if it's user-friendly
        const message = firstError.message.toLowerCase();
        if (message.includes('required')) {
          userMessage = 'Please fill in all required fields.';
        } else if (message.includes('invalid')) {
          userMessage = 'Some of your booking details are invalid. Please check and try again.';
        }
      }
      
      return NextResponse.json(
        createApiError(userMessage, 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    
    const { drivewayId, startTime, endTime, specialRequests, vehicleInfo }: CreateBookingInput = validationResult.data;

    // Get driveway details
    const driveway = await prisma.driveway.findUnique({
      where: { id: drivewayId }
    });

    if (!driveway) {
      return NextResponse.json(
        createApiError('This parking space is no longer available.', 404, 'DRIVEWAY_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check if driveway is available and active
    if (!driveway.isActive || !driveway.isAvailable) {
      return NextResponse.json(
        createApiError('This parking space is currently not accepting bookings.', 400, 'DRIVEWAY_UNAVAILABLE'),
        { status: 400 }
      );
    }

    // Check if user is trying to book their own driveway
    if (driveway.ownerId === userId) {
      return NextResponse.json(
        createApiError('You cannot book your own parking space.', 400, 'INVALID_BOOKING'),
        { status: 400 }
      );
    }

    // Validate time range and calculate total price
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
      return NextResponse.json(
        createApiError('Please select valid start and end times for your booking.', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Check that booking is in the future
    const now = new Date();
    if (start.getTime() < now.getTime()) {
      return NextResponse.json(
        createApiError('Booking start time must be in the future. Please select a later time.', 400, 'INVALID_TIME'),
        { status: 400 }
      );
    }

    if (end.getTime() <= start.getTime()) {
      return NextResponse.json(
        createApiError('End time must be after the start time. Please adjust your booking times.', 400, 'INVALID_TIME_RANGE'),
        { status: 400 }
      );
    }

    // Validate booking duration using PricingService
    const durationValidation = PricingService.validateDuration(start, end);
    
    if (!durationValidation.valid) {
      return NextResponse.json(
        createApiError(durationValidation.error || 'Invalid booking duration', 400, 'INVALID_DURATION'),
        { status: 400 }
      );
    }

    // Calculate dynamic pricing
    // First, get nearby bookings to calculate demand
    const nearbyBookings = await prisma.booking.count({
      where: {
        drivewayId,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        OR: [
          // Overlapping bookings
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gt: start } }
            ]
          },
          // Bookings within 1 hour before/after
          {
            OR: [
              { startTime: { gte: new Date(start.getTime() - 60 * 60 * 1000) } },
              { endTime: { lte: new Date(end.getTime() + 60 * 60 * 1000) } }
            ]
          }
        ]
      }
    });

    // Calculate demand multiplier
    const demandMultiplier = PricingService.calculateDemandMultiplier(
      nearbyBookings,
      driveway.capacity || 1
    );

    // Calculate dynamic price
    const pricingBreakdown = PricingService.calculatePrice({
      basePricePerHour: driveway.pricePerHour,
      startTime: start,
      endTime: end,
      demandMultiplier,
    });

    // Validate final price meets minimum
    const priceValidation = PricingService.validatePrice(pricingBreakdown.finalPrice);
    if (!priceValidation.valid) {
      return NextResponse.json(
        createApiError(
          priceValidation.error || `Minimum booking price is $${PricingService.MIN_PRICE_DOLLARS.toFixed(2)}. Please select a longer duration or choose a space with higher rates.`,
          400,
          'PRICE_TOO_LOW'
        ),
        { status: 400 }
      );
    }

    const totalPrice = pricingBreakdown.finalPrice;

    // Use transaction to prevent race conditions
    const booking = await prisma.$transaction(async (tx: PrismaClient) => {
      // Check overlapping bookings against capacity (ONLY CONFIRMED bookings reserve spots)
      // PENDING bookings don't reserve spots until payment is completed
      const overlappingCount = await tx.booking.count({
        where: {
          drivewayId,
          status: 'CONFIRMED', // Only paid/confirmed bookings reserve spots
          paymentStatus: 'COMPLETED', // Double-check payment is completed
          // Overlap condition: existing.start < newEnd AND existing.end > newStart
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } }
          ]
        }
      });

      if (overlappingCount >= (driveway.capacity || 1)) {
        throw new Error('CAPACITY_EXCEEDED');
      }

      // Payment intent will be created when user reaches checkout page
      // This prevents duplicate payment intent creation and allows for better error handling
      let paymentIntentId: string | undefined;

      // Create booking atomically within transaction
      // Ensure status and paymentStatus are consistent
      return await tx.booking.create({
        data: {
          drivewayId,
          userId,
          startTime: start,
          endTime: end,
          totalPrice,
          specialRequests,
          vehicleInfo: vehicleInfo || undefined,
          paymentIntentId: paymentIntentId || undefined,
          status: 'PENDING', // Explicitly set to ensure consistency
          paymentStatus: 'PENDING' // Explicitly set to ensure consistency
        },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        driveway: {
          select: {
            id: true,
            title: true,
            address: true,
            images: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });
    });

    // Create notification ONLY for renter (owner will be notified after payment)
    // Owner should NOT be notified until payment is completed and spot is reserved
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Created',
        message: 'Your booking for ' + booking.driveway.title + ' has been created. Please complete payment to confirm and reserve your spot.',
        type: 'info'
      }
    });

    // Send email notification ONLY to renter (owner will be notified after payment)
    try {
      await sendEmail({
        to: booking.user.email,
        ...emailTemplates.bookingConfirmation({
          drivewayTitle: booking.driveway.title,
          address: booking.driveway.address,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          totalPrice: booking.totalPrice,
          bookingId: booking.id
        })
      });
    } catch (emailError) {
      // Email failure shouldn't break booking creation
      logger.warn('Failed to send booking email', { 
        bookingId: booking.id,
        error: emailError instanceof Error ? emailError.message : String(emailError)
      });
    }

    return NextResponse.json(
      createApiResponse(booking, 'Booking created successfully', 201),
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Create booking error', {}, error instanceof Error ? error : undefined);
    
    // Handle capacity exceeded error from transaction
    if (error.message === 'CAPACITY_EXCEEDED') {
      return NextResponse.json(
        createApiError('This parking space is fully booked for the selected time. Please choose a different time or location.', 409, 'CAPACITY_EXCEEDED'),
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      createApiError('Unable to create your booking. Please try again in a moment.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
