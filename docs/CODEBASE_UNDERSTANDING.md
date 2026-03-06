# Parkway (Driveway Rental) — Codebase Understanding

Single reference for the whole monorepo before implementing [SENIOR_ENGINEER_RECOMMENDATIONS.md](./SENIOR_ENGINEER_RECOMMENDATIONS.md). No code changes; read-only.

---

## 1. Repo structure

| Path | Purpose |
|------|--------|
| **Root** | `package.json` (workspaces: `apps/*`, `packages/*`), `turbo.json` (build/dev/test/lint/type-check). No Nx. |
| **apps/web** | Only app. Next.js 16, App Router. Entry: `src/app/layout.tsx`, `src/app/page.tsx`. |
| **packages/database** | Prisma schema, client, migrations, scripts. |
| **packages/shared** | Types and utils (API response/error, validation, date/price/distance helpers). |
| **tests/** | E2E (Playwright), API integration. |
| **scripts/** | Smoke, promote-admin, sync-verification, DB connectivity, etc. |
| **docs/** | Project docs, runbooks, design, professional guides. |

Env: `apps/web/.env.example`, `.env.local` (gitignored). Turbo watches `**/.env.*local`. No root `.env` in tree.

---

## 2. Apps (web)

- **Entry**: `src/app/layout.tsx` (fonts, ToastProvider, ErrorBoundary, Analytics, global CSS), `src/app/page.tsx` (home).
- **Routing**: File-based under `src/app/`:
  - Public: `/`, `/search`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/driveway/[id]`, `/contact`, `/about`, `/help`, `/pricing`, `/privacy`, `/terms`, `/host-guide`.
  - Auth-required: `/dashboard`, `/profile`, `/earnings`, `/driveways` (list/new/[id]/edit/[id]/verify), `/bookings`, `/bookings/[id]/confirmation`, `/bookings/[id]/navigate`, `/checkout`, `/favorites`.
  - Admin: `/admin/verifications`.
- **Layout**: Most pages use `AppLayout` (Navbar, Breadcrumbs, main, Footer). Root layout has no route protection.
- **Packages**: `@parkway/database` (API routes only; Prisma + types). `@parkway/shared` (createApiResponse/createApiError, types, validations). Next config: `transpilePackages: ['@parkway/database', '@parkway/shared']`, Prisma generate from `packages/database/schema.prisma`.

---

## 3. Packages

**@parkway/database**
- Schema: `packages/database/schema.prisma` (PostgreSQL via `DATABASE_URL`).
- Exports: `prisma`, `connectDatabase`, `disconnectDatabase`, `checkDatabaseHealth`, Prisma types (User, Driveway, Booking, Review, Favorite, Notification, enums).
- Used only by **apps/web** in API routes and server code; no Prisma in client bundles.

**@parkway/shared**
- Exports: from **types** (Prisma re-exports, ApiResponse, PaginatedResponse, auth/booking/driveway/payment/map/notification/error types); from **utils** (validateEmail, validatePassword, formatDate/Time, formatPrice, calculateBookingPrice, calculateDistance, createError, createApiResponse, createApiError, etc.).
- Consumers: **apps/web** (API routes, auth-middleware). Types may depend on workspace-hoisted `@prisma/client`.

---

## 4. Auth flow

- **Login**: `POST /api/auth/login`. Zod body; bcrypt check; JWT access + refresh; **httpOnly cookies** via `setAuthCookies` (cookie-utils). Rate limited (login limiter).
- **Register**: `POST /api/auth/register`. Zod; bcrypt; user created; same cookie setting. **Not rate limited** (P0 fix).
- **Tokens**: Cookies only — `access_token` (short TTL), `refresh_token` (long TTL). httpOnly, secure in prod, SameSite Lax.
- **Refresh**: `POST /api/auth/refresh` reads `refresh_token` cookie; issues new access (and optionally refresh); sets cookies.
- **Logout**: `POST /api/auth/logout` clears cookies via `clearAuthCookies`.

**Protection**
- **Middleware** (`middleware.ts`): Security headers only (X-Frame-Options, etc.). **Does not** enforce auth or protect routes.
- **API**: Per-route via `@/lib/auth-middleware`: `verifyAuth` (cookie JWT), `requireAuth`, `optionalAuth`, `requireAdmin`. Used by: auth/profile, bookings, dashboard/stats, driveways (mutations + [id]), favorites, payments (intent, verify), reviews, notifications, upload/verification-document, admin/verifications, admin/verification-document.
- **Pages**: No route middleware. Pages use **useAuth** and redirect when `!isAuthenticated && !authLoading` (e.g. dashboard, profile, earnings, driveways, bookings, checkout, favorites, admin/verifications). Pattern: `useEffect` that calls `router.push('/login')` or similar when not authenticated.

---

## 5. API layer

**Structure** (`apps/web/src/app/api/`):
- **auth**: login, register, refresh, logout, me, profile, forgot-password, reset-password, debug (dev).
- **bookings**: list/create, [id] get/patch.
- **driveways**: list (GET optional auth), create (POST auth), [id] get/put, [id]/verify.
- **favorites**: list, [drivewayId] post/delete.
- **payments**: intent, verify, webhook.
- **reviews**: list, [id] get/put/delete.
- **notifications**: list, mark-all-read, [id] get/patch/delete.
- **admin**: verifications list, [drivewayId], verification-document.
- **dashboard**: stats.
- **stats**: public.
- **contact**: POST.
- **geocode**: search, reverse (Nominatim proxy).
- **routing**: GET.
- **upload**: image, verification-document.
- **cron**: expire-bookings, complete-bookings (CRON_SECRET).
- **health**: DB health.
- **test*** / **_internal**: dev-only (requireDevelopment()).

