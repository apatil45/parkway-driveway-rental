#!/usr/bin/env node

/**
 * Database Seeding Script for Parkway.com
 * This script populates the database with initial data for development and testing
 */

const bcrypt = require('bcryptjs');
const { sequelize, User, Driveway, Booking } = require('../models');

// Seed data
const seedData = {
  users: [
    {
      email: 'admin@parkway.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-000-0001',
      role: 'admin'
    },
    {
      email: 'driver@parkway.com',
      password: 'driver123',
      firstName: 'John',
      lastName: 'Driver',
      phone: '555-010-0001',
      role: 'driver'
    },
    {
      email: 'owner@parkway.com',
      password: 'owner123',
      firstName: 'Jane',
      lastName: 'Owner',
      phone: '555-010-0002',
      role: 'owner'
    },
    {
      email: 'test@parkway.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
      phone: '555-999-9999',
      role: 'driver'
    }
  ],
  driveways: [
    {
      address: '123 Main St, New York, NY 10001',
      latitude: 40.7128,
      longitude: -74.0060,
      price: 15.00,
      carSize: 'medium',
      description: 'Convenient downtown parking spot near financial district. Covered parking with security cameras.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'Well Lit']
    },
    {
      address: '456 Park Ave, New York, NY 10002',
      latitude: 40.7589,
      longitude: -73.9851,
      price: 20.00,
      carSize: 'large',
      description: 'Premium parking in Midtown Manhattan. Perfect for business meetings and shopping.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'EV Charging', 'Valet Service']
    },
    {
      address: '789 Broadway, New York, NY 10003',
      latitude: 40.7282,
      longitude: -73.9942,
      price: 12.00,
      carSize: 'small',
      description: 'Affordable parking in SoHo. Great for shopping and dining in the area.',
      isAvailable: true,
      amenities: ['Security Cameras', 'Well Lit']
    },
    {
      address: '321 5th Ave, New York, NY 10016',
      latitude: 40.7505,
      longitude: -73.9934,
      price: 18.00,
      carSize: 'medium',
      description: 'Central location near Empire State Building. Easy access to major attractions.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'Well Lit', '24/7 Access']
    },
    {
      address: '654 West 42nd St, New York, NY 10036',
      latitude: 40.7589,
      longitude: -73.9851,
      price: 25.00,
      carSize: 'large',
      description: 'Times Square area parking. Premium location with full amenities.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'EV Charging', 'Valet Service', '24/7 Access']
    }
  ],
  bookings: [
    {
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
      status: 'confirmed',
      totalPrice: 30.00,
      paymentStatus: 'paid'
    },
    {
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Day after tomorrow + 4 hours
      status: 'pending',
      totalPrice: 60.00,
      paymentStatus: 'pending'
    }
  ]
};

// Hash passwords
async function hashPasswords() {
  for (const user of seedData.users) {
    user.password = await bcrypt.hash(user.password, 12);
  }
}

// Create users
async function createUsers() {
  console.log('👥 Creating users...');
  
  const users = [];
  for (const userData of seedData.users) {
    const [user, created] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: userData
    });
    
    if (created) {
      console.log(`   ✅ Created user: ${user.email}`);
    } else {
      console.log(`   ⏭️  User already exists: ${user.email}`);
    }
    
    users.push(user);
  }
  
  return users;
}

// Create driveways
async function createDriveways(users) {
  console.log('🏠 Creating driveways...');
  
  const owner = users.find(user => user.role === 'owner');
  if (!owner) {
    throw new Error('No owner user found for creating driveways');
  }
  
  const driveways = [];
  for (const drivewayData of seedData.driveways) {
    const [driveway, created] = await Driveway.findOrCreate({
      where: { 
        address: drivewayData.address,
        ownerId: owner.id 
      },
      defaults: {
        ...drivewayData,
        ownerId: owner.id
      }
    });
    
    if (created) {
      console.log(`   ✅ Created driveway: ${driveway.address}`);
    } else {
      console.log(`   ⏭️  Driveway already exists: ${driveway.address}`);
    }
    
    driveways.push(driveway);
  }
  
  return driveways;
}

// Create bookings
async function createBookings(users, driveways) {
  console.log('📅 Creating bookings...');
  
  const driver = users.find(user => user.role === 'driver');
  if (!driver) {
    console.log('   ⏭️  No driver user found, skipping bookings');
    return;
  }
  
  const bookings = [];
  for (let i = 0; i < Math.min(seedData.bookings.length, driveways.length); i++) {
    const bookingData = seedData.bookings[i];
    const driveway = driveways[i];
    
    const [booking, created] = await Booking.findOrCreate({
      where: {
        driverId: driver.id,
        drivewayId: driveway.id,
        startTime: bookingData.startTime
      },
      defaults: {
        ...bookingData,
        driverId: driver.id,
        drivewayId: driveway.id
      }
    });
    
    if (created) {
      console.log(`   ✅ Created booking: ${booking.id} for driveway ${driveway.id}`);
    } else {
      console.log(`   ⏭️  Booking already exists for driveway ${driveway.id}`);
    }
    
    bookings.push(booking);
  }
  
  return bookings;
}

// Clear existing data
async function clearData() {
  console.log('🧹 Clearing existing data...');
  
  await Booking.destroy({ where: {} });
  await Driveway.destroy({ where: {} });
  await User.destroy({ where: {} });
  
  console.log('   ✅ Data cleared');
}

// Main seeding function
async function seedDatabase(clear = false) {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    if (clear) {
      await clearData();
      console.log('');
    }
    
    // Hash passwords
    await hashPasswords();
    
    // Create data
    const users = await createUsers();
    console.log('');
    
    const driveways = await createDriveways(users);
    console.log('');
    
    const bookings = await createBookings(users, driveways);
    console.log('');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Driveways: ${driveways.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Main function
async function main() {
  const clear = process.argv.includes('--clear');
  
  try {
    await seedDatabase(clear);
  } catch (error) {
    console.error('❌ Seeding script failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedDatabase,
  clearData
};
