# Codebase Analysis — Senior Engineer Review

**Project:** Parkway / driveway-rental  
**Scope:** Monorepo (Next.js app + shared packages), Supabase/PostgreSQL, Stripe, auth, bookings, driveways, verification.  
**Date:** 2025-03 (post-reset to postdev).

---

## 1. Architecture Overview

### 1.1 Structure

- **Root:** npm workspaces `apps/*`, `packages/*`.
- **apps/web:** Next.js 16 App Router, React 18, TypeScript. Main consumer of packages.
- **packages/database:** Prisma 5, schema + client; built to `dist/`, consumed as `@parkway/database`.
- **packages/shared:** Shared types and utils (`createApiError`, `createApiResponse`); built to `dist/`, consumed as `@parkway/shared`.

Build order: `db:generate` → `packages/database` → `packages/shared` → `apps/web`. Root `postinstall` runs `db:generate`.

### 1.2 Data & API Flow

- **DB:** PostgreSQL (Supabase). Single `DATABASE_URL`; Prisma CLI reads from `packages/database/.env` for migrations.
- **API:** All under `apps/web/src/app/api/`. Next.js Route Handlers (GET/POST/PATCH/DELETE). No separate BFF; API routes are the backend.
- **Client:** Fetch-based `@/lib/api-client` (default export `api`) with `credentials: 'include'`. Paths like `/driveways`, `/bookings` resolve to `/api/driveways`, `/api/bookings` via `baseURL || '/api'`. No axios on client (avoids Node deps in browser).
- **Auth:** JWT in HTTP-only cookies (`access_token`); refresh flow via `/api/auth/refresh`. Centralized `requireAuth`, `optionalAuth`, `requireAdmin` in `@/lib/auth-middleware.ts`; used consistently across protected routes.

---

## 2. Strengths

### 2.1 Consistency & Patterns

- **Auth:** Single place for token verification and role checks; APIs return uniform 401/403 and messages.
- **Validation:** Zod in `@/lib/validations.ts` for search, booking, driveway, auth; `safeParse` and shared error shaping.
- **API responses:** `createApiResponse` / `createApiError` from shared give a consistent `{ success, data|message, error?, statusCode }` shape.
- **Errors:** `createAppError` in `@/lib/errors.ts` turns API errors into user-facing messages; used in `useApi` and key pages.

### 2.2 Security (Good Baseline)

- **Headers:** Middleware sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection; HSTS in production. Next config has a strict CSP (connect-src, script-src, frame-src) including Stripe/Cloudinary.
- **Cron:** `CRON_SECRET` + `Authorization: Bearer` check on expire-bookings and complete-bookings; optional but used when set.
- **Stripe webhook:** Signature verified with `STRIPE_WEBHOOK_SECRET` before processing; raw body used correctly.
- **Test/debug routes:** `requireDevelopment()` (NODE_ENV or VERCEL_ENV=preview) used on `/api/auth/debug`, `/api/env-test`, `/api/test-db`, etc., so they 404 in production.
- **Rate limiting:** In-memory limiters for login, registration, geocode, routing, booking; used on auth and external-facing routes. Comment correctly notes it resets per serverless instance and suggests Redis for production.

### 2.3 Domain Logic

- **Pricing:** `PricingService` (min/max duration, min price, platform fee, time/day multipliers) is centralized and used by booking API and UI.
- **Ownership:** Driveway and booking routes check `ownerId` / `userId` so users only access their own or allowed resources.
- **Verification:** Driveway verification (status, documents, admin actions) is modeled and wired through dedicated routes and admin UI.

### 2.4 DX & Tooling

- **Monorepo:** Clear split between app and packages; Prisma generate and build order are scripted.
- **Tests:** Jest + React Testing Library; tests for auth middleware, rate limit, API client, CSRF; integration-style booking flow test.
- **Lint/type-check:** ESLint, TypeScript; `lint` and `type-check` at app level.

---

## 3. Risks & Gaps

### 3.1 Security

- **Cron in production:** Vercel cron hits GET endpoints. If `CRON_SECRET` is unset, expire/complete-bookings are unauthenticated; anyone who discovers the URL could trigger them. **Recommendation:** Require `CRON_SECRET` in production and reject requests without a valid Bearer token.
- **Registration / booking:** Rate limiters exist for login, geocode, routing; registration and booking are defined but not consistently applied on all sensitive POSTs. **Recommendation:** Apply registration rate limit on `/api/auth/register` and booking limit on `/api/bookings` POST if not already.
- **Admin:** `requireAdmin` loads user from DB and checks `roles.includes('ADMIN')`. No audit log for admin actions (e.g. verification approve/reject). **Recommendation:** Add audit logging for admin mutations.
- **JWT:** No explicit short expiry + refresh rotation described in code; refresh exists. **Recommendation:** Document access vs refresh expiry and ensure refresh is used on 401 where appropriate (e.g. useApi already retries once after refresh).

### 3.2 Production Hardening

