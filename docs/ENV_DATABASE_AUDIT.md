# Environment & Database URL Audit

## Env file loading order (Next.js in apps/web)

| Priority | File | Used when |
|----------|------|-----------|
| 1 | `apps/web/.env.local` | **Local dev** – overrides all (gitignored) |
| 2 | `apps/web/.env.development` | Dev only |
| 3 | `apps/web/.env.production` | Production build |
| 4 | `apps/web/.env` | Fallback (gitignored) |

**Production (Vercel):** Uses env vars from Vercel Dashboard → Project → Settings → Environment Variables. `.env` files are not used.

---

## Current DATABASE_URL by file

| File | DATABASE_URL | Purpose |
|------|--------------|---------|
| `apps/web/.env.local` | Supabase direct + sslmode | ✅ **Dev** – app uses this |
| `apps/web/.env` | localhost:5432 | Fallback if no .env.local |
| `apps/web/.env.example` | localhost:5432 | Template for new devs |
| `apps/.env` | localhost:5432 | Scripts in apps/ |
| `.env` (root) | localhost:5432 | Root-level scripts |
| `env.template` | Placeholder | Copy to .env.local |
| `env.local.template` | Supabase (missing sslmode) | Copy to .env.local |

---

## Recommendations

### Dev (local)
- Use `apps/web/.env.local` with Supabase URL:
  ```
  DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
  ```
- Supabase requires `?sslmode=require`.

### Prod (Vercel)
- Set `DATABASE_URL` in Vercel → Settings → Environment Variables.
- Use Supabase connection pooler for serverless:
  ```
  postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
  ```
- Get the exact pooler URL from Supabase → Settings → Database → Connection pooling.

### Scripts (db:migrate, promote-admin, etc.)
- `scripts/run-promote-admin.js` reads from `apps/web/.env.local`.
- `prisma migrate` runs from `packages/database` – ensure `DATABASE_URL` is set (e.g. in shell or via `dotenv` from apps/web).

---

## Quick checklist

- [ ] `apps/web/.env.local` has Supabase URL with `?sslmode=require`
- [ ] Vercel project has `DATABASE_URL` set (Supabase pooler recommended)
- [ ] Templates (env.template, .env.example) document both localhost and Supabase options
