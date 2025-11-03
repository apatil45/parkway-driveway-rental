import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { createBookingSchema, bookingQuerySchema, type CreateBookingInput, type BookingQueryParams } from '@/lib/validations';
import { sendEmail, emailTemplates } from '@/lib/email';
import { requireAuth } from '@/lib/auth-middleware';

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
          'Invalid query parameters: ' + queryValidation.error.errors.map(e => e.message).join(', '),
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
    const drivewayIds = userDriveways.map(d => d.id);

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
    console.error('Get bookings error:', error);
    return NextResponse.json(
      createApiError('Failed to retrieve bookings', 500, 'INTERNAL_ERROR'),
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
      return NextResponse.json(
        createApiError(
          'Validation failed: ' + validationResult.error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
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
        createApiError('Driveway not found', 404, 'DRIVEWAY_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check if driveway is available and active
    if (!driveway.isActive || !driveway.isAvailable) {
      return NextResponse.json(
        createApiError('Driveway is not available for booking', 400, 'DRIVEWAY_UNAVAILABLE'),
        { status: 400 }
      );
    }

    // Check if user is trying to book their own driveway
    if (driveway.ownerId === userId) {
      return NextResponse.json(
        createApiError('You cannot book your own driveway', 400, 'INVALID_BOOKING'),
        { status: 400 }
      );
    }

    // Validate time range and calculate total price
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
      return NextResponse.json(
        createApiError('Invalid start or end time', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Check that booking is in the future
    const now = new Date();
    if (start.getTime() < now.getTime()) {
      return NextResponse.json(
        createApiError('Start time must be in the future', 400, 'INVALID_TIME'),
        { status: 400 }
      );
    }

    if (end.getTime() <= start.getTime()) {
      return NextResponse.json(
        createApiError('End time must be after start time', 400, 'INVALID_TIME_RANGE'),
        { status: 400 }
      );
    }

    // Validate maximum booking duration (7 days)
    const maxDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (end.getTime() - start.getTime() > maxDurationMs) {
      return NextResponse.json(
        createApiError('Booking duration cannot exceed 7 days', 400, 'INVALID_DURATION'),
        { status: 400 }
      );
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(hours * driveway.pricePerHour * 100) / 100;

    // Use transaction to prevent race conditions
    const booking = await prisma.$transaction(async (tx) => {
      // Check overlapping bookings against capacity (consider pending and confirmed)
      const overlappingCount = await tx.booking.count({
        where: {
          drivewayId,
          status: { in: ['PENDING', 'CONFIRMED'] as any },
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

      // Create Stripe payment intent if Stripe is configured
      let paymentIntentId: string | undefined;
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (stripeSecret) {
        try {
          const stripe = (await import('stripe')).default;
          const stripeClient = new stripe(stripeSecret);
          const amountInCents = Math.round(totalPrice * 100);
          
          const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
              booking_userId: userId,
              booking_drivewayId: drivewayId,
              booking_startTime: startTime,
              booking_endTime: endTime,
            },
          });
          
          paymentIntentId = paymentIntent.id;
        } catch (error) {
          console.error('Failed to create payment intent:', error);
          // Continue without payment intent (will be created later if needed)
        }
      }

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

    // Create notifications for booking creation
    await prisma.notification.createMany({
      data: [
        {
          userId: booking.userId,
          title: 'Booking Created',
          message: `Your booking for ${booking.driveway.title} has been created. Please complete payment to confirm.`,
          type: 'info'
        },
        {
          userId: booking.driveway.owner.id,
          title: 'New Booking Request',
          message: `You have a new booking request for ${booking.driveway.title}`,
          type: 'info'
        }
      ]
    });

    // Send email notification (if email service is configured)
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
      console.error('Failed to send booking email:', emailError);
    }

    return NextResponse.json(
      createApiResponse(booking, 'Booking created successfully', 201),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create booking error:', error);
    
    // Handle capacity exceeded error from transaction
    if (error.message === 'CAPACITY_EXCEEDED') {
      return NextResponse.json(
        createApiError('Driveway is fully booked for the selected time range', 409, 'CAPACITY_EXCEEDED'),
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      createApiError('Failed to create booking', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
