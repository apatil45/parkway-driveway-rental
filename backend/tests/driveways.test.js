// Driveway Tests for Parkway.com
const request = require('supertest');
const { app } = require('./setup');

describe('Driveway Endpoints', () => {
  let owner, ownerToken, driver, driverToken;

  beforeEach(async () => {
    owner = await global.testUtils.createTestUser({ role: 'owner' });
    ownerToken = global.testUtils.generateTestToken(owner);
    
    driver = await global.testUtils.createTestUser({ role: 'driver' });
    driverToken = global.testUtils.generateTestToken(driver);
  });

  describe('GET /api/driveways', () => {
    beforeEach(async () => {
      // Create test driveways
      await global.testUtils.createTestDriveway({
        title: 'Downtown Parking',
        price: 15.00,
        ownerId: owner.id
      });
      
      await global.testUtils.createTestDriveway({
        title: 'Airport Parking',
        price: 25.00,
        ownerId: owner.id
      });
    });

    it('should return all active driveways', async () => {
      const response = await request(app)
        .get('/api/driveways')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveways).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter driveways by price range', async () => {
      const response = await request(app)
        .get('/api/driveways?minPrice=20&maxPrice=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveways).toHaveLength(1);
      expect(response.body.data.driveways[0].title).toBe('Airport Parking');
    });

    it('should search driveways by text', async () => {
      const response = await request(app)
        .get('/api/driveways?search=downtown')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveways).toHaveLength(1);
      expect(response.body.data.driveways[0].title).toBe('Downtown Parking');
    });

    it('should filter by car size', async () => {
      const response = await request(app)
        .get('/api/driveways?carSize=medium')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveways.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/driveways?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveways).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/driveways/:id', () => {
    let driveway;

    beforeEach(async () => {
      driveway = await global.testUtils.createTestDriveway({
        title: 'Test Driveway',
        ownerId: owner.id
      });
    });

    it('should return driveway details', async () => {
      const response = await request(app)
        .get(`/api/driveways/${driveway.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveway.id).toBe(driveway.id);
      expect(response.body.data.driveway.title).toBe('Test Driveway');
      expect(response.body.data.driveway.owner).toBeDefined();
    });

    it('should return 404 for non-existent driveway', async () => {
      const response = await request(app)
        .get('/api/driveways/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/driveways', () => {
    const drivewayData = {
      title: 'New Test Driveway',
      description: 'A brand new test driveway',
      address: '456 New Street, New City, NC 54321',
      latitude: 41.8781,
      longitude: -87.6298,
      price: 12.50,
      capacity: 3,
      carSize: 'large',
      accessInstructions: 'Ring doorbell and wait',
      restrictions: 'No overnight parking'
    };

    it('should create driveway as owner', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/driveways').send(drivewayData),
        ownerToken
      ).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveway.title).toBe(drivewayData.title);
      expect(response.body.data.driveway.ownerId).toBe(owner.id);
    });

    it('should reject creation by non-owner', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/driveways').send(drivewayData),
        driverToken
      ).expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/driveways')
        .send(drivewayData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        title: 'Incomplete Driveway'
        // Missing required fields
      };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/driveways').send(incompleteData),
        ownerToken
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate price range', async () => {
      const invalidData = {
        ...drivewayData,
        price: -10 // Invalid negative price
      };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).post('/api/driveways').send(invalidData),
        ownerToken
      ).expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/driveways/:id', () => {
    let driveway;

    beforeEach(async () => {
      driveway = await global.testUtils.createTestDriveway({
        title: 'Original Title',
        ownerId: owner.id
      });
    });

    it('should update driveway as owner', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 20.00
      };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).put(`/api/driveways/${driveway.id}`).send(updateData),
        ownerToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveway.title).toBe('Updated Title');
      expect(response.body.data.driveway.price).toBe(20.00);
    });

    it('should reject update by non-owner', async () => {
      const updateData = { title: 'Hacked Title' };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).put(`/api/driveways/${driveway.id}`).send(updateData),
        driverToken
      ).expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject update of non-existent driveway', async () => {
      const updateData = { title: 'New Title' };

      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).put('/api/driveways/99999').send(updateData),
        ownerToken
      ).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/driveways/:id', () => {
    let driveway;

    beforeEach(async () => {
      driveway = await global.testUtils.createTestDriveway({
        ownerId: owner.id
      });
    });

    it('should delete driveway as owner', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).delete(`/api/driveways/${driveway.id}`),
        ownerToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify driveway is marked as inactive
      const getResponse = await request(app)
        .get(`/api/driveways/${driveway.id}`)
        .expect(404);
    });

    it('should reject deletion by non-owner', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).delete(`/api/driveways/${driveway.id}`),
        driverToken
      ).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/driveways/my/driveways', () => {
    beforeEach(async () => {
      await global.testUtils.createTestDriveway({
        title: 'Owner Driveway 1',
        ownerId: owner.id
      });
      
      await global.testUtils.createTestDriveway({
        title: 'Owner Driveway 2',
        ownerId: owner.id
      });
    });

    it('should return owner driveways', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).get('/api/driveways/my/driveways'),
        ownerToken
      ).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.driveways).toHaveLength(2);
    });

    it('should reject access by non-owner', async () => {
      const response = await global.testUtils.makeAuthenticatedRequest(
        request(app).get('/api/driveways/my/driveways'),
        driverToken
      ).expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
