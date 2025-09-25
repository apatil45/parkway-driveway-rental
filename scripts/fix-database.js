const { sequelize } = require('../models/database');
const { setupAssociations } = require('../models/associations');

// Database fix script for Render - handles column name mismatches
const fixDatabase = async () => {
  try {
    console.log('🔧 Starting database fix...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Setup associations
    setupAssociations();
    
    // Drop and recreate tables to fix column mappings
    console.log('🔄 Dropping existing tables...');
    await sequelize.drop();
    console.log('✅ Tables dropped');
    
    // Create tables with correct schema
    console.log('🔄 Creating tables with correct schema...');
    await sequelize.sync({ force: false });
    console.log('✅ Tables created with correct schema');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database connection closed');
    
    console.log('🎉 Database fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

// Run fix if called directly
if (require.main === module) {
  fixDatabase();
}

module.exports = { fixDatabase };
