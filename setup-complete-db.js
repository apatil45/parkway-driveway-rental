#!/usr/bin/env node

/**
 * Complete Database Setup Script for Parkway.com
 * This script sets up the entire database infrastructure
 */

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check if required files exist
function checkRequiredFiles() {
  logStep(1, 'Checking required files...');
  
  const requiredFiles = [
    'models/index.js',
    'models/User.js',
    'models/Driveway.js',
    'models/Booking.js',
    'setup-database.js',
    'scripts/migrate.js',
    'scripts/seed.js',
    'test-database.js'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    try {
      require.resolve(path.join(__dirname, file));
      logSuccess(`Found: ${file}`);
    } catch (error) {
      missingFiles.push(file);
      logError(`Missing: ${file}`);
    }
  }
  
  if (missingFiles.length > 0) {
    logError(`Missing ${missingFiles.length} required files. Please ensure all files are present.`);
    return false;
  }
  
  logSuccess('All required files found');
  return true;
}

// Check environment variables
function checkEnvironmentVariables() {
  logStep(2, 'Checking environment variables...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missingEnvVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar);
      logError(`Missing: ${envVar}`);
    } else {
      logSuccess(`Found: ${envVar}`);
    }
  }
  
  if (missingEnvVars.length > 0) {
    logWarning(`Missing ${missingEnvVars.length} environment variables.`);
    logWarning('Please set the following environment variables:');
    missingEnvVars.forEach(envVar => {
      logWarning(`  - ${envVar}`);
    });
    return false;
  }
  
  logSuccess('All required environment variables found');
  return true;
}

// Run database setup
async function runDatabaseSetup() {
  logStep(3, 'Running database setup...');
  
  try {
    const { setupDatabase } = require('./setup-database');
    await setupDatabase();
    logSuccess('Database setup completed');
    return true;
  } catch (error) {
    logError(`Database setup failed: ${error.message}`);
    return false;
  }
}

// Run database migrations
async function runMigrations() {
  logStep(4, 'Running database migrations...');
  
  try {
    const { runMigrations } = require('./scripts/migrate');
    await runMigrations();
    logSuccess('Database migrations completed');
    return true;
  } catch (error) {
    logError(`Database migrations failed: ${error.message}`);
    return false;
  }
}

// Run database seeding
async function runSeeding() {
  logStep(5, 'Running database seeding...');
  
  try {
    const { seedDatabase } = require('./scripts/seed');
    await seedDatabase(false); // Don't clear existing data
    logSuccess('Database seeding completed');
    return true;
  } catch (error) {
    logError(`Database seeding failed: ${error.message}`);
    return false;
  }
}

// Run database tests
async function runDatabaseTests() {
  logStep(6, 'Running database tests...');
  
  try {
    const { runDatabaseTests } = require('./test-database');
    await runDatabaseTests();
    logSuccess('Database tests completed');
    return true;
  } catch (error) {
    logError(`Database tests failed: ${error.message}`);
    return false;
  }
}

// Create database configuration file
function createDatabaseConfig() {
  logStep(7, 'Creating database configuration...');
  
  const config = {
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME || 'parkway_db',
      user: process.env.DB_USER || 'parkway_user',
      ssl: process.env.DB_SSL === 'true'
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    logging: process.env.NODE_ENV === 'development'
  };
  
  try {
    const fs = require('fs');
    fs.writeFileSync('database-config.json', JSON.stringify(config, null, 2));
    logSuccess('Database configuration file created');
    return true;
  } catch (error) {
    logError(`Failed to create database configuration: ${error.message}`);
    return false;
  }
}

// Main setup function
async function setupCompleteDatabase() {
  log('🚀 Starting Complete Database Setup for Parkway.com', 'bright');
  log('=' .repeat(60), 'cyan');
  
  const steps = [
    { name: 'Check Required Files', fn: checkRequiredFiles },
    { name: 'Check Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Run Database Setup', fn: runDatabaseSetup },
    { name: 'Run Database Migrations', fn: runMigrations },
    { name: 'Run Database Seeding', fn: runSeeding },
    { name: 'Run Database Tests', fn: runDatabaseTests },
    { name: 'Create Database Config', fn: createDatabaseConfig }
  ];
  
  const results = [];
  
  for (const step of steps) {
    try {
      const result = await step.fn();
      results.push({ name: step.name, success: result });
      
      if (!result) {
        logError(`Step failed: ${step.name}`);
        break;
      }
    } catch (error) {
      logError(`Step error: ${step.name} - ${error.message}`);
      results.push({ name: step.name, success: false, error: error.message });
      break;
    }
  }
  
  // Summary
  log('\n' + '=' .repeat(60), 'cyan');
  log('📊 Setup Summary:', 'bright');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${index + 1}. ${result.name}`, color);
    
    if (result.error) {
      log(`   Error: ${result.error}`, 'red');
    }
  });
  
  log(`\n📈 Results: ${successful}/${total} steps completed successfully`, 'bright');
  
  if (successful === total) {
    log('\n🎉 Complete database setup successful!', 'green');
    log('🚀 Your Parkway.com database is ready for production use!', 'green');
    log('\n📋 Next steps:', 'cyan');
    log('   1. Start the production server: node production-server.js', 'cyan');
    log('   2. Test the API endpoints', 'cyan');
    log('   3. Access the frontend at http://localhost:5173', 'cyan');
  } else {
    log('\n❌ Database setup incomplete. Please fix the errors above.', 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupCompleteDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logError(`Setup failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  setupCompleteDatabase,
  checkRequiredFiles,
  checkEnvironmentVariables,
  runDatabaseSetup,
  runMigrations,
  runSeeding,
  runDatabaseTests
};
