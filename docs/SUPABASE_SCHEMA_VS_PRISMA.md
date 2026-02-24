# Supabase schema vs Prisma schema

The SQL schema you have (Supabase Database Schema for Parkway.com) **does not match** the app’s Prisma schema. The app expects the database to have been created (or updated) by **Prisma migrations**.

## Differences (summary)

| Aspect | Your Supabase SQL schema | App (Prisma) |
|--------|---------------------------|---------------|
| IDs | `UUID` / `uuid_generate_v4()` | `String` / `cuid()` |
| Column names | snake_case (`owner_id`, `price_per_hour`) | camelCase (`ownerId`, `pricePerHour`) |
| `driveways` | No `title`, has `driveway_size`, `car_size_compatibility` | Has `title`, `capacity`, `carSize` array, no `driveway_size` |
| `users` | `phone_number`, no `avatar` | `phone`, `avatar` |
| Enums | Plain `VARCHAR` / `TEXT` | Prisma enums (`BookingStatus`, etc.) |

If the **live** Supabase database was created from that SQL script, the app will not work as-is: Prisma will expect different table and column names and types.

## If your Supabase DB was created by Prisma

Then the tables already use camelCase and Prisma’s structure. You only need to add the new column:

- Run in Supabase SQL Editor: **`docs/SUPABASE_ADD_RIGHT_TO_LIST_COLUMN.sql`**

Or run:

```sql
ALTER TABLE "driveways"
  ADD COLUMN IF NOT EXISTS "rightToListConfirmedAt" TIMESTAMP(3);
```

Then (if you haven’t already) mark the migration as applied:

```bash
cd packages/database
npx prisma migrate resolve --applied 20260223120000_add_right_to_list_confirmed_at
```

## If your Supabase DB matches the pasted SQL (snake_case, etc.)

Then you have two paths:

1. **Align DB with Prisma (recommended)**  
   - Create a new schema in Supabase using Prisma migrations (`npm run db:deploy` with `DATABASE_URL` pointing at Supabase), **or**  
   - Change your existing schema (rename columns, add missing ones, fix types) so it matches what Prisma expects. This is a larger migration.

2. **Keep your schema and change the app**  
   - Add `@map("snake_case_name")` (and possibly `@@map`) in `schema.prisma` for every table and column so Prisma talks to your current tables.  
   - Adjust types and relations to match (e.g. UUID vs cuid, arrays, enums). More work and easy to get wrong.

For a quick fix to the “right to list” 500 error, use the `ALTER TABLE` above **only** if your `driveways` table already has Prisma-style camelCase columns; otherwise fix the schema mismatch first.
