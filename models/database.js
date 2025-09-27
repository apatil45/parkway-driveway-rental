const { Sequelize } = require('sequelize');

// PostgreSQL database connection only
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  pool: {
    max: 3,
    min: 0,
    acquire: 30000,
    idle: 10000,
    evict: 1000
  },
  retry: {
    max: 3
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
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
