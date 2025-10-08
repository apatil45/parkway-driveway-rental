#!/usr/bin/env node

/**
 * Database Seeding Script for Parkway.com
 * This script populates the database with initial data for development and testing
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models/database');
const User = require('../models/UserPG');
const Driveway = require('../models/DrivewayPG');
const Booking = require('../models/BookingPG');

// Seed data
const seedData = {
  users: [
    {
      email: 'admin@parkway.com',
      password: 'admin123',
      name: 'Admin User',
      phoneNumber: '555-000-0001',
      roles: ['admin']
    },
    {
      email: 'driver@parkway.com',
      password: 'driver123',
      name: 'John Driver',
      phoneNumber: '555-010-0001',
      roles: ['driver']
    },
    {
      email: 'owner@parkway.com',
      password: 'owner123',
      name: 'Jane Owner',
      phoneNumber: '555-010-0002',
      roles: ['owner']
    },
    {
      email: 'test@parkway.com',
      password: 'test123',
      name: 'Test User',
      phoneNumber: '555-999-9999',
      roles: ['driver']
    }
  ],
  driveways: [
    {
      address: '123 Main St, New York, NY 10001',
      pricePerHour: 15.00,
      drivewaySize: 'medium',
      description: 'Convenient downtown parking spot near financial district. Covered parking with security cameras.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'Well Lit'],
      carSizeCompatibility: ['small', 'medium']
    },
    {
      address: '456 Park Ave, New York, NY 10002',
      pricePerHour: 20.00,
      drivewaySize: 'large',
      description: 'Premium parking in Midtown Manhattan. Perfect for business meetings and shopping.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'EV Charging', 'Valet Service'],
      carSizeCompatibility: ['medium', 'large', 'extra-large']
    },
    {
      address: '789 Broadway, New York, NY 10003',
      pricePerHour: 12.00,
      drivewaySize: 'small',
      description: 'Affordable parking in SoHo. Great for shopping and dining in the area.',
      isAvailable: true,
      amenities: ['Security Cameras', 'Well Lit'],
      carSizeCompatibility: ['small']
    },
    {
      address: '321 5th Ave, New York, NY 10016',
      pricePerHour: 18.00,
      drivewaySize: 'medium',
      description: 'Central location near Empire State Building. Easy access to major attractions.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'Well Lit', '24/7 Access'],
      carSizeCompatibility: ['small', 'medium']
    },
    {
      address: '654 West 42nd St, New York, NY 10036',
      pricePerHour: 25.00,
      drivewaySize: 'large',
      description: 'Times Square area parking. Premium location with full amenities.',
      isAvailable: true,
      amenities: ['Covered', 'Security Cameras', 'EV Charging', 'Valet Service', '24/7 Access'],
      carSizeCompatibility: ['medium', 'large', 'extra-large']
    }
  ],
  bookings: [
    {
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
      startTime: '10:00',
      endTime: '12:00',
      status: 'confirmed',
      totalAmount: 30.00,
      paymentStatus: 'paid'
    },
    {
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Day after tomorrow + 4 hours
      startTime: '14:00',
      endTime: '18:00',
      status: 'pending',
      totalAmount: 60.00,
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
  
  const owner = users.find(user => user.roles && user.roles.includes('owner'));
  if (!owner) {
    throw new Error('No owner user found for creating driveways');
  }
  
  const driveways = [];
  for (const drivewayData of seedData.driveways) {
    const [driveway, created] = await Driveway.findOrCreate({
      where: { 
        address: drivewayData.address,
        owner: owner.id 
      },
      defaults: {
        ...drivewayData,
        owner: owner.id
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
  
  const driver = users.find(user => user.roles && user.roles.includes('driver'));
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
        driver: driver.id,
        driveway: driveway.id,
        startTime: bookingData.startTime
      },
      defaults: {
        ...bookingData,
        driver: driver.id,
        driveway: driveway.id
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
