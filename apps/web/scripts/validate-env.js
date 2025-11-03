#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks that all required environment variables are set
 * 
 * Usage: npm run validate-env
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const requiredVars = {
  // Backend (Server-side only)
  DATABASE_URL: 'PostgreSQL database connection string',
  JWT_SECRET: 'JWT signing secret key',
  
  // Optional Backend
  JWT_REFRESH_SECRET: 'JWT refresh token secret (optional, falls back to JWT_SECRET)',
  STRIPE_SECRET_KEY: 'Stripe secret key for payments (optional)',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret (optional)',
  CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name (optional, for images)',
  CLOUDINARY_API_KEY: 'Cloudinary API key (optional)',
  CLOUDINARY_API_SECRET: 'Cloudinary API secret (optional)',
  OPENCAGE_API_KEY: 'OpenCage geocoding API key (optional, for address geocoding)',
  
  // Frontend (Public)
  NEXT_PUBLIC_API_URL: 'API base URL (optional, defaults to /api)',
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL (optional)',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key (optional)',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key (optional)',
  NEXT_PUBLIC_SOCKET_URL: 'WebSocket URL (optional, for real-time)',
  
  // Other
  FRONTEND_URL: 'Frontend URL for callbacks (optional)',
  NODE_ENV: 'Node environment (development/production)',
};

const criticalVars = ['DATABASE_URL', 'JWT_SECRET'];

function validateEnv() {
  console.log('🔍 Validating environment variables...\n');
  
  const missing = [];
  const present = [];
  const warnings = [];
  
  // Check required variables
  for (const [key, description] of Object.entries(requiredVars)) {
    const value = process.env[key];
    
    if (criticalVars.includes(key)) {
      if (!value || value.trim() === '') {
        missing.push({ key, description, critical: true });
      } else {
        present.push({ key, description, critical: true });
      }
    } else if (value && value.trim() !== '') {
      present.push({ key, description, critical: false });
    } else {
      warnings.push({ key, description });
    }
  }
  
  // Display results
  if (present.length > 0) {
    console.log('✅ Present Variables:');
    present.forEach(({ key, description, critical }) => {
      const value = process.env[key];
      const displayValue = critical 
        ? `${value.substring(0, 10)}...` 
        : (key.includes('SECRET') || key.includes('KEY') 
            ? `${value.substring(0, 10)}...` 
            : value);
      console.log(`   ✓ ${key}: ${displayValue} (${description})`);
    });
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing Critical Variables:');
    missing.forEach(({ key, description }) => {
      console.log(`   ✗ ${key}: ${description}`);
    });
    console.log('');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Optional Variables (Not Set):');
    warnings.forEach(({ key, description }) => {
      console.log(`   ○ ${key}: ${description}`);
    });
    console.log('');
  }
  
  console.log('✅ Environment validation complete!');
  console.log(`   ${present.length} variables set, ${warnings.length} optional variables not set\n`);
  
  // Additional checks
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://')) {
    console.log('⚠️  Warning: DATABASE_URL should start with "postgresql://"');
  }
  
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.log('⚠️  Warning: JWT_SECRET should be at least 32 characters long');
  }
  
  return true;
}

// Run validation
validateEnv();