**Shared utilities**
- **createApiResponse / createApiError** (`@parkway/shared`): Used by most routes. Geocode routes return custom `{ error, code }`; cron returns plain `{ error: 'Unauthorized' }` for bad CRON_SECRET (P0: standardize where feasible).
- **Validation**: Zod in `@/lib/validations`; routes return `createApiError(..., 400, 'VALIDATION_ERROR')` on failure.
- **Rate limit** (`@/lib/rate-limit`): **login** (login limiter), **geocode/search**, **geocode/reverse** (geocode limiter). Registration and other sensitive routes not rate limited (P0/P1).
- **Auth**: requireAuth, requireAdmin, optionalAuth from `@/lib/auth-middleware`.
- **Dev**: `requireDevelopment()` from `@/lib/api-protection` for test-*, auth/debug, _internal. P0: ensure these are fully disabled in production.

---

## 6. Database (Prisma)

- **Schema**: `packages/database/schema.prisma`. PostgreSQL.
- **Models**: User (roles: DRIVER, OWNER, ADMIN), Driveway (with verification fields), Booking, Review, Favorite, Notification. Enums: UserRole, BookingStatus, PaymentStatus, VerificationStatus.
- **Indexes**: ownerId, verificationStatus on Driveway; drivewayId, userId, status on Booking; etc. **No composite (latitude, longitude)** on Driveway yet (P0: add for geo/search).
- **Migrations**: `packages/database/migrations/`. Commands: `db:migrate` (dev), `db:deploy` (prod), `db:push`, `db:seed`, `db:studio`.
- **Usage**: API routes and server code only; no Prisma in client.

---

## 7. Frontend patterns

- **Layout**: Root layout + `AppLayout` (Navbar, Breadcrumbs, main, Footer). Z-index scale in `tailwind.config.js` (navbar, dropdown, backdrop, overlay, modal, a11y); see `docs/Z_INDEX_SCALE.md`.
- **Routing**: App Router file-based.
- **Components**: `src/components/layout/`, `src/components/ui/` (Button, Card, Input, AddressAutocomplete, MapViewDirect, StripeCheckout, etc.).
- **State**: **useAuth** (user, loading, login/register/logout, requireAuth). Data hooks (e.g. useDriveways, useBookings, useDashboardStats). Zustand available.
- **Forms**: react-hook-form + Zod via `@hookform/resolvers`.
- **API client**: `@/lib/api-client` — fetch with `credentials: 'include'`, base `process.env.NEXT_PUBLIC_API_URL || '/api'`. Returns `{ data }`; errors via `error.response?.data?.message`. No route-level loading/error boundaries (P1: add loading.tsx/error.tsx).

---

## 8. Config & env

- **Where**: Next.js loads from `apps/web/`. Scripts (e.g. promote-admin) read `apps/web/.env.local` for `DATABASE_URL`. Package database uses `process.env.DATABASE_URL`.
- **Public**: `NEXT_PUBLIC_*` (Stripe publishable, GA, Mapbox, API URL, primary market). Rest server-only (DB, JWT, Stripe secret, Cloudinary, email, CRON_SECRET, Redis).
- **Market**: `@/lib/market-config` — `getPrimaryMarket()`, `getMarketBySlug()`, `resolveViewbox()`. Primary from `NEXT_PUBLIC_PRIMARY_MARKET` (default `jersey`). No single central env module (P0: validate required env at startup; P2: document in .env.example).

---

## 9. Testing

- **Unit**: Jest in apps/web (`jest.config.js`, next/jest, jsdom). Tests under `src/__tests__/` (components, hooks, lib, api, app, integration).
- **Integration**: `tests/api/*.test.ts`; server must be running; `test:api`.
- **E2E**: Playwright in `tests/e2e/*.spec.js`; `test:e2e`. Load: k6 in `tests/load/`; `test:load`, `test:load:smoke`.

---

## 10. Docs & scripts

- **Docs**: README, QUICK_START, SECURITY_AUDIT, SEO_MARKETING, PRODUCT_ROADMAP; `docs/` (APP_AUDIT, OWNER_VERIFICATION_RUNBOOK, DRIVEWAY_OWNER_ADDRESS_PROOF_DESIGN, MONITORING, PRE_PRODUCTION_TESTING, Z_INDEX_SCALE, SENIOR_ENGINEER_RECOMMENDATIONS); `docs/professional/` (CODEBASE_ANALYSIS, ERROR_HANDLING, LOCAL_SETUP, MONOREPO, VERCEL_DEPLOYMENT, SUPABASE_SETUP, FOLDER_STRUCTURE, CODEBASE_IMPROVEMENTS).
- **Scripts**: Root `dev`, `build`, `start`, `test`, `test:e2e`, `test:api`, `test:load`, `db:*`, `lint`, `type-check`, `validate-env`, `admin:promote`. Vercel cron: expire-bookings, complete-bookings (CRON_SECRET).

---

## Cross-reference to recommendations

- **P0**: Register rate limit; env validation at startup; createApiError on ad-hoc error routes; Driveway geo index; .env.example + CRON_SECRET; prod-gate test/debug routes.
- **P1**: Token TTL + refresh; CSRF or document; general API rate limiter; route-level loading/error; shared loading/error UI; migration docs.
- **P2**: Validation consistency; feature flags; market from env; logger + request id; replace `any`; bundle analysis + lazy load; a11y; test coverage; architecture docs.

Use this document as the single source of truth for “how the codebase works” before applying the changes in `SENIOR_ENGINEER_RECOMMENDATIONS.md`.
