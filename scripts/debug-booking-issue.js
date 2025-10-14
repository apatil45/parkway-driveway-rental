require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function debugBookingIssue() {
  try {
    console.log('🔍 Debugging Booking Issue...\n');
    
    // Get driveways
    const drivewaysResponse = await axios.get(`${BASE_URL}/driveways`);
    const driveways = drivewaysResponse.data;
    
    console.log('📋 Available Driveways:');
    driveways.forEach((d, index) => {
      console.log(`\n${index + 1}. ${d.address}`);
      console.log(`   ID: ${d.id}`);
      console.log(`   Available: ${d.isAvailable}`);
      console.log(`   Availability: ${JSON.stringify(d.availability, null, 2)}`);
    });
    
    // Find a driveway with availability
    const drivewayWithAvailability = driveways.find(d => 
      d.availability && Array.isArray(d.availability) && d.availability.length > 0
    );
    
    if (!drivewayWithAvailability) {
      console.log('\n❌ No driveways with availability data found');
      return;
    }
    
    console.log(`\n🎯 Using driveway: ${drivewayWithAvailability.address}`);
    console.log(`   ID: ${drivewayWithAvailability.id}`);
    
    // Test different days
    const testDates = [
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    ];
    
    for (const testDate of testDates) {
      const dayOfWeek = testDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      console.log(`\n📅 Testing date: ${testDate.toDateString()} (${dayOfWeek})`);
      
      // Check if this day is available
      const dayAvailability = drivewayWithAvailability.availability.find(av => av.dayOfWeek === dayOfWeek);
      
      if (dayAvailability) {
        console.log(`   ✅ Day available: ${dayAvailability.isAvailable}`);
        console.log(`   ⏰ Time range: ${dayAvailability.startTime} - ${dayAvailability.endTime}`);
        
        // Try to create a booking for this day
        const startTime = new Date(testDate);
        startTime.setHours(10, 0, 0, 0); // 10:00 AM
        
        const endTime = new Date(testDate);
        endTime.setHours(12, 0, 0, 0); // 12:00 PM
        
        console.log(`   🕐 Booking time: ${startTime.toISOString()} to ${endTime.toISOString()}`);
        
        // Check if time is within availability
        const startTimeStr = startTime.toTimeString().slice(0, 5);
        const endTimeStr = endTime.toTimeString().slice(0, 5);
        
        console.log(`   ⏱️ Time strings: ${startTimeStr} - ${endTimeStr}`);
        
        if (startTimeStr >= dayAvailability.startTime && endTimeStr <= dayAvailability.endTime) {
          console.log(`   ✅ Time is within availability range`);
        } else {
          console.log(`   ❌ Time is outside availability range`);
        }
        
      } else {
        console.log(`   ❌ No availability data for ${dayOfWeek}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugBookingIssue();
