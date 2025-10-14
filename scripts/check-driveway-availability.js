require('dotenv').config();
const { sequelize } = require('../models/database');
const Driveway = require('../models/DrivewayPG');

async function checkDrivewayAvailability() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const driveways = await Driveway.findAll({ limit: 3 });
    console.log('🏠 Driveway Availability Data:');
    
    driveways.forEach((d, index) => {
      console.log(`\nDriveway ${index + 1}:`);
      console.log('  ID:', d.id);
      console.log('  Address:', d.address);
      console.log('  Available:', d.isAvailable);
      console.log('  Availability:', JSON.stringify(d.availability, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDrivewayAvailability();
