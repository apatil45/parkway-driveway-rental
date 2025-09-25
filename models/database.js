const { Sequelize } = require('sequelize');

// Database connection - works with both local and Render
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/parkway_db',
  {
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

module.exports = sequelize;
