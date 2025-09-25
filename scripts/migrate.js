const { sequelize } = require('../models/database');
const { setupAssociations } = require('../models/associations');

// Database migration script for Render
const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Setup associations
    setupAssociations();
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ 
      alter: false, 
      force: false 
    });
    
    console.log('✅ Database migration completed successfully');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
