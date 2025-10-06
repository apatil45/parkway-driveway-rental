// Test Setup for Parkway.com Backend
const { sequelize } = require('../../models');
const app = require('../../production-server');

// Test database configuration
const testConfig = {
  database: process.env.TEST_DATABASE_URL || 'sqlite::memory:',
  logging: false,
  dialect: 'sqlite',
  storage: ':memory:'
};

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  // Initialize test database
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  
  console.log('✅ Test database initialized');
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await sequelize.close();
  console.log('✅ Test database closed');
});

// Clean up after each test
afterEach(async () => {
  // Clear all tables
  await sequelize.truncate({ cascade: true });
});

// Test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const { User } = require('../models');
    const defaultUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890',
      role: 'driver',
      ...userData
    };
    
    return await User.create(defaultUser);
  },

  // Create test driveway
  createTestDriveway: async (drivewayData = {}) => {
    const { Driveway, User } = require('../models');
    
    // Create owner if not provided
    let owner = drivewayData.ownerId ? 
      await User.findByPk(drivewayData.ownerId) : 
      await global.testUtils.createTestUser({ role: 'owner' });
    
    const defaultDriveway = {
      title: 'Test Driveway',
      description: 'A test driveway for testing purposes',
      address: '123 Test Street, Test City, TC 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      price: 10.00,
      capacity: 2,
      carSize: 'medium',
      ownerId: owner.id,
      ...drivewayData
    };
    
    return await Driveway.create(defaultDriveway);
  },

  // Create test booking
  createTestBooking: async (bookingData = {}) => {
    const { Booking, User, Driveway } = require('../models');
    
    // Create user and driveway if not provided
    let user = bookingData.userId ? 
      await User.findByPk(bookingData.userId) : 
      await global.testUtils.createTestUser();
    
    let driveway = bookingData.drivewayId ? 
      await Driveway.findByPk(bookingData.drivewayId) : 
      await global.testUtils.createTestDriveway();
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);
    
    const defaultBooking = {
      startTime,
      endTime,
      totalPrice: 20.00,
      status: 'pending',
      userId: user.id,
      drivewayId: driveway.id,
      ...bookingData
    };
    
    return await Booking.create(defaultBooking);
  },

  // Generate JWT token for testing
  generateTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Make authenticated request
  makeAuthenticatedRequest: (request, token) => {
    return request.set('Authorization', `Bearer ${token}`);
  },

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

module.exports = {
  app,
  sequelize,
  testConfig
};
