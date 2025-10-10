const { sequelize } = require('../models/database');

async function addCoordinatesColumns() {
  try {
    console.log('🗄️  Adding latitude and longitude columns to driveways table...');
    
    // Add latitude column
    await sequelize.query(`
      ALTER TABLE driveways 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
    `);
    console.log('✅ Added latitude column');
    
    // Add longitude column
    await sequelize.query(`
      ALTER TABLE driveways 
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
    `);
    console.log('✅ Added longitude column');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addCoordinatesColumns()
  .then(() => {
    console.log('✅ Database migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
