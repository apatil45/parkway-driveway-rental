const User = require('./UserPG');
const Driveway = require('./DrivewayPG');
const Booking = require('./BookingPG');

// Define associations
const setupAssociations = () => {
  // User-Driveway associations
  User.hasMany(Driveway, { 
    foreignKey: 'owner',
    as: 'driveways',
    onDelete: 'CASCADE'
  });
  
  Driveway.belongsTo(User, { 
    foreignKey: 'owner',
    as: 'ownerInfo'
  });

  // User-Booking associations (driver)
  User.hasMany(Booking, { 
    foreignKey: 'driver',
    as: 'bookings',
    onDelete: 'CASCADE'
  });
  
  Booking.belongsTo(User, { 
    foreignKey: 'driver',
    as: 'driverInfo'
  });

  // Driveway-Booking associations
  Driveway.hasMany(Booking, { 
    foreignKey: 'driveway',
    as: 'bookings',
    onDelete: 'CASCADE'
  });
  
  Booking.belongsTo(Driveway, { 
    foreignKey: 'driveway',
    as: 'drivewayInfo'
  });

  console.log('✅ Database associations configured');
};

module.exports = { setupAssociations };
