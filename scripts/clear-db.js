require('dotenv').config();
const { sequelize } = require('../models/database');

const clearDatabase = async () => {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Clear data in correct order (respecting foreign key constraints)
    console.log('🧹 Clearing bookings...');
    await sequelize.query('DELETE FROM bookings');
    
    console.log('🧹 Clearing driveways...');
    await sequelize.query('DELETE FROM driveways');
    
    console.log('🧹 Clearing users...');
    await sequelize.query('DELETE FROM users');
    
    // Reset auto-increment sequences (if any)
    console.log('🔄 Resetting sequences...');
    try {
      await sequelize.query('ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1');
      await sequelize.query('ALTER SEQUENCE IF EXISTS driveways_id_seq RESTART WITH 1');
      await sequelize.query('ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1');
    } catch (error) {
      // Sequences might not exist or be auto-increment, that's okay
      console.log('ℹ️  No sequences to reset (using UUIDs)');
    }
    
    console.log('✅ Database cleared successfully!');
    console.log('🎯 You can now test functionalities manually from scratch');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the cleanup
clearDatabase()
  .then(() => {
    console.log('🎉 Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  });
