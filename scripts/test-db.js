const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);
    
    // Test driveways query
    const drivewayCount = await prisma.driveway.count();
    console.log(`Found ${drivewayCount} driveways in database`);
    
    // Test a specific query that might be failing
    const driveways = await prisma.driveway.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      take: 5
    });
    console.log(`Found ${driveways.length} active driveways`);
    console.log('Sample driveway:', driveways[0]);
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
