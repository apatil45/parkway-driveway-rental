-- Run this ENTIRE script in Supabase SQL Editor once.
-- It marks all 6 migrations as applied (fixes P3018 "already exists" failed migrations)
-- and releases the advisory lock so "prisma migrate deploy" can run (fixes P1002).

-- 1) Mark every migration as applied (fixes failed migrations where schema already exists)
UPDATE _prisma_migrations SET finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL WHERE migration_name = '20251029184724_init';
UPDATE _prisma_migrations SET finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL WHERE migration_name = '20260129173400_add_favorites';
UPDATE _prisma_migrations SET finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL WHERE migration_name = '20260211031452_sync_schema';
UPDATE _prisma_migrations SET finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL WHERE migration_name = '20260223120000_add_right_to_list_confirmed_at';
UPDATE _prisma_migrations SET finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL WHERE migration_name = '20260223140000_add_driveway_verification';
UPDATE _prisma_migrations SET finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL WHERE migration_name = '20260306120000_add_google_oauth';

-- 2) Release Prisma's migration advisory lock (so deploy doesn't timeout with P1002)
SELECT pg_terminate_backend(PSA.pid)
FROM pg_locks AS PL
INNER JOIN pg_stat_activity AS PSA ON PSA.pid = PL.pid
WHERE PL.objid = 72707369
  AND PSA.pid <> pg_backend_pid();
