import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// In dev, ensure DATABASE_URL is available (fallback to repo DATABASE_URL.txt if missing)
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'development') {
  try {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const fallbackPath = path.resolve(repoRoot, 'DATABASE_URL.txt');
    if (fs.existsSync(fallbackPath)) {
      const url = fs.readFileSync(fallbackPath, 'utf-8').trim();
      if (url) process.env.DATABASE_URL = url;
    }
  } catch {}
}

// Create a singleton Prisma client for serverless environments
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Store the client in global scope to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Export the Prisma client
export { prisma };

// Export types
export type {
  User,
  Driveway,
  Booking,
  Review,
  Notification,
  UserRole,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';

// Database connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
}

// Health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() };
  }
}
