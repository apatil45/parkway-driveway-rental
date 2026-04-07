# Senior Engineer Recommendations — Parkway Spot

Prioritized, feasible changes across the codebase. **Weight** = impact vs effort (P0 = do first, P1 = next, P2 = when capacity allows).

---

## P0 — High impact, low effort (do first)

| # | Area | Change | Why |
|---|------|--------|-----|
| 1 | **Security** | Apply `rateLimiters.registration` on `POST /api/auth/register`. | Login and geocode are rate-limited; register is not. Reduces abuse and bot signups. |
| 2 | **Security** | Validate required env at app startup (e.g. `JWT_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`) and fail fast with a clear message. | Avoids 500s and scattered checks; single place to document requirements. |
| 3 | **API** | Use shared error shape (`createApiError`) on any route that still returns ad-hoc `{ error: '...' }` (e.g. contact, webhook, upload, admin). | Consistent error handling and client mapping. |
| 4 | **DB** | Add composite index on `Driveway`: `@@index([latitude, longitude])` (and optionally `@@index([latitude, longitude, isActive, isAvailable])` if search filters by those). | Geo/search queries will benefit; no downside. |
| 5 | **DevEx** | Document every env var in `.env.example` (purpose, required/optional, example) and add `CRON_SECRET` if cron routes use it. | Reduces onboarding and deploy mistakes. |
| 6 | **Prod safety** | Ensure test/debug routes (`test-db`, `env-test`, `auth/debug`, etc.) return 404 or are disabled in production (not just `requireDevelopment()` that might be bypassed). | Shrinks attack surface. |

---

## P1 — High impact, medium effort (next)

| # | Area | Change | Why |
|---|------|--------|-----|
| 7 | **Auth** | Shorten access token TTL (e.g. 15min–1h) and rely on refresh token for session; keep refresh rate-limited and bound to user. | Reduces impact of token theft; aligns with common practice. |
| 8 | **Security** | Use CSRF protection (e.g. double-submit or header) for state-changing routes (register, booking, payment, contact), or document why SameSite/cookie policy is sufficient. | `csrf.ts` exists but is unused. |
| 9 | **API** | Apply a general API rate limiter (e.g. `rateLimiters.api`) to sensitive/expensive routes: bookings, uploads, payments, dashboard. | Only login and geocode are limited today. |
| 10 | **Frontend** | Add route-level `loading.tsx` and `error.tsx` (and `not-found.tsx` where relevant) under key segments. | Avoids each page hand-rolling loading/error; better UX. |
| 11 | **Frontend** | Standardize loading and error UI (shared skeleton + error component) and reuse on dashboard, driveways, bookings, profile. | Less duplication, consistent UX. |
| 12 | **DB** | Document migration workflow (`prisma migrate dev` vs `deploy`) and any manual steps in README or `packages/database`. | Fewer mistakes in staging/prod. |

---

## P2 — Medium impact or higher effort (when capacity allows)

| # | Area | Change | Why |
|---|------|--------|-----|
| 13 | **Validation** | Ensure every route that accepts JSON validates with Zod (or shared schemas) and returns validation errors via shared error shape (e.g. contact form). | Consistency and safety. |
| 14 | **Config** | Introduce a small feature-flag layer (env or config) for toggling features (e.g. verification, market-specific behavior) without code deploys. | Safer rollouts and A/B. |
| 15 | **Config** | Load market list or overrides from env so new markets don’t always require code changes. | Scales to more cities. |
| 16 | **Logging** | Use shared `logger` in API routes and avoid raw `console.log`; add request/correlation id for tracing. | Better ops and debugging. |
| 17 | **Types** | Replace `any` with proper types in driveways route (`orderBy`/`where`), api-client, and map components. | Safer refactors and fewer runtime bugs. |
| 18 | **Frontend** | Add bundle analysis (e.g. `@next/bundle-analyzer`) and lazy-load heavy UI (map, Stripe) where appropriate. | Smaller initial bundle, faster FCP. |
| 19 | **A11y** | Ensure modals/dialogs trap focus and restore it on close; run axe (or similar) in CI. | Skip-link exists; focus and automation complete the picture. |
| 20 | **Testing** | Add coverage reporting and thresholds; add tests for untested API routes (contact, upload, webhook). | Clear baseline and regression safety. |
| 21 | **Docs** | Add a short “Architecture” section (auth flow, API conventions, env, DB, cron) and link from main README. | Easier onboarding and context. |

---

## Summary

- **P0 (6 items):** Security (rate-limit register, env validation, prod-gate debug routes), API consistency (error shape), DB index, env docs.
- **P1 (6 items):** Auth (shorter-lived tokens + refresh), CSRF, API rate limits, route-level loading/error, shared loading/error UI, migration docs.
- **P2 (9 items):** Validation consistency, feature flags, market config from env, logging, types, bundle/a11y, testing, architecture docs.

**Suggested order:** Do P0 in a single sprint; then P1 in the next; pick P2 by impact and team capacity.
