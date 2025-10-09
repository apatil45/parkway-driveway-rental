#!/usr/bin/env node

// Script to check Render environment variables
require('dotenv').config();

console.log('🔍 Checking Render Environment Variables...\n');

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV'
];

const optionalVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'OPENCAGE_API_KEY',
  'FRONTEND_URL',
  'REACT_APP_STRIPE_PUBLIC_KEY',
  'REACT_APP_API_URL'
];

console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'DATABASE_URL') {
      // Mask sensitive parts of database URL
      const masked = value.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET`);
  }
});

console.log('\n🔧 Environment Info:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`PORT: ${process.env.PORT || 3000}`);
console.log(`Platform: ${process.platform}`);
console.log(`Node Version: ${process.version}`);

// Test database connection
console.log('\n🗄️  Testing Database Connection...');
const { sequelize } = require('../models/database');

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
