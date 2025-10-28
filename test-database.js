const { supabase } = require('./models/supabase');

async function testDatabase() {
  console.log('🔍 Testing database connection and schema...\n');
  
  try {
    // Test 1: Check if driveways table exists and has data
    console.log('1️⃣ Testing driveways table...');
    const { data: driveways, error: drivewaysError } = await supabase
      .from('driveways')
      .select('id, address, price_per_hour, latitude, longitude, is_available')
      .limit(1);
    
    if (drivewaysError) {
      console.log('❌ Driveways table error:', drivewaysError);
    } else {
      console.log('✅ Driveways table working:', driveways.length > 0 ? 'Has data' : 'Empty');
      if (driveways.length > 0) {
        console.log('Sample driveway:', driveways[0]);
      }
    }
    
    // Test 2: Check if bookings table exists
    console.log('\n2️⃣ Testing bookings table...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);
    
    if (bookingsError) {
      console.log('❌ Bookings table error:', bookingsError);
    } else {
      console.log('✅ Bookings table working:', bookings.length > 0 ? 'Has data' : 'Empty');
    }
    
    // Test 3: Test inserting a simple booking
    console.log('\n3️⃣ Testing booking insertion...');
    const testBooking = {
      user_id: '00000000-0000-0000-0000-000000000001', // Test user ID
      driveway_id: driveways[0]?.id || 'e2628eb2-dcb3-4311-aa35-5f83f3781cb2',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      total_price: 30.00,
      payment_status: 'pending',
      payment_intent_id: null,
      vehicle_info: { make: 'Test', model: 'Car' },
      special_requests: 'Test booking'
    };
    
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([testBooking])
      .select();
    
    if (insertError) {
      console.log('❌ Booking insertion error:', insertError);
      console.log('Error details:', insertError.details);
      console.log('Error hint:', insertError.hint);
    } else {
      console.log('✅ Booking insertion successful:', newBooking[0].id);
      
      // Clean up test booking
      await supabase
        .from('bookings')
        .delete()
        .eq('id', newBooking[0].id);
      console.log('✅ Test booking cleaned up');
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
}

testDatabase();
