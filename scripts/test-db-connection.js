const { prisma } = require('@parkway/database');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    // Test driveway count
    const drivewayCount = await prisma.driveway.count();
    console.log(`Driveway count: ${drivewayCount}`);
    
    // Test booking count
    const bookingCount = await prisma.booking.count();
    console.log(`Booking count: ${bookingCount}`);
    
    console.log('All database tests passed!');
    
  } catch (error) {
    console.error('Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }
}

testDatabaseConnection();
