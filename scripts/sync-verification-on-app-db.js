/**
 * One-off: run verification columns sync using the same DATABASE_URL as the app (apps/web/.env.local).
 * Run from repo root: node scripts/sync-verification-on-app-db.js
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const envLocalPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.error('apps/web/.env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf8');
const match = envContent.match(/DATABASE_URL="?([^"\s]+)"?/);
if (!match) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}
process.env.DATABASE_URL = match[1].trim();

const sqlPath = path.join(
  __dirname,
  '..',
  'packages',
  'database',
  'migrations',
  '20260223140000_add_driveway_verification',
  'sync_verification_columns.sql'
);
const dbDir = path.join(__dirname, '..', 'packages', 'database');

execSync(`npx prisma db execute --file "${sqlPath}"`, {
  stdio: 'inherit',
  env: process.env,
  cwd: dbDir,
});
console.log('Sync completed.');
