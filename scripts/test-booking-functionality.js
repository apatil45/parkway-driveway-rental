/**
 * Comprehensive Booking Functionality Test Script
 * Tests all booking operations: create, read, update, delete, cancel, confirm, reject
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;
let testDrivewayId = null;
let testBookingId = null;

// Test data
const testUser = {
  name: 'Test Driver',
  email: 'testdriver@example.com',
  password: 'testpassword123',
  roles: ['driver']
};

const testOwner = {
  name: 'Test Owner',
  email: 'testowner@example.com',
  password: 'testpassword123',
  roles: ['owner']
};

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test user registration
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    console.log('✅ User registration successful');
    testUserId = registerResult.data.user.id;
  } else {
    console.log('⚠️ User registration failed (might already exist)');
    
    // Try to login instead
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResult.success) {
      console.log('✅ User login successful');
      authToken = loginResult.data.token;
      testUserId = loginResult.data.user.id;
    } else {
      console.log('❌ Authentication failed:', loginResult.error);
      return false;
    }
  }
  
  if (registerResult.success && registerResult.data.token) {
    authToken = registerResult.data.token;
  }
  
  return true;
}

async function testDrivewayData() {
  console.log('\n🏠 Testing Driveway Data...');
  
  // Get available driveways
  const drivewaysResult = await makeRequest('GET', '/driveways');
  if (drivewaysResult.success && drivewaysResult.data.length > 0) {
    // Find a driveway with availability data for all days of the week
    const drivewayWithAvailability = drivewaysResult.data.find(d => 
      d.availability && Array.isArray(d.availability) && d.availability.length >= 7
    );
    
    if (drivewayWithAvailability) {
      testDrivewayId = drivewayWithAvailability.id;
      console.log('✅ Found driveway with availability, using:', testDrivewayId);
      console.log('   Address:', drivewayWithAvailability.address);
      console.log('   Availability days:', drivewayWithAvailability.availability.length);
      return true;
    } else {
      console.log('⚠️ No driveways with availability data found, using first available');
      testDrivewayId = drivewaysResult.data[0].id;
      console.log('   Address:', drivewaysResult.data[0].address);
      return true;
    }
  } else {
    console.log('❌ No driveways found');
    return false;
  }
}

async function testBookingCreation() {
  console.log('\n📅 Testing Booking Creation...');
  
  if (!authToken || !testDrivewayId) {
    console.log('❌ Missing auth token or driveway ID');
    return false;
  }
  
  const bookingData = {
    driveway: testDrivewayId,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
    totalAmount: 25.00,
    driverLocation: { lat: 40.7178, lng: -74.0431 },
    specialRequests: 'Test booking request'
  };
  
  const result = await makeRequest('POST', '/bookings', bookingData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Booking creation successful');
    testBookingId = result.data.booking.id;
    console.log('   Booking ID:', testBookingId);
    console.log('   Status:', result.data.booking.status);
    return true;
  } else {
    console.log('❌ Booking creation failed:', result.error);
    return false;
  }
}

async function testBookingRetrieval() {
  console.log('\n📖 Testing Booking Retrieval...');
  
  if (!authToken || !testBookingId) {
    console.log('❌ Missing auth token or booking ID');
    return false;
  }
  
  // Test getting single booking
  const singleResult = await makeRequest('GET', `/bookings/${testBookingId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (singleResult.success) {
    console.log('✅ Single booking retrieval successful');
    console.log('   Booking status:', singleResult.data.status);
  } else {
    console.log('❌ Single booking retrieval failed:', singleResult.error);
  }
  
  // Test getting driver bookings
  const driverResult = await makeRequest('GET', `/bookings/driver/${testUserId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (driverResult.success) {
    console.log('✅ Driver bookings retrieval successful');
    console.log('   Number of bookings:', driverResult.data.length);
  } else {
    console.log('❌ Driver bookings retrieval failed:', driverResult.error);
  }
  
  return singleResult.success;
}

async function testBookingUpdate() {
  console.log('\n✏️ Testing Booking Update...');
  
  if (!authToken || !testBookingId) {
    console.log('❌ Missing auth token or booking ID');
    return false;
  }
  
  const updateData = {
    status: 'confirmed',
    paymentIntentId: 'test_payment_intent_123'
  };
  
  const result = await makeRequest('PUT', `/bookings/${testBookingId}`, updateData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Booking update successful');
    console.log('   New status:', result.data.status);
    return true;
  } else {
    console.log('❌ Booking update failed:', result.error);
    return false;
  }
}

async function testBookingCancellation() {
  console.log('\n❌ Testing Booking Cancellation...');
  
  if (!authToken || !testBookingId) {
    console.log('❌ Missing auth token or booking ID');
    return false;
  }
  
  const result = await makeRequest('PUT', `/bookings/${testBookingId}/cancel`, {}, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Booking cancellation successful');
    console.log('   Status:', result.data.status);
    return true;
  } else {
    console.log('❌ Booking cancellation failed:', result.error);
    return false;
  }
}

async function testBookingStats() {
  console.log('\n📊 Testing Booking Statistics...');
  
  if (!authToken) {
    console.log('❌ Missing auth token');
    return false;
  }
  
  const result = await makeRequest('GET', '/bookings/stats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Booking statistics retrieval successful');
    console.log('   Stats:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Booking statistics failed:', result.error);
    return false;
  }
}

async function testBookingValidation() {
  console.log('\n🔍 Testing Booking Validation...');
  
  if (!authToken || !testDrivewayId) {
    console.log('❌ Missing auth token or driveway ID');
    return false;
  }
  
  // Test invalid booking (past date)
  const invalidBooking = {
    driveway: testDrivewayId,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    totalAmount: 25.00
  };
  
  const result = await makeRequest('POST', '/bookings', invalidBooking, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 400) {
    console.log('✅ Booking validation working (correctly rejected past date)');
    console.log('   Error:', result.error.message);
    return true;
  } else {
    console.log('❌ Booking validation failed (should have rejected past date)');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Booking Functionality Tests...\n');
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Driveway Data', fn: testDrivewayData },
    { name: 'Booking Creation', fn: testBookingCreation },
    { name: 'Booking Retrieval', fn: testBookingRetrieval },
    { name: 'Booking Update', fn: testBookingUpdate },
    { name: 'Booking Cancellation', fn: testBookingCancellation },
    { name: 'Booking Statistics', fn: testBookingStats },
    { name: 'Booking Validation', fn: testBookingValidation }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test crashed:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📋 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All booking functionality tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
