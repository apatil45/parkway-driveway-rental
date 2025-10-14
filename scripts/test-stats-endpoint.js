require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testStatsEndpoint() {
  try {
    console.log('🔍 Testing Statistics Endpoint...\n');
    
    // First login to get a token
    const loginResult = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testdriver@example.com',
      password: 'testpassword123'
    });
    
    const token = loginResult.data.token;
    const userId = loginResult.data.user.id;
    
    console.log('✅ Login successful');
    console.log('   User ID:', userId);
    console.log('   Token:', token.substring(0, 20) + '...');
    
    // Test statistics endpoint
    const statsResult = await axios.get(`${BASE_URL}/bookings/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Statistics endpoint successful');
    console.log('   Stats:', JSON.stringify(statsResult.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Status:', error.response.status);
    }
  }
}

testStatsEndpoint();
