const axios = require('axios');

async function testBookingClean() {
  try {
    console.log('🧹 Testing booking with clean database...\n');
    
    // Step 1: Register and login
    console.log('1️⃣ Registering user...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Clean Test User',
      email: `clean-${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver']
    });
    
    const token = registerResponse.data.token;
    const user = registerResponse.data.user;
    console.log('✅ User registered:', user.id);
    
    // Step 2: Get a different driveway (try the last one)
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
    
    // Use the last driveway (different from the first one)
    const driveway = searchResponse.data.driveways[searchResponse.data.driveways.length - 1];
    console.log('✅ Selected driveway:', {
      id: driveway.id,
      address: driveway.address,
      price: driveway.pricePerHour
    });
    
    // Step 3: Prepare booking data with very unique time slot
    console.log('\n3️⃣ Preparing booking data...');
    const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000); // 1 hour later
    
    const bookingData = {
      driveway_id: driveway.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      vehicle_info: { 
        make: 'Honda', 
        model: 'Civic',
        color: 'Red',
        license_plate: 'CLEAN123'
      },
      special_requests: 'Clean test booking'
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
      
      console.log('🎉 BOOKING CREATED SUCCESSFULLY!');
      console.log('📋 Booking details:', bookingResponse.data);
      
      // Test 5: Verify booking can be retrieved
      console.log('\n5️⃣ Testing booking retrieval...');
      const bookingsResponse = await axios.get('http://localhost:3000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Bookings retrieved:', bookingsResponse.data.bookings.length);
      if (bookingsResponse.data.bookings.length > 0) {
        console.log('✅ Latest booking:', {
          id: bookingsResponse.data.bookings[0].id,
          status: bookingsResponse.data.bookings[0].status,
          total_price: bookingsResponse.data.bookings[0].total_price,
          driveway_address: bookingsResponse.data.bookings[0].driveways?.address
        });
      }
      
      console.log('\n🎯 ALL TESTS PASSED! BOOKING SYSTEM IS WORKING!');
      return true;
      
    } catch (bookingError) {
      console.log('❌ Booking creation failed:');
      console.log('Status:', bookingError.response?.status);
      console.log('Error data:', bookingError.response?.data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

testBookingClean();
