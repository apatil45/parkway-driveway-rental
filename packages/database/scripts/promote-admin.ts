/**
 * Promote a user to ADMIN by email.
 * Run from repo root: node scripts/run-promote-admin.js <email>
 * Or from packages/database with DATABASE_URL set: npx tsx scripts/promote-admin.ts <email>
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  if (!email) {
    console.error('Usage: npx tsx scripts/promote-admin.ts <email>');
    console.error('   Or set ADMIN_EMAIL and run: npx tsx scripts/promote-admin.ts');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim() },
    select: { id: true, email: true, name: true, roles: true },
  });

  if (!user) {
    console.error(`User not found with email: ${email}`);
    process.exit(1);
  }

  const roles = user.roles as string[];
  if (roles.includes('ADMIN')) {
    console.log(`User ${user.email} (${user.name}) already has ADMIN role.`);
    process.exit(0);
  }

  const newRoles = [...roles, 'ADMIN'];
  await prisma.user.update({
    where: { id: user.id },
    data: { roles: newRoles },
  });

  console.log(`Done. ${user.email} (${user.name}) is now an admin.`);
  console.log('Roles:', newRoles.join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
