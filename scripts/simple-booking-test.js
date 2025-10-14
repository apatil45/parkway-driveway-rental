require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function simpleTest() {
  try {
    console.log('🔍 Simple Booking Test...\n');
    
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testdriver@example.com',
      password: 'testpassword123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    console.log('   Token:', token.substring(0, 20) + '...');
    
    // Test driveways
    console.log('\n2. Testing driveways...');
    const drivewaysResponse = await axios.get(`${BASE_URL}/driveways`);
    console.log('✅ Driveways retrieved:', drivewaysResponse.data.length);
    
    if (drivewaysResponse.data.length > 0) {
      // Find a driveway with availability data
      const drivewayWithAvailability = drivewaysResponse.data.find(d => 
        d.availability && Array.isArray(d.availability) && d.availability.length >= 7
      );
      
      const driveway = drivewayWithAvailability || drivewaysResponse.data[0];
      console.log('   Using driveway:', driveway.address);
      console.log('   Has availability data:', !!(driveway.availability && driveway.availability.length > 0));
      
      // Test booking creation
      console.log('\n3. Testing booking creation...');
      const bookingData = {
        driveway: driveway.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        totalAmount: 25.00
      };
      
      const bookingResponse = await axios.post(`${BASE_URL}/bookings`, bookingData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Booking created:', bookingResponse.data.booking.id);
      
      // Test booking retrieval
      console.log('\n4. Testing booking retrieval...');
      const getBookingResponse = await axios.get(`${BASE_URL}/bookings/${bookingResponse.data.booking.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Booking retrieved:', getBookingResponse.data.id);
      
      // Test booking stats
      console.log('\n5. Testing booking stats...');
      const statsResponse = await axios.get(`${BASE_URL}/bookings/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Stats retrieved:', JSON.stringify(statsResponse.data, null, 2));
      
    } else {
      console.log('❌ No driveways found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Status:', error.response.status);
    }
  }
}

simpleTest();
