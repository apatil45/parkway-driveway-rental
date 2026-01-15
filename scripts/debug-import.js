// Debug script to test imports
console.log('Testing imports...');

try {
  console.log('1. Testing @parkway/database import...');
  const { prisma } = require('@parkway/database');
  console.log('@parkway/database imported successfully');
  console.log('Prisma client:', typeof prisma);
} catch (error) {
  console.error('@parkway/database import failed:', error.message);
}

try {
  console.log('2. Testing @prisma/client import...');
  const { PrismaClient } = require('@prisma/client');
  console.log('@prisma/client imported successfully');
  console.log('PrismaClient:', typeof PrismaClient);
} catch (error) {
  console.error('@prisma/client import failed:', error.message);
}

try {
  console.log('3. Testing @parkway/shared import...');
  const { createApiResponse } = require('@parkway/shared');
  console.log('@parkway/shared imported successfully');
  console.log('createApiResponse:', typeof createApiResponse);
} catch (error) {
  console.error('@parkway/shared import failed:', error.message);
}

console.log('Debug complete.');
