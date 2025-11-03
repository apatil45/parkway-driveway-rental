/**
 * Tests for cron job endpoints
 */

import { NextRequest } from 'next/server';
import { prisma } from '@parkway/database';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: class {
    headers: Headers;
    constructor(url: string, init?: { headers?: Record<string, string> }) {
      this.headers = new Headers();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
  },
  NextResponse: {
    json: jest.fn((data: any, options?: { status?: number }) => {
      const response = {
        json: async () => data,
        status: options?.status || 200,
        ok: (options?.status || 200) < 400,
      };
      return response;
    }),
  },
}));

// Dynamically import after mocking
let expireBookings: any;
let completeBookings: any;

beforeAll(async () => {
  const expireModule = await import('@/app/api/cron/expire-bookings/route');
  const completeModule = await import('@/app/api/cron/complete-bookings/route');
  expireBookings = expireModule.GET;
  completeBookings = completeModule.GET;
});

// Mock Prisma
jest.mock('@parkway/database', () => ({
  prisma: {
    booking: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

// Mock createApiResponse
jest.mock('@parkway/shared', () => ({
  createApiResponse: jest.fn((data, message) => ({
    success: true,
    data,
    message,
  })),
}));

describe('Cron Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  describe('expire-bookings', () => {
    it('should expire pending bookings older than 15 minutes', async () => {
      const mockUpdateMany = prisma.booking.updateMany as jest.Mock;
      const mockFindMany = prisma.booking.findMany as jest.Mock;
      const mockCreateMany = prisma.notification.createMany as jest.Mock;

      mockUpdateMany.mockResolvedValue({ count: 2 });
      mockFindMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/expire-bookings', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await expireBookings(request);
      const data = await response.json();

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          paymentStatus: 'PENDING',
          createdAt: expect.any(Object),
        },
        data: {
          status: 'EXPIRED',
          paymentStatus: 'FAILED',
        },
      });

      expect(response.status).toBe(200);
      expect(data.data.expiredCount).toBe(2);
    });

    it('should return 401 when cron secret is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/expire-bookings', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      });

      const response = await expireBookings(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create notifications for expired bookings', async () => {
      const mockUpdateMany = prisma.booking.updateMany as jest.Mock;
      const mockFindMany = prisma.booking.findMany as jest.Mock;
      const mockCreateMany = prisma.notification.createMany as jest.Mock;

      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockFindMany.mockResolvedValue([
        {
          id: 'booking-1',
          userId: 'user-1',
          driveway: {
            ownerId: 'owner-1',
            title: 'Test Driveway',
          },
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/cron/expire-bookings', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      await expireBookings(request);

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            title: 'Booking Expired',
            type: 'warning',
          }),
          expect.objectContaining({
            userId: 'owner-1',
            title: 'Booking Expired',
            type: 'info',
          }),
        ]),
      });
    });
  });

  describe('complete-bookings', () => {
    it('should complete confirmed bookings past endTime', async () => {
      const mockUpdateMany = prisma.booking.updateMany as jest.Mock;

      mockUpdateMany.mockResolvedValue({ count: 3 });

      const request = new NextRequest('http://localhost:3000/api/cron/complete-bookings', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await completeBookings(request);
      const data = await response.json();

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          status: 'CONFIRMED',
          endTime: expect.any(Object),
        },
        data: {
          status: 'COMPLETED',
        },
      });

      expect(response.status).toBe(200);
      expect(data.data.completedCount).toBe(3);
    });

    it('should return 401 when cron secret is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/complete-bookings', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      });

      const response = await completeBookings(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle errors gracefully', async () => {
      const mockUpdateMany = prisma.booking.updateMany as jest.Mock;

      mockUpdateMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/cron/complete-bookings', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await completeBookings(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to complete bookings');
    });
  });
});

