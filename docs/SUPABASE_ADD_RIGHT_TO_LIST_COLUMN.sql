-- ============================================================
-- Add Phase 1 "right to list" column for Parkway (Prisma-shaped DB)
-- ============================================================
-- Run this in Supabase SQL Editor if your "driveways" table was
-- created by Prisma (has camelCase columns: ownerId, pricePerHour, etc.).
-- ============================================================

ALTER TABLE "driveways"
  ADD COLUMN IF NOT EXISTS "rightToListConfirmedAt" TIMESTAMP(3);
