require('dotenv').config();
const { sequelize } = require('../models/database');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database status...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check table counts
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [driveways] = await sequelize.query('SELECT COUNT(*) as count FROM driveways');
    const [bookings] = await sequelize.query('SELECT COUNT(*) as count FROM bookings');
    
    console.log('📊 Database Status:');
    console.log(`   👥 Users: ${users[0].count}`);
    console.log(`   🏠 Driveways: ${driveways[0].count}`);
    console.log(`   📅 Bookings: ${bookings[0].count}`);
    
    if (users[0].count === '0' && driveways[0].count === '0' && bookings[0].count === '0') {
      console.log('✅ Database is completely empty - ready for fresh testing!');
    } else {
      console.log('⚠️  Database still contains some data');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the check
checkDatabase()
  .then(() => {
    console.log('🎉 Database check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database check failed:', error);
    process.exit(1);
  });
