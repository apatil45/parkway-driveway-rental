require('dotenv').config();
const axios = require('axios');

const testBookings = async () => {
  try {
    console.log('🧪 Testing booking endpoints...');
    
    // First, let's register a test user with both roles
    console.log('1. Registering test user...');
    const userResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver', 'owner']
    });
    
    const token = userResponse.data.token;
    const userId = userResponse.data.user.id;
    console.log('✅ User registered, ID:', userId);
    
    // Test driver bookings endpoint
    console.log('2. Testing driver bookings endpoint...');
    try {
      const driverBookingsResponse = await axios.get(`http://localhost:3000/api/bookings/driver/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Driver bookings endpoint working:', driverBookingsResponse.data);
    } catch (error) {
      console.error('❌ Driver bookings endpoint failed:', error.response?.data || error.message);
    }
    
    // Test owner bookings endpoint
    console.log('3. Testing owner bookings endpoint...');
    try {
      const ownerBookingsResponse = await axios.get(`http://localhost:3000/api/bookings/owner/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Owner bookings endpoint working:', ownerBookingsResponse.data);
    } catch (error) {
      console.error('❌ Owner bookings endpoint failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testBookings();
