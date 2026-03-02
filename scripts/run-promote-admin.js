/**
 * Promote a user to ADMIN. Uses the same DATABASE_URL as the app (apps/web/.env.local).
 * Run from repo root: node scripts/run-promote-admin.js <email>
 * Example: node scripts/run-promote-admin.js you@example.com
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const email = process.argv[2] || process.env.ADMIN_EMAIL;
if (!email) {
  console.error('Usage: node scripts/run-promote-admin.js <email>');
  console.error('Example: node scripts/run-promote-admin.js you@example.com');
  process.exit(1);
}

const envLocalPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const match = envContent.match(/DATABASE_URL="?([^"\s]+)"?/);
  if (match) process.env.DATABASE_URL = match[1].trim();
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found. Set it in apps/web/.env.local or in the environment.');
  process.exit(1);
}

const dbDir = path.join(__dirname, '..', 'packages', 'database');
const scriptPath = path.join(dbDir, 'scripts', 'promote-admin.ts');

execSync(`npx tsx scripts/promote-admin.ts "${email}"`, {
  stdio: 'inherit',
  env: { ...process.env, ADMIN_EMAIL: email },
  cwd: dbDir,
});