- **Rate limit store:** In-memory; on Vercel each instance has its own store, so limits are per-instance and reset on cold start. **Recommendation:** Use Upstash Redis (or similar) for production rate limits.
- **Errors in production:** Some routes use `logger.error` with message; ensure no stack or internal details are returned to the client. A few places return `message` from caught errors; keep messages generic in production.
- **Env validation:** No single startup validation that required env (e.g. `JWT_SECRET`, `DATABASE_URL`, Stripe keys for payments) are set. **Recommendation:** Add `validate-env` (or similar) and run it in build or startup.

### 3.3 API & Data Contract

- **Response shape:** API returns `{ success, data, message }` or `{ success: false, message, error (code), statusCode }`. Client often uses `response.data.data` (first `data` from fetch json, second from payload). Typing is loose in places; `ApiClientResponse<{ data: T }>` could be clarified (e.g. generic `ApiPayload<T>` for the inner `data`).
- **Pagination:** Driveways and bookings use `page`, `limit`, `total`, `totalPages`; shape is consistent. Search params validated with Zod; good.
- **Idempotency:** Payment and booking creation have no idempotency keys. Under retries, duplicate bookings could be created. **Recommendation:** For payments, Stripe idempotency is server-side; for POST /bookings consider idempotency key header and short-lived deduplication.

### 3.4 Database & Migrations

- **Single schema:** One Prisma schema and one DB URL; migrations are linear. Supabase used for host; direct connection (5432) recommended for migrations (pooler can cause advisory lock timeouts).
- **Migrations and “already exists”:** History shows failed migrations (e.g. verification, Google OAuth) where objects already existed; manual fixes in `_prisma_migrations` were used. **Recommendation:** Document the “mark as applied” pattern (as in `docs/supabase-mark-all-migrations-applied.sql`) and prefer idempotent migrations (e.g. `IF NOT EXISTS`) where feasible for one-off fixes.

### 3.5 Frontend & State

- **Auth state:** `useAuth` (and likely a store or context) drive authenticated UI; login/logout and refresh are centralized. Ensure no sensitive data in localStorage (only cookies for tokens).
- **Large pages:** Some route pages (e.g. search, driveway detail, navigate) are large (hundreds of lines). **Recommendation:** Extract panels, hooks, and subcomponents to improve readability and testing.
- **API client:** Single default export `api`; all methods use same `resolveUrl` and `credentials: 'include'`. Good. Timeout/abort not visible; consider request timeout for long-running endpoints.

### 3.6 Dependency & Config

- **Duplicates:** Root and app have overlapping deps (e.g. `call-bind`, `es-errors`); some are Stripe transitive. `fix:stripe-deps` script exists; worth keeping an eye on npm audit and pruning.
- **Next/React:** Next 16, React 18; current. Prisma 5.22 (app) vs 5.6 (database package); consider aligning Prisma version across the repo to avoid subtle mismatches.
- **Middleware matcher:** Excludes `api`, `_next/static`, `_next/image`, `favicon.ico`. Security headers still apply to page routes; API routes are not modified by this middleware (correct).

---

## 4. Recommendations (Prioritized)

### P0 (Before or early in production)

1. **Cron:** Require `CRON_SECRET` in production and return 401 when missing or invalid.
2. **Env:** Validate required env vars at build or startup; fail fast if `JWT_SECRET` or `DATABASE_URL` is missing.
3. **Test routes:** Confirm every route under `/api/test*`, `/api/env-test`, `/api/auth/debug` (and any similar) uses `requireDevelopment()` or equivalent so they never run in production.

### P1 (Short term)

4. **Rate limiting:** Move login, registration, and booking rate limits to Redis (e.g. Upstash) for production.
5. **Admin audit:** Log admin actions (who, what, when) for verification and other privileged operations.
6. **Error responses:** Audit catch blocks so production never returns stack traces or internal error messages to the client.

### P2 (Maintainability & scale)

7. **API types:** Introduce a shared type for API response envelope and use it in `api-client` and hooks so `response.data.data` is typed and documented.
8. **Split large pages:** Refactor search, driveway detail, and navigate into smaller components and custom hooks.
9. **Idempotency:** Consider idempotency key for POST /bookings (and document Stripe idempotency for payment intents).
10. **Prisma version:** Align Prisma and @prisma/client version across root and packages/database.

---

## 5. Summary Table

| Area           | Grade | Notes |
|----------------|-------|--------|
| Auth & authz   | B+    | Centralized, consistent; add cron secret requirement and admin audit. |
| Validation     | A-    | Zod everywhere; clear schemas. |
| API design     | B+    | Consistent shape; tighten types and idempotency. |
| Security headers| A     | Strong CSP and middleware headers. |
| Rate limiting  | B     | Present but in-memory; move to Redis for prod. |
| DB & migrations| B     | Clear schema; document Supabase/migration recovery. |
| Frontend       | B+    | Clear client API; break up large pages. |
| Testing        | B     | Key paths covered; more E2E and API tests would help. |
| DX & monorepo  | A-    | Clean workspace and scripts; align Prisma versions. |

Overall the codebase is production-capable with clear patterns and a good security baseline. The main improvements are tightening production safeguards (cron, env, rate limit storage), auditability (admin logs), and maintainability (types, splitting large components).
