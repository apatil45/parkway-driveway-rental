// Booking Tests for Parkway.com
const request = require('supertest');
const { app } = require('./setup');

describe('Booking Endpoints', () => {
  let owner, ownerToken, driver, driverToken, driveway;

  beforeEach(async () => {
    owner = await global.testUtils.createTestUser({ role: 'owner' });
    ownerToken = global.testUtils.generateTestToken(owner);
    
    driver = await global.testUtils.createTestUser({ role: 'driver' });
    driverToken = global.testUtils.generateTestToken(driver);
    
    driveway = await global.testUtils.createTestDriveway({
      ownerId: owner.id
    });
  });

  describe('GET /api/bookings/my', () => {
    beforeEach(async () => {
      await global.testUtils.createTestBooking({
        userId: driver.id,
        drivewayId: driveway.id
      });
    });

    it('should return user bookings', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).get('/api/bookings/my'),
        driverToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].user.id).toBe(driver.id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bookings/my')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/bookings', () => {
    const bookingData = {
      drivewayId: null, // Will be set in tests
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      specialInstructions: 'Please leave key under mat'
    };

    it('should create booking successfully', async () => {
      const data = { ...bookingData, drivewayId: driveway.id };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/bookings').send(data),
        driverToken
      ).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.userId).toBe(driver.id);
      expect(response.body.data.booking.drivewayId).toBe(driveway.id);
      expect(response.body.data.booking.status).toBe('pending');
    });

    it('should reject booking with invalid time range', async () => {
      const data = {
        ...bookingData,
        drivewayId: driveway.id,
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()  // 2 hours from now (invalid)
      };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/bookings').send(data),
        driverToken
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('End time must be after start time');
    });

    it('should reject booking in the past', async () => {
      const data = {
        ...bookingData,
        drivewayId: driveway.id,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()   // 1 hour ago
      };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/bookings').send(data),
        driverToken
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('future');
    });

    it('should reject booking for non-existent driveway', async () => {
      const data = { ...bookingData, drivewayId: 99999 };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/bookings').send(data),
        driverToken
      ).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should reject booking for unavailable driveway', async () => {
      // Make driveway unavailable
      await driveway.update({ isAvailable: false });

      const data = { ...bookingData, drivewayId: driveway.id };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/bookings').send(data),
        driverToken
      ).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not available');
    });

    it('should reject conflicting bookings', async () => {
      // Create existing booking
      await global.testUtils.createTestBooking({
        userId: driver.id,
        drivewayId: driveway.id,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
      });

      // Try to create conflicting booking
      const data = {
        ...bookingData,
        drivewayId: driveway.id,
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // Overlaps
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/bookings').send(data),
        driverToken
      ).expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already booked');
    });

    it('should require authentication', async () => {
      const data = { ...bookingData, drivewayId: driveway.id };

      const response = await request(app)
        .post('/api/bookings')
        .send(data)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/bookings/:id/status', () => {
    let booking;

    beforeEach(async () => {
      booking = await global.testUtils.createTestBooking({
        userId: driver.id,
        drivewayId: driveway.id
      });
    });

    it('should update booking status', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch(`/api/bookings/${booking.id}/status`).send({ status: 'confirmed' }),
        driverToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('confirmed');
    });

    it('should reject invalid status', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch(`/api/bookings/${booking.id}/status`).send({ status: 'invalid' }),
        driverToken
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status');
    });

    it('should reject update of non-existent booking', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch('/api/bookings/99999/status').send({ status: 'confirmed' }),
        driverToken
      ).expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject update by different user', async () => {
      const otherDriver = await global.testUtils.createTestUser({ role: 'driver' });
      const otherToken = global.testUtils.generateTestToken(otherDriver);

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch(`/api/bookings/${booking.id}/status`).send({ status: 'confirmed' }),
        otherToken
      ).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    let booking;

    beforeEach(async () => {
      booking = await global.testUtils.createTestBooking({
        userId: driver.id,
        drivewayId: driveway.id
      });
    });

    it('should cancel booking successfully', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch(`/api/bookings/${booking.id}/cancel`).send({ reason: 'Change of plans' }),
        driverToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('cancelled');
      expect(response.body.data.booking.cancelledAt).toBeDefined();
    });

    it('should reject cancellation of already cancelled booking', async () => {
      // Cancel the booking first
      await booking.update({ status: 'cancelled' });

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch(`/api/bookings/${booking.id}/cancel`).send({ reason: 'Another reason' }),
        driverToken
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already cancelled');
    });

    it('should reject cancellation of completed booking', async () => {
      // Complete the booking
      await booking.update({ status: 'completed' });

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).patch(`/api/bookings/${booking.id}/cancel`).send({ reason: 'Too late' }),
        driverToken
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot cancel completed');
    });
  });

  describe('GET /api/bookings/owner', () => {
    beforeEach(async () => {
      await global.testUtils.createTestBooking({
        userId: driver.id,
        drivewayId: driveway.id
      });
    });

    it('should return owner bookings', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).get('/api/bookings/owner'),
        ownerToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].driveway.ownerId).toBe(owner.id);
    });

    it('should reject access by non-owner', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).get('/api/bookings/owner'),
        driverToken
      ).expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
