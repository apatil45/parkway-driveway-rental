import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const driver = await prisma.user.upsert({
    where: { email: 'driver@parkway.com' },
    update: {},
    create: {
      name: 'John Driver',
      email: 'driver@parkway.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2.', // password123
      roles: ['DRIVER'],
      phone: '+1234567890',
      address: '123 Main St, City, State'
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@parkway.com' },
    update: {},
    create: {
      name: 'Jane Owner',
      email: 'owner@parkway.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2.', // password123
      roles: ['OWNER'],
      phone: '+1234567891',
      address: '456 Oak Ave, City, State'
    }
  });

  // Create sample driveways
  const driveway1 = await prisma.driveway.upsert({
    where: { id: 'driveway-1' },
    update: {},
    create: {
      id: 'driveway-1',
      title: 'Spacious Downtown Driveway',
      description: 'Large driveway perfect for any vehicle size. Close to downtown attractions.',
      address: '789 Downtown St, City, State',
      latitude: 40.7128,
      longitude: -74.0060,
      pricePerHour: 5.00,
      capacity: 2,
      carSize: ['small', 'medium', 'large'],
      amenities: ['covered', 'security', 'easy_access'],
      images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'],
      ownerId: owner.id
    }
  });

  const driveway2 = await prisma.driveway.upsert({
    where: { id: 'driveway-2' },
    update: {},
    create: {
      id: 'driveway-2',
      title: 'Secure Residential Driveway',
      description: 'Safe and secure driveway in quiet residential area.',
      address: '321 Elm St, City, State',
      latitude: 40.7589,
      longitude: -73.9851,
      pricePerHour: 3.50,
      capacity: 1,
      carSize: ['small', 'medium'],
      amenities: ['security'],
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
      ownerId: owner.id
    }
  });

  // Create sample bookings
  const booking1 = await prisma.booking.upsert({
    where: { id: 'booking-1' },
    update: {},
    create: {
      id: 'booking-1',
      drivewayId: driveway1.id,
      userId: driver.id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
      totalPrice: 10.00,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      specialRequests: 'Please ensure easy access',
      vehicleInfo: JSON.stringify({
        make: 'Toyota',
        model: 'Camry',
        color: 'Silver',
        licensePlate: 'ABC123'
      })
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Sample users created:');
  console.log('  - Driver: driver@parkway.com (password: password123)');
  console.log('  - Owner: owner@parkway.com (password: password123)');
  console.log('🏠 Sample driveways created:');
  console.log('  - Downtown Driveway: $5.00/hour');
  console.log('  - Residential Driveway: $3.50/hour');
  console.log('📅 Sample booking created');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
