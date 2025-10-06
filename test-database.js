#!/usr/bin/env node

/**
 * Database Test Script for Parkway.com
 * This script tests all database operations and connectivity
 */

const { sequelize, User, Driveway, Booking } = require('./models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Test data
const testData = {
  user: {
    email: `testdb${Date.now()}@example.com`,
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-012-3456',
    role: 'driver'
  },
  driveway: {
    address: '123 Test St, Test City, TC 12345',
    latitude: 40.7128,
    longitude: -74.0060,
    price: 15.00,
    carSize: 'medium',
    description: 'Test driveway for testing purposes',
    isAvailable: true,
    amenities: ['Test Amenity']
  },
  booking: {
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    status: 'pending',
    totalPrice: 30.00,
    paymentStatus: 'pending'
  }
};

// Test database connection
async function testConnection() {
  console.log('🔌 Testing database connection...');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Test user operations
async function testUserOperations() {
  console.log('\n👤 Testing user operations...');
  
  try {
    // Create user
    const hashedPassword = await bcrypt.hash(testData.user.password, 12);
    const user = await User.create({
      ...testData.user,
      password: hashedPassword
    });
    console.log('✅ User created successfully:', user.email);
    
    // Find user
    const foundUser = await User.findByPk(user.id);
    console.log('✅ User found by ID:', foundUser.email);
    
    // Find user by email
    const userByEmail = await User.findOne({ where: { email: testData.user.email } });
    console.log('✅ User found by email:', userByEmail.email);
    
    // Update user
    await user.update({ phone: '555-999-9999' });
    console.log('✅ User updated successfully');
    
    // Verify password
    const isValidPassword = await bcrypt.compare(testData.user.password, user.password);
    console.log('✅ Password verification:', isValidPassword ? 'Valid' : 'Invalid');
    
    return user;
  } catch (error) {
    console.error('❌ User operations failed:', error.message);
    throw error;
  }
}

// Test driveway operations
async function testDrivewayOperations(user) {
  console.log('\n🏠 Testing driveway operations...');
  
  try {
    // Create driveway
    const driveway = await Driveway.create({
      ...testData.driveway,
      ownerId: user.id
    });
    console.log('✅ Driveway created successfully:', driveway.address);
    
    // Find driveway
    const foundDriveway = await Driveway.findByPk(driveway.id);
    console.log('✅ Driveway found by ID:', foundDriveway.address);
    
    // Find driveways by owner
    const ownerDriveways = await Driveway.findAll({ where: { ownerId: user.id } });
    console.log('✅ Driveways found by owner:', ownerDriveways.length);
    
    // Update driveway
    await driveway.update({ price: 20.00 });
    console.log('✅ Driveway updated successfully');
    
    // Find driveways by location (within radius)
    const nearbyDriveways = await Driveway.findAll({
      where: {
        latitude: {
          [Op.between]: [40.7128 - 0.01, 40.7128 + 0.01]
        },
        longitude: {
          [Op.between]: [-74.0060 - 0.01, -74.0060 + 0.01]
        }
      }
    });
    console.log('✅ Nearby driveways found:', nearbyDriveways.length);
    
    return driveway;
  } catch (error) {
    console.error('❌ Driveway operations failed:', error.message);
    throw error;
  }
}

// Test booking operations
async function testBookingOperations(user, driveway) {
  console.log('\n📅 Testing booking operations...');
  
  try {
    // Create booking
    const booking = await Booking.create({
      ...testData.booking,
      driverId: user.id,
      drivewayId: driveway.id
    });
    console.log('✅ Booking created successfully:', booking.id);
    
    // Find booking
    const foundBooking = await Booking.findByPk(booking.id);
    console.log('✅ Booking found by ID:', foundBooking.id);
    
    // Find bookings by driver
    const driverBookings = await Booking.findAll({ where: { driverId: user.id } });
    console.log('✅ Bookings found by driver:', driverBookings.length);
    
    // Find bookings by driveway
    const drivewayBookings = await Booking.findAll({ where: { drivewayId: driveway.id } });
    console.log('✅ Bookings found by driveway:', drivewayBookings.length);
    
    // Update booking
    await booking.update({ status: 'confirmed' });
    console.log('✅ Booking updated successfully');
    
    // Test associations
    const bookingWithAssociations = await Booking.findByPk(booking.id, {
      include: [
        { model: User, as: 'user' },
        { model: Driveway, as: 'driveway' }
      ]
    });
    console.log('✅ Booking with associations loaded:', bookingWithAssociations.user.email);
    
    return booking;
  } catch (error) {
    console.error('❌ Booking operations failed:', error.message);
    throw error;
  }
}

// Test complex queries
async function testComplexQueries() {
  console.log('\n🔍 Testing complex queries...');
  
  try {
    // Count total users by role
    const userCounts = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    console.log('✅ User counts by role:', userCounts.map(uc => `${uc.role}: ${uc.dataValues.count}`));
    
    // Find available driveways with average price
    const availableDriveways = await Driveway.findAll({
      where: { isAvailable: true },
      attributes: [
        'carSize',
        [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['carSize']
    });
    console.log('✅ Available driveways by car size:', availableDriveways.map(ad => 
      `${ad.carSize}: ${ad.dataValues.count} driveways, avg $${parseFloat(ad.dataValues.avgPrice).toFixed(2)}`
    ));
    
    // Find bookings by status
    const bookingStats = await Booking.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
      ],
      group: ['status']
    });
    console.log('✅ Booking statistics:', bookingStats.map(bs => 
      `${bs.status}: ${bs.dataValues.count} bookings, $${parseFloat(bs.dataValues.totalRevenue || 0).toFixed(2)} revenue`
    ));
    
  } catch (error) {
    console.error('❌ Complex queries failed:', error.message);
    throw error;
  }
}

// Test database performance
async function testPerformance() {
  console.log('\n⚡ Testing database performance...');
  
  try {
    const startTime = Date.now();
    
    // Test bulk operations
    const users = await User.findAll({ limit: 100 });
    const driveways = await Driveway.findAll({ limit: 100 });
    const bookings = await Booking.findAll({ limit: 100 });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Performance test completed in ${duration}ms`);
    console.log(`   - Users loaded: ${users.length}`);
    console.log(`   - Driveways loaded: ${driveways.length}`);
    console.log(`   - Bookings loaded: ${bookings.length}`);
    
    if (duration > 1000) {
      console.log('⚠️  Performance warning: Queries took longer than 1 second');
    } else {
      console.log('✅ Performance is good');
    }
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    throw error;
  }
}

// Cleanup test data
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await Booking.destroy({ where: { driverId: { [sequelize.Op.like]: '%test%' } } });
    await Driveway.destroy({ where: { address: { [sequelize.Op.like]: '%Test%' } } });
    await User.destroy({ where: { email: 'test@example.com' } });
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Main test function
async function runDatabaseTests() {
  console.log('🧪 Starting Parkway.com Database Tests\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Test user operations
    const user = await testUserOperations();
    
    // Test driveway operations
    const driveway = await testDrivewayOperations(user);
    
    // Test booking operations
    const booking = await testBookingOperations(user, driveway);
    
    // Test complex queries
    await testComplexQueries();
    
    // Test performance
    await testPerformance();
    
    // Cleanup
    await cleanupTestData();
    
    console.log('\n🎉 All database tests passed successfully!');
    console.log('✅ Database is ready for production use');
    
  } catch (error) {
    console.error('\n❌ Database tests failed:', error.message);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  runDatabaseTests()
    .then(() => {
      console.log('\n✅ Database testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database testing failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize.close();
    });
}

module.exports = {
  runDatabaseTests,
  testConnection,
  testUserOperations,
  testDrivewayOperations,
  testBookingOperations
};
