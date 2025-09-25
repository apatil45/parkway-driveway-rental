#!/usr/bin/env node

/**
 * Environment Setup Script for Parkway.com
 * This script helps you set up your environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Parkway.com Environment Setup\n');
  console.log('This script will help you set up your environment variables.\n');

  const envVars = {};

  // Database Configuration
  console.log('📊 Database Configuration:');
  envVars.DATABASE_URL = await question('Database URL (postgresql://user:pass@localhost:5432/dbname): ');
  envVars.JWT_SECRET = await question('JWT Secret (generate a secure random string): ');

  // Server Configuration
  console.log('\n🖥️  Server Configuration:');
  envVars.NODE_ENV = await question('Environment (development/production) [development]: ') || 'development';
  envVars.PORT = await question('Port [3000]: ') || '3000';

  // Cloudinary Configuration
  console.log('\n🖼️  Cloudinary Configuration:');
  console.log('Get these from https://cloudinary.com/console');
  envVars.CLOUDINARY_CLOUD_NAME = await question('Cloudinary Cloud Name: ');
  envVars.CLOUDINARY_API_KEY = await question('Cloudinary API Key: ');
  envVars.CLOUDINARY_API_SECRET = await question('Cloudinary API Secret: ');

  // Optional Services
  console.log('\n💳 Optional Services (press Enter to skip):');
  envVars.STRIPE_SECRET_KEY = await question('Stripe Secret Key: ');
  envVars.STRIPE_PUBLIC_KEY = await question('Stripe Public Key: ');
  envVars.OPENCAGE_API_KEY = await question('OpenCage API Key: ');

  // Generate .env content
  const envContent = `# Parkway.com Environment Variables
# Generated on ${new Date().toISOString()}

# Database Configuration
DATABASE_URL=${envVars.DATABASE_URL}
JWT_SECRET=${envVars.JWT_SECRET}

# Server Configuration
NODE_ENV=${envVars.NODE_ENV}
PORT=${envVars.PORT}

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=${envVars.CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${envVars.CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${envVars.CLOUDINARY_API_SECRET}

# Optional Services
${envVars.STRIPE_SECRET_KEY ? `STRIPE_SECRET_KEY=${envVars.STRIPE_SECRET_KEY}` : '# STRIPE_SECRET_KEY=your_stripe_secret_key'}
${envVars.STRIPE_PUBLIC_KEY ? `STRIPE_PUBLIC_KEY=${envVars.STRIPE_PUBLIC_KEY}` : '# STRIPE_PUBLIC_KEY=your_stripe_public_key'}
${envVars.OPENCAGE_API_KEY ? `OPENCAGE_API_KEY=${envVars.OPENCAGE_API_KEY}` : '# OPENCAGE_API_KEY=your_opencage_api_key'}
`;

  // Write .env file
  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment variables saved to .env file');
  console.log('\n📋 Next steps:');
  console.log('1. Review your .env file');
  console.log('2. Start your server: npm run dev');
  console.log('3. Test image uploads in your app');
  console.log('\n🔒 Security reminder:');
  console.log('- Never commit .env files to version control');
  console.log('- Keep your API secrets secure');
  console.log('- Use different credentials for production');

  rl.close();
}

// Run the setup
setupEnvironment().catch(console.error);
