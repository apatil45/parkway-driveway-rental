const { Sequelize } = require('sequelize');

// Robust database connection with retry logic
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/parkway_db',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Test connection with retry logic
const testConnection = async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL connection established successfully');
      return true;
    } catch (error) {
      console.error(`❌ Database connection failed. Retries left: ${retries - 1}`);
      console.error('Error:', error.message);
      retries--;
      if (retries > 0) {
        console.log('🔄 Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  return false;
};

module.exports = { sequelize, testConnection };
