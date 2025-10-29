import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError, CreateBookingRequest } from '@parkway/shared';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
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
      prisma.booking.count({ where: { userId } })
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    const body: CreateBookingRequest = await request.json();
    const { drivewayId, startTime, endTime, specialRequests, vehicleInfo } = body;

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

    // Calculate total price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(hours * driveway.pricePerHour * 100) / 100;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        drivewayId,
        userId,
        startTime: start,
        endTime: end,
        totalPrice,
        specialRequests,
        vehicleInfo: vehicleInfo ? JSON.stringify(vehicleInfo) : null
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
