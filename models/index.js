const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with enhanced configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 5,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  }
});

// Import models
const User = require('./User')(sequelize);
const Driveway = require('./Driveway')(sequelize);
const Booking = require('./Booking')(sequelize);

// Define associations
User.hasMany(Driveway, { foreignKey: 'ownerId', as: 'driveways' });
Driveway.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Booking, { foreignKey: 'driverId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'driverId', as: 'user' });

Driveway.hasMany(Booking, { foreignKey: 'drivewayId', as: 'bookings' });
Booking.belongsTo(Driveway, { foreignKey: 'drivewayId', as: 'driveway' });

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Driveway,
  Booking,
  testConnection,
  syncDatabase
};
