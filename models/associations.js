const User = require('./UserPG');
const Driveway = require('./DrivewayPG');
const Booking = require('./BookingPG');

// Define associations with proper field mappings
const setupAssociations = () => {
  try {
    // User-Driveway associations
    User.hasMany(Driveway, { 
      foreignKey: 'owner',
      as: 'userDriveways',
      onDelete: 'CASCADE',
      hooks: true
    });
    
    Driveway.belongsTo(User, { 
      foreignKey: 'owner',
      as: 'ownerInfo',
      hooks: true
    });

    // User-Booking associations (driver)
    User.hasMany(Booking, { 
      foreignKey: 'driver',
      as: 'userBookings',
      onDelete: 'CASCADE',
      hooks: true
    });
    
    Booking.belongsTo(User, { 
      foreignKey: 'driver',
      as: 'driverInfo',
      hooks: true
    });

    // Driveway-Booking associations
    Driveway.hasMany(Booking, { 
      foreignKey: 'driveway',
      as: 'drivewayBookings',
      onDelete: 'CASCADE',
      hooks: true
    });
    
    Booking.belongsTo(Driveway, { 
      foreignKey: 'driveway',
      as: 'drivewayInfo',
      hooks: true
    });

    console.log('✅ Database associations configured successfully');
  } catch (error) {
    console.error('❌ Error setting up associations:', error.message);
    throw error;
  }
};

module.exports = { setupAssociations };
