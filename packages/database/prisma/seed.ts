import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Prevent seeding in production
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercelProd = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';
  
  if (isProduction || isVercelProd) {
    console.error('Database seeding is not allowed in production environment!');
    console.error('   This script should only be run in development.');
    process.exit(1);
  }

  // Allow override with environment variable for testing
  const allowSeed = process.env.ALLOW_SEED === 'true';
  if (!allowSeed && process.env.NODE_ENV !== 'development') {
    console.warn('Seeding is only allowed in development or when ALLOW_SEED=true');
    console.warn('   Set ALLOW_SEED=true if you really want to seed in this environment.');
    process.exit(1);
  }

  console.log('Starting database seeding...');
  console.log('WARNING: This will create test users with weak passwords!');
  console.log('   Test credentials:');
  console.log('   - owner@parkway.com / password123');
  console.log('   - driver@parkway.com / password123');

  // Create or find test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@parkway.com' },
    update: {},
    create: {
      email: 'owner@parkway.com',
      password: hashedPassword,
      name: 'John Owner',
      phone: '+1234567890',
      roles: ['OWNER'],
      isActive: true,
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@parkway.com' },
    update: {},
    create: {
      email: 'driver@parkway.com',
      password: hashedPassword,
      name: 'Jane Driver',
      phone: '+1234567891',
      roles: ['DRIVER'],
      isActive: true,
    },
  });

  // Create sample driveway
  const driveway = await prisma.driveway.create({
    data: {
      ownerId: owner.id,
      title: 'Downtown Premium Spot',
      description: 'Convenient parking spot in the heart of downtown. Close to restaurants and shopping.',
      address: '123 Main Street, Downtown, New York, NY 10001',
      latitude: 40.7589,
      longitude: -73.9851,
      pricePerHour: 5.00,
      capacity: 1,
      carSize: ['small', 'medium', 'large'],
      amenities: ['covered', 'security', 'easy_access'],
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
      ],
      isActive: true,
      isAvailable: true,
    },
  });


  // Create sample booking
  const booking = await prisma.booking.create({
    data: {
      userId: driver.id,
      drivewayId: driveway.id,
      startTime: new Date('2024-01-15T09:00:00Z'),
      endTime: new Date('2024-01-15T17:00:00Z'),
      totalPrice: 40.00,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        color: 'Silver',
        licensePlate: 'ABC123'
      },
    },
  });

  // Create sample review
  await prisma.review.create({
    data: {
      userId: driver.id,
      drivewayId: driveway.id,
      rating: 5,
      comment: 'Great location and easy to find. Owner was very responsive.',
    },
  });

  // Create sample notification
  await prisma.notification.create({
    data: {
      userId: owner.id,
      type: 'info',
      title: 'New Booking Confirmed',
      message: 'Your driveway has been booked for January 15th, 9:00 AM - 5:00 PM',
      isRead: false,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Created owner: ${owner.email}`);
  console.log(`Created driver: ${driver.email}`);
  console.log(`Created driveway: ${driveway.title}`);
  console.log(`Created booking: ${booking.id}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });