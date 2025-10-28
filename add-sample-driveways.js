const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://aqjjgmmvviozmedjgxdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample driveways data
const sampleDriveways = [
  {
    address: "123 Main Street, New York, NY 10001",
    description: "Spacious driveway in Manhattan with easy access to major attractions",
    driveway_size: "Large",
    car_size_compatibility: "SUV, Sedan, Truck",
    price_per_hour: 15.00,
    availability: "24/7",
    amenities: ["Security Camera", "Lighting", "Easy Access"],
    images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500"],
    latitude: 40.7589,
    longitude: -73.9851,
    is_active: true,
    is_available: true
  },
  {
    address: "456 Park Avenue, New York, NY 10022",
    description: "Premium parking spot near Central Park",
    driveway_size: "Medium",
    car_size_compatibility: "Sedan, SUV",
    price_per_hour: 20.00,
    availability: "24/7",
    amenities: ["Covered", "Security", "Near Subway"],
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"],
    latitude: 40.7614,
    longitude: -73.9776,
    is_active: true,
    is_available: true
  },
  {
    address: "789 Broadway, New York, NY 10003",
    description: "Convenient downtown parking with 24/7 access",
    driveway_size: "Small",
    car_size_compatibility: "Sedan, Compact",
    price_per_hour: 12.00,
    availability: "24/7",
    amenities: ["Lighting", "Easy Access"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"],
    latitude: 40.7282,
    longitude: -73.9942,
    is_active: true,
    is_available: true
  },
  {
    address: "321 5th Avenue, New York, NY 10016",
    description: "Luxury parking in Midtown East",
    driveway_size: "Large",
    car_size_compatibility: "SUV, Sedan, Truck, Luxury",
    price_per_hour: 25.00,
    availability: "24/7",
    amenities: ["Valet Service", "Security Camera", "Covered", "Lighting"],
    images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500"],
    latitude: 40.7505,
    longitude: -73.9934,
    is_active: true,
    is_available: true
  },
  {
    address: "654 West 42nd Street, New York, NY 10036",
    description: "Times Square area parking with great accessibility",
    driveway_size: "Medium",
    car_size_compatibility: "Sedan, SUV, Van",
    price_per_hour: 18.00,
    availability: "24/7",
    amenities: ["Security", "Lighting", "Near Attractions"],
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"],
    latitude: 40.7580,
    longitude: -73.9855,
    is_active: true,
    is_available: true
  }
];

async function addSampleData() {
  try {
    console.log('🚀 Adding sample driveways to database...');
    
    // First, get a user ID to use as owner_id
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }
    
    const ownerId = users[0].id;
    console.log('✅ Using owner ID:', ownerId);
    
    // Add sample driveways
    const drivewaysWithOwner = sampleDriveways.map(driveway => ({
      ...driveway,
      owner_id: ownerId
    }));
    
    const { data, error } = await supabase
      .from('driveways')
      .insert(drivewaysWithOwner)
      .select();
    
    if (error) {
      console.error('❌ Error adding driveways:', error);
      return;
    }
    
    console.log('✅ Successfully added', data.length, 'sample driveways!');
    console.log('📋 Sample driveways added:');
    data.forEach((driveway, index) => {
      console.log(`   ${index + 1}. ${driveway.address} - $${driveway.price_per_hour}/hour`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addSampleData();
