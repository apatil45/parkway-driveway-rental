#!/usr/bin/env node

/**
 * Environment Variables Setup Script for Parkway.com
 * This script sets up the required environment variables
 */

const fs = require('fs');
const path = require('path');

// Environment variables configuration
const envConfig = {
  // Database Configuration
  DATABASE_URL: 'postgresql://parkway_user:5JEJVL2GX12E9mAQRPPoqI62QM2NNVFR@dpg-d3a95kndiees73d311vg-a.virginia-postgres.render.com/parkway_db',
  DB_HOST: 'dpg-d3a95kndiees73d311vg-a.virginia-postgres.render.com',
  DB_PORT: '5432',
  DB_NAME: 'parkway_db',
  DB_USER: 'parkway_user',
  DB_PASSWORD: '5JEJVL2GX12E9mAQRPPoqI62QM2NNVFR',
  DB_SSL: 'true',
  
  // JWT Configuration
  JWT_SECRET: 'supersecretjwtkey',
  JWT_EXPIRES_IN: '7d',
  
  // Server Configuration
  PORT: '3000',
  NODE_ENV: 'development',
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: 'sk_test_your_stripe_secret_key_here',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_publishable_key_here',
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: 'deguirpcb',
  CLOUDINARY_API_KEY: '969444696786874',
  CLOUDINARY_API_SECRET: 'wJPxIpBFLs4Um_ewlV6eY75LZ7k',
  
  // Geocoding Configuration
  OPENCAGE_API_KEY: '6769cc75d3b74a2ba2c3948f83710337',
  
  // Frontend Configuration
  FRONTEND_URL: 'http://localhost:5173',
  
  // Database Pool Configuration
  DB_POOL_MAX: '20',
  DB_POOL_MIN: '5',
  DB_POOL_ACQUIRE: '30000',
  DB_POOL_IDLE: '10000',
  
  // Logging Configuration
  LOG_LEVEL: 'debug',
  LOG_FILE: 'logs/app.log',
  
  // Security Configuration
  BCRYPT_ROUNDS: '12',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100'
};

// Set environment variables
function setEnvironmentVariables() {
  console.log('🔧 Setting up environment variables...');
  
  for (const [key, value] of Object.entries(envConfig)) {
    process.env[key] = value;
    console.log(`✅ Set ${key}=${value}`);
  }
  
  console.log('✅ All environment variables set successfully');
}

// Create .env file
function createEnvFile() {
  console.log('📝 Creating .env file...');
  
  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    throw error;
  }
}

// Main function
function setupEnvironment() {
  console.log('🚀 Setting up environment variables for Parkway.com\n');
  
  try {
    setEnvironmentVariables();
    console.log('');
    createEnvFile();
    
    console.log('\n🎉 Environment setup completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run db:setup:complete');
    console.log('   2. Start the production server: node production-server.js');
    console.log('   3. Test the API endpoints');
    
  } catch (error) {
    console.error('❌ Environment setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupEnvironment();
}

module.exports = {
  setEnvironmentVariables,
  createEnvFile,
  setupEnvironment,
  envConfig
};
