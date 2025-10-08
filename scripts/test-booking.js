require('dotenv').config();
const axios = require('axios');

const testBooking = async () => {
  try {
    console.log('🧪 Testing booking endpoint...');
    
    // First, let's register a driveway owner
    console.log('1. Registering driveway owner...');
    const ownerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Test Owner',
      email: `testowner${Date.now()}@example.com`,
      password: 'password123',
      roles: ['owner']
    });
    
    const ownerToken = ownerResponse.data.token;
    console.log('✅ Owner registered, token:', ownerToken.substring(0, 20) + '...');
    
    // Create a test driveway
    console.log('2. Creating test driveway...');
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
    
    // Now register a driver
    console.log('3. Registering test driver...');
    const driverResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Test Driver',
      email: `testdriver${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver']
    });
    
    const driverToken = driverResponse.data.token;
    console.log('✅ Driver registered, token:', driverToken.substring(0, 20) + '...');
    
    // Now test booking
    console.log('4. Testing booking creation...');
    // Find next Monday
    const today = new Date();
    const daysUntilMonday = (1 - today.getDay() + 7) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextMonday.setHours(10, 0, 0, 0); // Set to 10:00 AM
    
    const startTime = nextMonday.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    const endTime = new Date(nextMonday.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16); // 2 hours later
    
    const bookingData = {
      driveway: drivewayId,
      startTime: startTime,
      endTime: endTime,
      totalAmount: 20
    };
    
    console.log('Booking data:', bookingData);
    
    const bookingResponse = await axios.post('http://localhost:3000/api/bookings', bookingData, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    
    console.log('✅ Booking created successfully!');
    console.log('Booking response:', bookingResponse.data);
    
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

testBooking();
