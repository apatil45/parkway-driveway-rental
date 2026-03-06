-- Run this in Supabase SQL Editor if migrate deploy fails.
-- Makes password optional and adds googleId for Google OAuth.
-- Safe to run multiple times (ignores "already exists" errors).

-- 1. Make password nullable (for OAuth users)
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- 2. Add googleId column (ignore if exists)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- 3. Create unique index (ignore if exists)
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");
