const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Application Flow...\n');
  
  try {
    // Step 1: Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver']
    });
    
    console.log('✅ Registration successful:', registerResponse.data.msg);
    const token = registerResponse.data.token;
    const user = registerResponse.data.user;
    
    // Step 2: Test JWT structure
    console.log('\n2️⃣ Testing JWT structure...');
    const decoded = jwt.decode(token);
    console.log('JWT payload structure:', JSON.stringify(decoded, null, 2));
    
    if (decoded.user && decoded.user.id) {
      console.log('✅ JWT structure is correct for middleware');
    } else {
      console.log('❌ JWT structure issue detected');
    }
    
    // Step 3: Test search endpoint
    console.log('\n3️⃣ Testing search endpoint...');
    const searchResponse = await axios.get('http://localhost:3000/api/driveways/search', {
      params: {
        latitude: 40.7178,
        longitude: -74.0431,
        radius: 1000
      }
    });
    
    console.log('✅ Search successful:', searchResponse.data.success);
    console.log('✅ Driveways found:', searchResponse.data.driveways.length);
    
    if (searchResponse.data.driveways.length > 0) {
      const driveway = searchResponse.data.driveways[0];
      console.log('✅ First driveway has coordinates:', !!driveway.coordinates);
      console.log('✅ First driveway has lat/lng:', !!driveway.latitude && !!driveway.longitude);
    }
    
    // Step 4: Test booking creation
    console.log('\n4️⃣ Testing booking creation...');
    if (searchResponse.data.driveways.length > 0) {
      const driveway = searchResponse.data.driveways[0];
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      
      try {
        const bookingResponse = await axios.post('http://localhost:3000/api/bookings', {
          driveway_id: driveway.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          vehicle_info: { make: 'Toyota', model: 'Camry' },
          special_requests: 'Test booking'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Booking creation successful:', bookingResponse.data.success);
        console.log('✅ Booking ID:', bookingResponse.data.booking.id);
        
      } catch (bookingError) {
        console.log('❌ Booking creation failed:', bookingError.response?.data?.error || bookingError.message);
        console.log('Status:', bookingError.response?.status);
        console.log('Headers:', bookingError.response?.headers);
      }
    }
    
    // Step 5: Test user info endpoint
    console.log('\n5️⃣ Testing user info endpoint...');
    try {
      const userResponse = await axios.get('http://localhost:3000/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User info retrieval successful');
      console.log('✅ User data:', userResponse.data);
    } catch (userError) {
      console.log('❌ User info retrieval failed:', userError.response?.data?.msg || userError.message);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testCompleteFlow();
