const axios = require('axios');

async function debugBookingDetailed() {
  try {
    console.log('🔍 Starting detailed booking debug...\n');
    
    // Step 1: Register and login
    console.log('1️⃣ Registering user...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Detailed Debug User',
      email: `detailed-${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver']
    });
    
    const token = registerResponse.data.token;
    const user = registerResponse.data.user;
    console.log('✅ User registered:', user.id);
    
    // Step 2: Get a driveway
    console.log('\n2️⃣ Getting driveways...');
    const searchResponse = await axios.get('http://localhost:3000/api/driveways/search', {
      params: {
        latitude: 40.7178,
        longitude: -74.0431,
        radius: 1000
      }
    });
    
    console.log('✅ Found driveways:', searchResponse.data.driveways.length);
    
    if (searchResponse.data.driveways.length === 0) {
      console.log('❌ No driveways available');
      return;
    }
    
    const driveway = searchResponse.data.driveways[0];
    console.log('✅ Selected driveway:', {
      id: driveway.id,
      address: driveway.address,
      price: driveway.pricePerHour
    });
    
    // Step 3: Prepare booking data
    console.log('\n3️⃣ Preparing booking data...');
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const bookingData = {
      driveway_id: driveway.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      vehicle_info: { 
        make: 'Toyota', 
        model: 'Camry',
        color: 'Blue',
        license_plate: 'ABC123'
      },
      special_requests: 'Test booking for debugging'
    };
    
    console.log('📅 Booking data:', {
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
      driveway_id: bookingData.driveway_id
    });
    
    // Step 4: Test booking creation
    console.log('\n4️⃣ Creating booking...');
    try {
      const bookingResponse = await axios.post('http://localhost:3000/api/bookings', bookingData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Booking created successfully!');
      console.log('📋 Booking details:', bookingResponse.data);
      
    } catch (bookingError) {
      console.log('❌ Booking creation failed:');
      console.log('Status:', bookingError.response?.status);
      console.log('Error data:', bookingError.response?.data);
      
      if (bookingError.response?.data?.error) {
        console.log('Error message:', bookingError.response.data.error);
      }
      
      // Try to get more details from the error
      if (bookingError.response?.data?.details) {
        console.log('Error details:', bookingError.response.data.details);
      }
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

debugBookingDetailed();
