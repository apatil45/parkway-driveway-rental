const { sequelize } = require('../models/database');

async function addOnboardingField() {
  try {
    console.log('🔄 Adding onboarding_completed field to users table...');
    
    // Add the onboarding_completed column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;
    `);
    
    console.log('✅ Successfully added onboarding_completed field to users table');
    
    // Update existing users to have onboarding completed (since they're already using the app)
    await sequelize.query(`
      UPDATE users 
      SET onboarding_completed = TRUE 
      WHERE onboarding_completed = FALSE;
    `);
    
    console.log('✅ Updated existing users to have onboarding completed');
    
  } catch (error) {
    console.error('❌ Error adding onboarding field:', error.message);
    throw error;
  }
}

// Run the migration
addOnboardingField()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
