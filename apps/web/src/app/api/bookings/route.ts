import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { createBookingSchema, bookingQuerySchema, type CreateBookingInput, type BookingQueryParams } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

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

    const whereClause: any = {
      userId,
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
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

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

    // Validate time range and calculate total price
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
      return NextResponse.json(
        createApiError('Invalid start or end time', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    if (end.getTime() <= start.getTime()) {
      return NextResponse.json(
        createApiError('End time must be after start time', 400, 'INVALID_TIME_RANGE'),
        { status: 400 }
      );
    }
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(hours * driveway.pricePerHour * 100) / 100;

    // Check overlapping bookings against capacity (consider pending and confirmed)
    const overlappingCount = await prisma.booking.count({
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
      return NextResponse.json(
        createApiError('Driveway is fully booked for the selected time range', 409, 'CAPACITY_EXCEEDED'),
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        drivewayId,
        userId,
        startTime: start,
        endTime: end,
        totalPrice,
        specialRequests,
        vehicleInfo: vehicleInfo || undefined
      },
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
      }
    });

    return NextResponse.json(
      createApiResponse(booking, 'Booking created successfully', 201),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      createApiError('Failed to create booking', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
