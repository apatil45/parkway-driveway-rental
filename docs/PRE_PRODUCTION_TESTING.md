# Pre-Production Testing Checklist

Run these **before every production deploy** (or use CI to run the automated part; then do the manual/env checks once per release).

---

## 1. Automated tests (must all pass)

Run from repo root. Fix any failures before deploying.

| Step | Command | What it covers |
|------|--------|----------------|
| **Lint** | `npm run lint` | ESLint; code style and common bugs |
| **Type check** | `npm run type-check` | TypeScript; type errors |
| **Build** | `npm run build` | Next.js build + Prisma generate; must succeed in prod mode |
| **Unit tests** | `npm run test` or `npm run test:unit` | Jest; components, hooks, lib, API helpers |
| **API tests** | `npm run test:api` | API integration (needs server + DB; see below) |
| **E2E tests** | `npm run test:e2e` | Playwright; full user flows (needs app running) |

**One-liner (build + static checks only, no server):**

```bash
npm run lint && npm run type-check && npm run build && npm run test:unit
```

**Full suite (with API + E2E):** Start app and DB first, then:

```bash
npm run test:api
npm run test:e2e
```

Your **GitHub Actions** (`.github/workflows/tests.yml`) already runs unit, integration (API), E2E, lint, and type-check on push/PR. Ensure that workflow is green before merging to `main` and deploying.

---

## 2. Environment and config (production)

- [ ] **Required env in prod:** `DATABASE_URL`, `JWT_SECRET` (and `JWT_REFRESH_SECRET` if you use refresh tokens). Run `npm run validate-env` with prod env loaded (or your host’s env) and fix any missing critical vars.
- [ ] **Stripe:** Use **live** keys in prod (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). Webhook endpoint must point to your prod URL and use the live webhook secret.
- [ ] **Cron:** If you use cron (e.g. expire-bookings, complete-bookings), set `CRON_SECRET` in prod and call endpoints with that secret.
- [ ] **Email:** If contact form or notifications use Resend, set `RESEND_API_KEY` (and `RESEND_FROM_EMAIL` if needed). Contact API should return 503 when email is not configured (already implemented).
- [ ] **Frontend URL:** Set `FRONTEND_URL` (and `NEXT_PUBLIC_API_URL` if different from same-origin) to your production URL for redirects and links.
- [ ] **No dev/test keys:** Ensure no `.env.development` or test Stripe keys are used in production.

---

## 3. Database

- [ ] **Migrations:** Run migrations against prod DB (or your staging DB that matches prod):  
  `DATABASE_URL="..." npm run db:migrate`  
  Do not use `db:push` for production; use migrations.
- [ ] **Seed (if needed):** If you rely on seed data (e.g. test users for support), run seed once: `npm run db:seed` with prod `DATABASE_URL` only if intended.
- [ ] **Backup:** Ensure prod DB is backed up before applying migrations.

---

## 4. Security (quick checks)

- [ ] **Debug/test routes:** All routes under `api/test*`, `api/auth/debug`, `api/_internal` use `requireDevelopment()` or equivalent and return 404 in production. Optional: after deploy, hit `https://your-domain.com/api/test` and confirm 404.
- [ ] **Admin registration:** Register API rejects `ADMIN` role (no self-assignment). UI already hides it.
- [ ] **HTTPS:** App is served over HTTPS in prod; middleware HSTS is enabled in production.
- [ ] **Secrets:** No `JWT_SECRET`, Stripe keys, or DB URL in client bundles or logs.

---

## 5. Smoke test (after deploy)

Quick manual (or scripted) checks on the **live** URL:

- [ ] Homepage loads; no console errors.
- [ ] **Auth:** Register (as driver/owner), login, logout; redirect to dashboard after login.
- [ ] **Search:** Search page loads; list/map and filters work.
- [ ] **Driveway:** Open a driveway detail; booking CTA works (or shows “login to book” when logged out).
- [ ] **Payments:** If Stripe is live, do one small real payment in test mode or use Stripe test cards on a staging URL; confirm booking moves to CONFIRMED and (if applicable) webhook is received.
- [ ] **Contact:** Submit contact form; confirm 200/201 or 503 with clear message if email is not configured.
- [ ] **Dashboard:** Logged-in user sees dashboard (stats/bookings/driveways as appropriate).

---

## 6. Optional but recommended

- **Staging:** Deploy to a staging environment (same stack as prod, staging DB and Stripe test mode) and run the full test suite + E2E against staging `BASE_URL` before promoting to prod.
- **E2E against staging:**  
  `BASE_URL=https://staging.yourdomain.com npm run test:e2e`
- **Coverage:** Run `npm run test:coverage` occasionally; keep critical paths (auth, bookings, payments) covered.
- **Performance:** For high traffic, add a simple load test (e.g. k6 or Artillery) against key APIs and important pages.
- **Accessibility:** Run axe or Lighthouse on key pages (home, search, login, booking) and fix critical issues.

---

## 7. Summary: minimum before prod

1. **CI green** (unit, API, E2E, lint, type-check).
2. **Prod build** runs: `npm run build`.
3. **Prod env** validated: required vars set, Stripe/cron/email configured for prod.
4. **DB** migrations applied to prod (and backup taken).
5. **Smoke test** on live URL (auth, search, one driveway, contact, dashboard).

Keeping this checklist in `docs/PRE_PRODUCTION_TESTING.md` and running it (or the automated part via CI) before each production release will catch most issues before users do.
