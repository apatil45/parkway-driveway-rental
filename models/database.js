const { Sequelize } = require('sequelize');

// PostgreSQL database connection only
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Disable logging for better performance
  pool: {
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
    min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 5,
    acquire: process.env.DB_POOL_ACQUIRE ? parseInt(process.env.DB_POOL_ACQUIRE) : 30000,
    idle: process.env.DB_POOL_IDLE ? parseInt(process.env.DB_POOL_IDLE) : 10000,
    evict: 1000
  },
  retry: {
    max: 5
  },
  dialectOptions: {
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : (process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false),
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: false
  },
  benchmark: false,
  query: {
    raw: false
  }
});

console.log('🗄️  Using PostgreSQL database');

// Test connection with retry logic
const testConnection = async () => {
  let retries = 5;
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
        const delay = Math.min(2000 * (6 - retries), 10000); // Exponential backoff, max 10s
        console.log(`🔄 Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

module.exports = { sequelize, testConnection };
