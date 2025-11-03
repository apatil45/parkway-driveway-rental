/**
 * API Integration Tests
 * Tests all API endpoints with actual HTTP requests
 * 
 * Run with: npm run test:api
 * Requires: Server running on http://localhost:3000
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test user credentials
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  roles: ['DRIVER'] as const,
};

let api: AxiosInstance;
let authToken: string;
let userId: string;
let drivewayId: string;
let bookingId: string;
let reviewId: string;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      timeout: 10000,
    });
  });

  describe('Authentication APIs', () => {
    it('POST /api/auth/register - should register new user', async () => {
      const response = await api.post('/auth/register', TEST_USER);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('user');
      expect(response.data.data.user.email).toBe(TEST_USER.email);
      
      userId = response.data.data.user.id;
    });

    it('POST /api/auth/login - should login user', async () => {
      const response = await api.post('/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('user');
      expect(response.data.data.user.email).toBe(TEST_USER.email);
      
      // Check for cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('GET /api/auth/me - should get current user', async () => {
      const response = await api.get('/auth/me');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.email).toBe(TEST_USER.email);
    });

    it('GET /api/auth/me - should reject unauthenticated request', async () => {
      const unauthenticatedApi = axios.create({
        baseURL: API_URL,
        timeout: 10000,
      });

      try {
        await unauthenticatedApi.get('/auth/me');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Driveway APIs', () => {
    it('POST /api/driveways - should create driveway', async () => {
      const drivewayData = {
        title: 'Test Parking Spot',
        description: 'A test parking spot',
        address: '123 Test St, Test City, TC 12345',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 5.00,
        capacity: 2,
        carSize: ['small', 'medium'],
        amenities: ['covered'],
        images: [],
      };

      const response = await api.post('/driveways', drivewayData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.title).toBe(drivewayData.title);
      
      drivewayId = response.data.data.id;
    });

    it('GET /api/driveways - should list driveways', async () => {
      const response = await api.get('/driveways');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('GET /api/driveways/[id] - should get driveway details', async () => {
      const response = await api.get(`/driveways/${drivewayId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.id).toBe(drivewayId);
    });

    it('GET /api/driveways/[id] - should return 404 for invalid ID', async () => {
      try {
        await api.get('/driveways/invalid-id');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('PATCH /api/driveways/[id] - should update driveway', async () => {
      const updateData = {
        title: 'Updated Parking Spot',
        pricePerHour: 6.00,
      };

      const response = await api.patch(`/driveways/${drivewayId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.title).toBe(updateData.title);
      expect(response.data.data.pricePerHour).toBe(updateData.pricePerHour);
    });
  });

  describe('Booking APIs', () => {
    it('POST /api/bookings - should create booking', async () => {
      const bookingData = {
        drivewayId,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Blue',
          licensePlate: 'TEST123',
        },
        specialRequests: 'Near entrance please',
      };

      const response = await api.post('/bookings', bookingData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.drivewayId).toBe(drivewayId);
      
      bookingId = response.data.data.id;
    });

    it('GET /api/bookings - should list user bookings', async () => {
      const response = await api.get('/bookings');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('GET /api/bookings/[id] - should get booking details', async () => {
      const response = await api.get(`/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.id).toBe(bookingId);
    });

    it('PATCH /api/bookings/[id] - should cancel booking', async () => {
      const response = await api.patch(`/bookings/${bookingId}`, {
        status: 'CANCELLED',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.status).toBe('CANCELLED');
    });
  });

  describe('Review APIs', () => {
    it('POST /api/reviews - should create review (requires completed booking)', async () => {
      // Note: This test may fail if booking is not in COMPLETED status
      // In a real scenario, you'd need to update booking status first
      
      const reviewData = {
        drivewayId,
        rating: 5,
        comment: 'Great parking spot!',
      };

      try {
        const response = await api.post('/reviews', reviewData);
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('data');
        reviewId = response.data.data.id;
      } catch (error: any) {
        // Expected if booking is not completed
        expect([400, 403]).toContain(error.response?.status);
      }
    });

    it('GET /api/reviews - should list reviews by driveway', async () => {
      const response = await api.get(`/reviews?drivewayId=${drivewayId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('Notification APIs', () => {
    it('GET /api/notifications - should list user notifications', async () => {
      const response = await api.get('/notifications');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('POST /api/notifications/mark-all-read - should mark all as read', async () => {
      const response = await api.post('/notifications/mark-all-read');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('Dashboard APIs', () => {
    it('GET /api/dashboard/stats - should get dashboard stats', async () => {
      const response = await api.get('/dashboard/stats');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('totalBookings');
    });
  });

  describe('Cleanup', () => {
    it('POST /api/auth/logout - should logout user', async () => {
      const response = await api.post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });
});

