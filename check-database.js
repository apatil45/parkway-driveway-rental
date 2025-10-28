const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://aqjjgmmvviozmedjgxdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...');
    
    // Check users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, roles')
      .limit(5);
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
    } else {
      console.log('✅ Users found:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('   Sample user:', users[0]);
      }
    }
    
    // Check driveways
    const { data: driveways, error: drivewayError } = await supabase
      .from('driveways')
      .select('id, address, price_per_hour, latitude, longitude, is_active, is_available')
      .limit(5);
    
    if (drivewayError) {
      console.error('❌ Error fetching driveways:', drivewayError);
    } else {
      console.log('✅ Driveways found:', driveways?.length || 0);
      if (driveways && driveways.length > 0) {
        console.log('   Sample driveway:', driveways[0]);
      }
    }
    
    // Check bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, driveway_id, status, total_price')
      .limit(5);
    
    if (bookingError) {
      console.error('❌ Error fetching bookings:', bookingError);
    } else {
      console.log('✅ Bookings found:', bookings?.length || 0);
      if (bookings && bookings.length > 0) {
        console.log('   Sample booking:', bookings[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkDatabase();
