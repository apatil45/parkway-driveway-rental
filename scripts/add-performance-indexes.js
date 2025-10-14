/**
 * Database Performance Indexes Migration
 * Adds critical indexes for improved query performance
 */

require('dotenv').config();
const { sequelize } = require('../models/database');

const addPerformanceIndexes = async () => {
  try {
    console.log('🚀 Adding performance indexes...');
    
    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();
    
    // Add indexes for driveways table
    console.log('📊 Adding driveways indexes...');
    
    // Owner index for user's driveways queries
    await queryInterface.addIndex('driveways', ['owner'], {
      name: 'idx_driveways_owner',
      unique: false
    });
    
    // Availability index for search queries
    await queryInterface.addIndex('driveways', ['is_available'], {
      name: 'idx_driveways_available',
      unique: false
    });
    
    // Location index for geospatial queries
    await queryInterface.addIndex('driveways', ['latitude', 'longitude'], {
      name: 'idx_driveways_location',
      unique: false
    });
    
    // Address index for text search
    await queryInterface.addIndex('driveways', ['address'], {
      name: 'idx_driveways_address',
      unique: false
    });
    
    // Add indexes for bookings table
    console.log('📊 Adding bookings indexes...');
    
    // Driver index for user's bookings
    await queryInterface.addIndex('bookings', ['driver'], {
      name: 'idx_bookings_driver',
      unique: false
    });
    
    // Driveway index for driveway's bookings
    await queryInterface.addIndex('bookings', ['driveway'], {
      name: 'idx_bookings_driveway',
      unique: false
    });
    
    // Status index for filtering bookings
    await queryInterface.addIndex('bookings', ['status'], {
      name: 'idx_bookings_status',
      unique: false
    });
    
    // Date range index for availability checks
    await queryInterface.addIndex('bookings', ['start_date', 'end_date'], {
      name: 'idx_bookings_dates',
      unique: false
    });
    
    // Payment status index
    await queryInterface.addIndex('bookings', ['payment_status'], {
      name: 'idx_bookings_payment_status',
      unique: false
    });
    
    // Add indexes for users table
    console.log('📊 Adding users indexes...');
    
    // Email index for login queries
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true // Email should be unique
    });
    
    // Roles index for role-based queries
    await queryInterface.addIndex('users', ['roles'], {
      name: 'idx_users_roles',
      unique: false
    });
    
    // Composite index for owner queries
    await queryInterface.addIndex('users', ['id', 'roles'], {
      name: 'idx_users_id_roles',
      unique: false
    });
    
    console.log('✅ All performance indexes added successfully!');
    
    // Show index information
    const indexes = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\n📋 Created indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.tablename}.${index.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error.message);
    throw error;
  }
};

const removePerformanceIndexes = async () => {
  try {
    console.log('🗑️ Removing performance indexes...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    const indexesToRemove = [
      'idx_driveways_owner',
      'idx_driveways_available', 
      'idx_driveways_location',
      'idx_driveways_address',
      'idx_bookings_driver',
      'idx_bookings_driveway',
      'idx_bookings_status',
      'idx_bookings_dates',
      'idx_bookings_payment_status',
      'idx_users_email',
      'idx_users_roles',
      'idx_users_id_roles'
    ];
    
    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('driveways', indexName);
        console.log(`  ✅ Removed ${indexName}`);
      } catch (error) {
        // Index might not exist, continue
        console.log(`  ⚠️ Index ${indexName} not found or already removed`);
      }
    }
    
    console.log('✅ Performance indexes removed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing indexes:', error.message);
    throw error;
  }
};

// Run the migration
const runMigration = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    const action = process.argv[2];
    
    if (action === 'down') {
      await removePerformanceIndexes();
    } else {
      await addPerformanceIndexes();
    }
    
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📴 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📴 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

runMigration();
