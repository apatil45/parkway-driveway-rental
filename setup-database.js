#!/usr/bin/env node

/**
 * Database Setup Script for Parkway.com
 * This script sets up the complete database configuration and initializes the database
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Database configuration
const dbConfig = {
  development: {
    username: process.env.DB_USER || 'parkway_user',
    password: process.env.DB_PASSWORD || '5JEJVL2GX12E9mAQRPPoqI62QM2NNVFR',
    database: process.env.DB_NAME || 'parkway_db',
    host: process.env.DB_HOST || 'dpg-d3a95kndiees73d311vg-a.virginia-postgres.render.com',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  test: {
    username: process.env.DB_USER || 'parkway_user',
    password: process.env.DB_PASSWORD || '5JEJVL2GX12E9mAQRPPoqI62QM2NNVFR',
    database: process.env.DB_NAME || 'parkway_db_test',
    host: process.env.DB_HOST || 'dpg-d3a95kndiees73d311vg-a.virginia-postgres.render.com',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 
  `postgresql://${dbConfig.development.username}:${dbConfig.development.password}@${dbConfig.development.host}:${dbConfig.development.port}/${dbConfig.development.database}`,
  {
    ...dbConfig.development,
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
}

// Create database indexes
async function createIndexes() {
  try {
    console.log('🔧 Creating database indexes...');
    
    // User table indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "users_email_idx" ON "Users" (email);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "users_role_idx" ON "Users" (role);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "Users" ("createdAt");');

    // Driveway table indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_ownerId_idx" ON "Driveways" ("ownerId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_location_idx" ON "Driveways" (latitude, longitude);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_carSize_idx" ON "Driveways" ("carSize");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_availability_idx" ON "Driveways" ("isAvailable");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_price_idx" ON "Driveways" (price);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_created_at_idx" ON "Driveways" ("createdAt");');

    // Booking table indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_driverId_idx" ON "Bookings" ("driverId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_drivewayId_idx" ON "Bookings" ("drivewayId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "Bookings" (status);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_time_range_idx" ON "Bookings" ("startTime", "endTime");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "Bookings" ("createdAt");');

    console.log('✅ Database indexes created successfully.');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
}

// Analyze tables for query optimization
async function analyzeTables() {
  try {
    console.log('📊 Analyzing database tables...');
    await sequelize.query('ANALYZE VERBOSE;');
    console.log('✅ Database tables analyzed successfully.');
  } catch (error) {
    console.error('❌ Error analyzing tables:', error.message);
  }
}

// Create seed data
async function createSeedData() {
  try {
    console.log('🌱 Creating seed data...');
    
    // Import models
    const { User, Driveway, Booking } = require('./models');
    
    // Create test users
    const testUsers = await User.bulkCreate([
      {
        email: 'driver@parkway.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K.8K.8K', // password123
        firstName: 'John',
        lastName: 'Driver',
        phone: '555-0101',
        role: 'driver'
      },
      {
        email: 'owner@parkway.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K.8K.8K', // password123
        firstName: 'Jane',
        lastName: 'Owner',
        phone: '555-0102',
        role: 'owner'
      }
    ], { ignoreDuplicates: true });

    // Create test driveways
    const testDriveways = await Driveway.bulkCreate([
      {
        ownerId: testUsers[1].id,
        address: '123 Main St, New York, NY 10001',
        latitude: 40.7128,
        longitude: -74.0060,
        price: 15.00,
        carSize: 'medium',
        description: 'Convenient downtown parking spot',
        isAvailable: true,
        amenities: ['Covered', 'Security Cameras']
      },
      {
        ownerId: testUsers[1].id,
        address: '456 Park Ave, New York, NY 10002',
        latitude: 40.7589,
        longitude: -73.9851,
        price: 20.00,
        carSize: 'large',
        description: 'Premium parking in Midtown',
        isAvailable: true,
        amenities: ['Covered', 'Security Cameras', 'EV Charging']
      }
    ], { ignoreDuplicates: true });

    console.log('✅ Seed data created successfully.');
    console.log(`   - Created ${testUsers.length} users`);
    console.log(`   - Created ${testDriveways.length} driveways`);
    
  } catch (error) {
    console.error('❌ Error creating seed data:', error.message);
  }
}

// Main setup function
async function setupDatabase() {
  console.log('🚀 Starting Parkway.com Database Setup...\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Database setup failed. Please check your connection settings.');
    process.exit(1);
  }

  // Sync database (create tables)
  try {
    console.log('🔄 Synchronizing database...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    process.exit(1);
  }

  // Create indexes
  await createIndexes();

  // Analyze tables
  await analyzeTables();

  // Create seed data
  await createSeedData();

  console.log('\n🎉 Database setup completed successfully!');
  console.log('📋 Next steps:');
  console.log('   1. Start the production server: node production-server.js');
  console.log('   2. Test the API endpoints');
  console.log('   3. Access the frontend at http://localhost:5173');
  
  await sequelize.close();
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  sequelize,
  dbConfig,
  testConnection,
  createIndexes,
  analyzeTables,
  createSeedData,
  setupDatabase
};
