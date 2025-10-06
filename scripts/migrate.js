#!/usr/bin/env node

/**
 * Database Migration Script for Parkway.com
 * This script handles database migrations and schema updates
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Migration functions
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
    },
    down: async () => {
      await sequelize.query('DROP TABLE IF EXISTS "Users" CASCADE;');
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
    },
    down: async () => {
      await sequelize.query('DROP TABLE IF EXISTS "Driveways" CASCADE;');
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
    },
    down: async () => {
      await sequelize.query('DROP TABLE IF EXISTS "Bookings" CASCADE;');
    }
  },
  {
    version: '004',
    name: 'create_indexes',
    up: async () => {
      // User indexes
      await sequelize.query('CREATE INDEX IF NOT EXISTS "users_email_idx" ON "Users" (email);');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "users_role_idx" ON "Users" (role);');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "Users" ("createdAt");');

      // Driveway indexes
      await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_ownerId_idx" ON "Driveways" ("ownerId");');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_location_idx" ON "Driveways" (latitude, longitude);');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_carSize_idx" ON "Driveways" ("carSize");');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_availability_idx" ON "Driveways" ("isAvailable");');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "driveways_price_idx" ON "Driveways" (price);');

      // Booking indexes
      await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_driverId_idx" ON "Bookings" ("driverId");');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_drivewayId_idx" ON "Bookings" ("drivewayId");');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "Bookings" (status);');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "bookings_time_range_idx" ON "Bookings" ("startTime", "endTime");');
    },
    down: async () => {
      // Drop indexes
      await sequelize.query('DROP INDEX IF EXISTS "users_email_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "users_role_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "users_created_at_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "driveways_ownerId_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "driveways_location_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "driveways_carSize_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "driveways_availability_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "driveways_price_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "bookings_driverId_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "bookings_drivewayId_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "bookings_status_idx";');
      await sequelize.query('DROP INDEX IF EXISTS "bookings_time_range_idx";');
    }
  }
];

// Create migrations table
async function createMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "Migrations" (
      id SERIAL PRIMARY KEY,
      version VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      "executedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

// Get executed migrations
async function getExecutedMigrations() {
  const [results] = await sequelize.query('SELECT version FROM "Migrations" ORDER BY version;');
  return results.map(row => row.version);
}

// Record migration
async function recordMigration(version, name) {
  await sequelize.query(
    'INSERT INTO "Migrations" (version, name) VALUES ($1, $2);',
    { bind: [version, name] }
  );
}

// Remove migration record
async function removeMigrationRecord(version) {
  await sequelize.query('DELETE FROM "Migrations" WHERE version = $1;', { bind: [version] });
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
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Rollback migrations
async function rollbackMigrations(count = 1) {
  try {
    console.log(`🔄 Rolling back ${count} migration(s)...`);
    
    const executedMigrations = await getExecutedMigrations();
    const migrationsToRollback = executedMigrations.slice(-count);
    
    for (const version of migrationsToRollback.reverse()) {
      const migration = migrations.find(m => m.version === version);
      if (migration) {
        console.log(`📦 Rolling back migration ${migration.version}: ${migration.name}`);
        await migration.down();
        await removeMigrationRecord(migration.version);
        console.log(`✅ Migration ${migration.version} rolled back`);
      }
    }
    
    console.log('🎉 Rollback completed successfully!');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'up'; // Default to 'up' if no command provided
  const count = parseInt(process.argv[3]) || 1;
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackMigrations(count);
        break;
      case 'status':
        const executed = await getExecutedMigrations();
        console.log('📊 Migration Status:');
        console.log(`   Executed: ${executed.length}/${migrations.length}`);
        executed.forEach(version => {
          const migration = migrations.find(m => m.version === version);
          console.log(`   ✅ ${version}: ${migration?.name || 'Unknown'}`);
        });
        break;
      default:
        console.log('Usage: node scripts/migrate.js [up|down|status] [count]');
        console.log('  up     - Run pending migrations (default)');
        console.log('  down   - Rollback migrations (default: 1)');
        console.log('  status - Show migration status');
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error);
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
  runMigrations,
  rollbackMigrations,
  getExecutedMigrations
};