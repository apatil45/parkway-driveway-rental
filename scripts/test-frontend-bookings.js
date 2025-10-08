require('dotenv').config();
const axios = require('axios');

const testFrontendBookings = async () => {
  try {
    console.log('🧪 Testing frontend booking API calls...');
    
    // First, let's register a test user
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
    console.log('✅ Token:', token.substring(0, 20) + '...');
    
    // Test the exact API calls the frontend makes
    console.log('2. Testing driver bookings API call...');
    try {
      const response = await axios.get(`http://localhost:3000/api/bookings/driver/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Driver bookings response status:', response.status);
      console.log('✅ Driver bookings response data:', response.data);
    } catch (error) {
      console.error('❌ Driver bookings API call failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Headers:', error.response?.headers);
    }
    
    console.log('3. Testing owner bookings API call...');
    try {
      const response = await axios.get(`http://localhost:3000/api/bookings/owner/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Owner bookings response status:', response.status);
      console.log('✅ Owner bookings response data:', response.data);
    } catch (error) {
      console.error('❌ Owner bookings API call failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Headers:', error.response?.headers);
    }
    
    // Test with a booking to see if it shows up
    console.log('4. Creating a test booking...');
    try {
      // First create a driveway owner
      const ownerResponse = await axios.post('http://localhost:3000/api/auth/register', {
        name: 'Test Owner',
        email: `testowner${Date.now()}@example.com`,
        password: 'password123',
        roles: ['owner']
      });
      
      const ownerToken = ownerResponse.data.token;
      const ownerId = ownerResponse.data.user.id;
      console.log('✅ Owner created, ID:', ownerId);
      
      // Create a driveway
      const drivewayResponse = await axios.post('http://localhost:3000/api/driveways', {
        address: '123 Test Street',
        description: 'Test driveway for booking',
        pricePerHour: 10,
        drivewaySize: 'medium',
        amenities: ['Test'],
        availability: [{
          dayOfWeek: 'monday',
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00'
        }],
        images: [],
        isAvailable: true
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      const drivewayId = drivewayResponse.data.driveway.id;
      console.log('✅ Driveway created, ID:', drivewayId);
      
      // Now create a booking as the driver (next Monday)
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
      nextMonday.setHours(10, 0, 0, 0); // Set to 10:00 AM
      
      const startTime = nextMonday.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      const endTime = new Date(nextMonday.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16); // 2 hours later
      
      const bookingResponse = await axios.post('http://localhost:3000/api/bookings', {
        driveway: drivewayId,
        startTime: startTime,
        endTime: endTime,
        totalAmount: 20
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Booking created:', bookingResponse.data);
      
      // Now test the endpoints again
      console.log('5. Testing endpoints with booking data...');
      
      const driverBookingsResponse = await axios.get(`http://localhost:3000/api/bookings/driver/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Driver bookings with data:', driverBookingsResponse.data);
      
      const ownerBookingsResponse = await axios.get(`http://localhost:3000/api/bookings/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      console.log('✅ Owner bookings with data:', ownerBookingsResponse.data);
      
    } catch (error) {
      console.error('❌ Booking creation failed:', error.response?.data || error.message);
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

testFrontendBookings();
