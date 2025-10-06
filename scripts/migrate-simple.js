#!/usr/bin/env node

/**
 * Simple Database Migration Script for Parkway.com
 * This script handles database migrations with better error handling
 */

require('dotenv').config();

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('ℹ️  Skipping migrations in development mode');
  process.exit(0);
}

const { Sequelize } = require('sequelize');

// Database configuration with better error handling
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Disable logging to avoid noise
  pool: {
    max: 5,
    min: 1,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  }
});

// Simple migration functions
const migrations = [
  {
    version: '001',
    name: 'create_users_table',
    up: async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Users" (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "firstName" VARCHAR(100) NOT NULL,
          "lastName" VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          role VARCHAR(20) DEFAULT 'driver',
          "isVerified" BOOLEAN DEFAULT false,
          "verificationToken" VARCHAR(255),
          "resetPasswordToken" VARCHAR(255),
          "resetPasswordExpires" TIMESTAMP,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
  },
  {
    version: '002',
    name: 'create_driveways_table',
    up: async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Driveways" (
          id SERIAL PRIMARY KEY,
          "ownerId" INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
          address TEXT NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          "carSize" VARCHAR(20) NOT NULL,
          description TEXT,
          "isAvailable" BOOLEAN DEFAULT true,
          amenities TEXT[],
          images TEXT[],
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
  },
  {
    version: '003',
    name: 'create_bookings_table',
    up: async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Bookings" (
          id SERIAL PRIMARY KEY,
          "driverId" INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
          "drivewayId" INTEGER REFERENCES "Driveways"(id) ON DELETE CASCADE,
          "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
          "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          "totalPrice" DECIMAL(10, 2) NOT NULL,
          "paymentIntentId" VARCHAR(255),
          "paymentStatus" VARCHAR(20) DEFAULT 'pending',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
  }
];

// Create migrations table
async function createMigrationsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Migrations" (
        id SERIAL PRIMARY KEY,
        version VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "executedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error('❌ Error creating migrations table:', error.message);
    throw error;
  }
}

// Get executed migrations
async function getExecutedMigrations() {
  try {
    const [results] = await sequelize.query('SELECT version FROM "Migrations" ORDER BY version;');
    return results.map(row => row.version);
  } catch (error) {
    console.error('❌ Error getting executed migrations:', error.message);
    return [];
  }
}

// Record migration
async function recordMigration(version, name) {
  try {
    await sequelize.query(
      'INSERT INTO "Migrations" (version, name) VALUES ($1, $2);',
      { bind: [version, name] }
    );
  } catch (error) {
    console.error('❌ Error recording migration:', error.message);
    throw error;
  }
}

// Run migrations
async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');
    
    await createMigrationsTable();
    const executedMigrations = await getExecutedMigrations();
    
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.version)) {
        console.log(`📦 Running migration ${migration.version}: ${migration.name}`);
        await migration.up();
        await recordMigration(migration.version, migration.name);
        console.log(`✅ Migration ${migration.version} completed`);
      } else {
        console.log(`⏭️  Migration ${migration.version} already executed`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'up';
  
  try {
    console.log('🔄 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    if (command === 'up') {
      await runMigrations();
    } else if (command === 'status') {
      const executed = await getExecutedMigrations();
      console.log('📊 Migration Status:');
      console.log(`   Executed: ${executed.length}/${migrations.length}`);
      executed.forEach(version => {
        const migration = migrations.find(m => m.version === version);
        console.log(`   ✅ ${version}: ${migration?.name || 'Unknown'}`);
      });
    } else {
      console.log('Usage: node scripts/migrate-simple.js [up|status]');
      console.log('  up     - Run pending migrations (default)');
      console.log('  status - Show migration status');
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  getExecutedMigrations
};
