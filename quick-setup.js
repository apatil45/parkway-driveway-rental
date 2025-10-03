#!/usr/bin/env node

/**
 * Quick Setup Script for Parkway.com
 * This script creates a basic .env file for development
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Parkway.com Quick Setup\n');

// Check if .env already exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('   If you need to recreate it, delete the existing .env file first.');
  process.exit(0);
}

// Create basic .env content
const envContent = `# Parkway.com Environment Variables
# Development Configuration - UPDATE THESE VALUES!

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/parkway_db
JWT_SECRET=dev-jwt-secret-key-change-in-production-$(Date.now())

# Server Configuration
NODE_ENV=development
PORT=3000

# Cloudinary Configuration (for image uploads)
# Get these from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe Configuration (for payments)
# Get these from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here

# Geocoding API (optional)
# Get this from https://opencagedata.com/api
OPENCAGE_API_KEY=your_opencage_api_key_here
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with basic configuration');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Update the .env file with your actual API keys');
  console.log('2. Set up PostgreSQL database');
  console.log('3. Run: npm run migrate');
  console.log('4. Run: npm run dev');
  console.log('\n🔑 REQUIRED API KEYS:');
  console.log('- Cloudinary: https://cloudinary.com/console');
  console.log('- Stripe: https://dashboard.stripe.com/test/apikeys');
  console.log('- OpenCage: https://opencagedata.com/api (optional)');
  console.log('\n⚠️  IMPORTANT: Update all placeholder values in .env file!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}
