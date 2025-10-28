const axios = require('axios');

async function debugBooking() {
  try {
    // Register and login
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Booking Test User',
      email: `booking-${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver']
    });
    
    const token = registerResponse.data.token;
    console.log('✅ User registered and logged in');
    
    // Get a driveway
    const searchResponse = await axios.get('http://localhost:3000/api/driveways/search', {
      params: {
        latitude: 40.7178,
        longitude: -74.0431,
        radius: 1000
      }
    });
    
    console.log('✅ Found driveways:', searchResponse.data.driveways.length);
    
    if (searchResponse.data.driveways.length > 0) {
      const driveway = searchResponse.data.driveways[0];
      console.log('✅ Selected driveway:', driveway.id, driveway.address);
      
      // Try to create booking
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      
      console.log('📅 Booking times:', {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      });
      
      const bookingResponse = await axios.post('http://localhost:3000/api/bookings', {
        driveway_id: driveway.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        vehicle_info: { make: 'Toyota', model: 'Camry' },
        special_requests: 'Test booking'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Booking created successfully:', bookingResponse.data);
      
    } else {
      console.log('❌ No driveways available for booking test');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

debugBooking();
