# Parkway (Driveway Rental) — Interview Study Guide

A single reference for walking through the full architecture, REST APIs, DB transactions, JWT auth, tests, and Turborepo. Use this to prepare for technical discussions.

---

## 1. Full Architecture End-to-End

### High-level stack

- **Frontend:** Next.js 16 (App Router), React 18, Tailwind, Leaflet (maps), Stripe Elements (payments)
- **Backend:** Next.js API Routes (serverless on Vercel), Node runtime
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT in httpOnly cookies (access + refresh)
- **Payments:** Stripe (Payment Intents + webhooks)
- **Monorepo:** npm workspaces + Turborepo

### Request flow (typical)

1. **User action** (e.g. “Book this driveway”)
   - Client uses **fetch-based** `apiClient` (`@/lib/api-client`) with `credentials: 'include'` so cookies are sent.
2. **Next.js**
   - Request hits an API route under `apps/web/src/app/api/...`. Middleware at `apps/web/middleware.ts` adds security headers (no auth there; auth is per-route).
3. **API route**
   - Protected routes call `requireAuth(request)` from `@/lib/auth-middleware`, which reads `access_token` cookie and verifies JWT. On 401, frontend can call `POST /api/auth/refresh` and retry.
   - Route uses **Prisma** (`@parkway/database`) for DB access. For booking creation and payment intent, routes use **Prisma `$transaction`** to avoid race conditions.
   - Response uses shared shape: `createApiResponse(data, message)` or `createApiError(message, statusCode, code)` from `@parkway/shared`.
4. **Client**
   - `apiClient` returns `{ data }` where `data` is the full JSON body. Pages/hooks use `response.data.data` for the payload.

### Data flow (booking + payment)

1. **Create booking:** `POST /api/bookings` — validated with Zod (`createBookingSchema`), pricing via `PricingService`, **capacity check and booking creation inside a single Prisma transaction** (only CONFIRMED + COMPLETED count toward capacity). Booking is created as PENDING/PENDING; no PaymentIntent yet.
2. **Checkout:** Frontend calls `POST /api/payments/intent` with `bookingId`. Backend runs a **transaction**: load booking, verify ownership, reject if already paid/cancelled/expired, then either retrieve existing Stripe PaymentIntent or create one and **update `paymentIntentId` on the booking in the same transaction**. Returns `clientSecret` for Stripe Elements.
3. **Payment:** User pays in the browser; Stripe sends `payment_intent.succeeded` to `POST /api/payments/webhook`. Webhook verifies signature, finds booking by `paymentIntentId`, updates `paymentStatus: COMPLETED`, `status: CONFIRMED`, and sends emails.

### Packages (monorepo)

- **`apps/web`** — Next.js app (UI + API routes)
- **`packages/database`** — Prisma schema, client export (`prisma`), migrations
- **`packages/shared`** — Shared types and helpers (`createApiResponse`, `createApiError`, etc.)

---

## 2. REST APIs — Design Decisions & Structure

There are **dozens of REST endpoints** (roughly 28+ if you count each logical resource + method). Below is the structure and rationale.

### API design principles

- **Consistent response shape:** Success: `{ success: true, data, message?, statusCode }`. Error: `{ success: false, message, error?, statusCode }` via `createApiResponse` / `createApiError` from `@parkway/shared`.
- **Auth:** Protected routes use `requireAuth(request)`; optional auth (e.g. search) uses `optionalAuth(request)`.
- **Validation:** Zod schemas (`@/lib/validations`) — e.g. `createBookingSchema`, `loginSchema`, `registerSchema`. Return 400 with a clear message on failure.
- **Errors:** Stable `error` codes (e.g. `VALIDATION_ERROR`, `CAPACITY_EXCEEDED`, `NO_TOKEN`, `TOKEN_EXPIRED`) for client handling.

### Auth

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Register; returns user + sets access + refresh cookies |
| POST | `/api/auth/login` | Login; same |
| POST | `/api/auth/logout` | Clear auth cookies |
| GET | `/api/auth/me` | Current user (JWT from cookie) |
| POST | `/api/auth/refresh` | New access token from refresh_token cookie |
| GET/PUT | `/api/auth/profile` | Get/update profile |

**Design:** JWT in **httpOnly cookies** (`access_token`, `refresh_token`). Access short-lived (15 min cookie; refresh 30 days). Login/register rate-limited via `@/lib/rate-limit`.

### Bookings

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/bookings` | List bookings (driver or owner), pagination + optional status filter |
| POST | `/api/bookings` | Create booking (validated, priced, **transaction** for capacity + create) |
| GET | `/api/bookings/[id]` | Get one booking |
| PATCH | `/api/bookings/[id]` | Update (e.g. cancel) |
| DELETE | `/api/bookings/[id]` | Delete |

### Driveways

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/driveways` | List (search/filters, pagination) |
| POST | `/api/driveways` | Create (auth required) |
| GET | `/api/driveways/[id]` | Get one |
| PUT | `/api/driveways/[id]` | Update |
| DELETE | `/api/driveways/[id]` | Delete |

### Payments

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/payments/intent` | Get or create Stripe PaymentIntent for a booking (**transaction**: read booking, maybe create intent, update `paymentIntentId`) |
| POST | `/api/payments/webhook` | Stripe webhook (signature verification; then update booking status + emails) |
| POST | `/api/payments/verify` | Client-side “verify payment” after redirect (optional; webhook is source of truth) |

### Favorites, Reviews, Notifications

- **Favorites:** GET/POST `/api/favorites`, DELETE `/api/favorites/[drivewayId]`
- **Reviews:** GET/POST `/api/reviews`, GET/DELETE `/api/reviews/[id]`
- **Notifications:** GET `/api/notifications`, PATCH `/api/notifications/[id]`, POST `/api/notifications/mark-all-read`

### Other

- **Dashboard:** GET `/api/dashboard/stats` (role-based stats)
- **Public stats:** GET `/api/stats/public`
- **Contact:** POST `/api/contact`
- **Upload:** POST `/api/upload/image`
- **Routing:** GET `/api/routing` (e.g. directions)
- **Health:** GET `/api/health`
- **Cron:** `/api/cron/expire-bookings`, `/api/cron/complete-bookings` (scheduled jobs)

**Structure:** Next.js App Router file-based routing: `app/api/<resource>/route.ts` (GET/POST) and `app/api/<resource>/[id]/route.ts` (GET/PUT/PATCH/DELETE). One route file per path; methods are named exports (`GET`, `POST`, etc.).

---

## 3. Race Conditions & DB Transactions

### Where races can happen

1. **Booking creation:** Two users book the same driveway for overlapping times. Without a transaction, two requests could both see “capacity available” and then both create a booking, overbooking.
2. **Payment intent:** Two tabs or retries could create two PaymentIntents for the same booking and double-charge or leave inconsistent state.

### How it’s handled: Prisma `$transaction`

- **Prisma interactive transactions** run a callback with a transactional client `tx`. All reads/writes inside the callback are in one DB transaction (serializable isolation in Postgres by default). If any step throws, the whole transaction rolls back.

### Booking creation (`POST /api/bookings`)

```ts
const booking = await prisma.$transaction(async (tx: TransactionClient) => {
  // 1. Count overlapping CONFIRMED + COMPLETED bookings
  const overlappingCount = await tx.booking.count({
    where: {
      drivewayId,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      AND: [
        { startTime: { lt: end } },
        { endTime: { gt: start } }
      ]
    }
  });
  if (overlappingCount >= (driveway.capacity || 1)) {
    throw new Error('CAPACITY_EXCEEDED');
  }
  // 2. Create booking atomically
  return await tx.booking.create({ data: { ... } });
});
```

- **Design choice:** Only **CONFIRMED** (paid) bookings reserve capacity. PENDING does not; so no overbooking when many users have “pending” carts.
- **Error handling:** Route catches `CAPACITY_EXCEEDED` and returns 409 with a clear message.

### Payment intent (`POST /api/payments/intent`)

```ts
const result = await prisma.$transaction(async (tx: TransactionClient) => {
  const booking = await tx.booking.findUnique({ where: { id: bookingId }, ... });
  if (!booking || booking.userId !== userId) throw ...;
  if (booking.paymentStatus === 'COMPLETED') throw new Error('ALREADY_PAID');
  // Retrieve existing Stripe PaymentIntent or create new one
  // If create: stripe.paymentIntents.create(...); then
  await tx.booking.update({ where: { id: bookingId }, data: { paymentIntentId: intent.id } });
  return { clientSecret, amount, retrieved };
});
```

- **Idempotency:** If the booking already has a `paymentIntentId`, the code tries to **retrieve** that intent and return its `client_secret`; only if that fails does it create a new one and update the row in the **same transaction**, so the DB never points to an intent that wasn’t stored.

### Typing the transaction client

```ts
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
```

- The callback receives `tx` typed as `TransactionClient` so you use the same API as `prisma` but all operations are in the transaction.

### Webhook

- Webhook does **not** use an interactive transaction; it does `findFirst` by `paymentIntentId`, then `updateMany` with status checks. Idempotent and safe for Stripe’s retries; the “single source of truth” for “who paid” is the webhook event + DB update.

---

## 4. JWT Auth Implementation

### Overview

- **Access token:** JWT, payload `{ id: userId }`, signed with `JWT_SECRET`. Used for API auth.
- **Refresh token:** JWT, payload `{ id, type: 'refresh' }`, signed with `JWT_REFRESH_SECRET` (or `JWT_SECRET`). Used only to get a new access token.
- **Storage:** Both in **httpOnly cookies** (`access_token`, `refresh_token`) so JavaScript cannot read them (XSS mitigation). Cookies are set with `secure`, `sameSite: 'lax'`, and appropriate `path`/`maxAge`.

### Token issuance (login/register)

- **Login** (`POST /api/auth/login`): Validate body with `loginSchema`, find user, compare password with bcrypt, then:
  - `generateToken(userId)` → `jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })`
  - `generateRefreshToken(userId)` → `jwt.sign({ id, type: 'refresh' }, JWT_REFRESH_SECRET || JWT_SECRET, { expiresIn: '30d' })`
  - `setAuthCookies(res, token, refreshToken, request)` sets:
    - `access_token`: maxAge 15 minutes (so even though the JWT payload may have 7d, the cookie expires sooner and the client must refresh).
    - `refresh_token`: maxAge 30 days.

- **Register** (`POST /api/auth/register`): Same token generation and cookie setting after creating the user (and disallowing `ADMIN` in `roles`).

### Token verification (protected routes)

- **`verifyAuth(request)`** in `@/lib/auth-middleware`:
  1. Reads `request.cookies.get('access_token')?.value`.
  2. If missing → return 401 `NO_TOKEN`.
  3. `jwt.verify(token, JWT_SECRET)`.
  4. If expired → 401 `TOKEN_EXPIRED`; if invalid → 401 `INVALID_TOKEN`.
  5. Ensures `decoded.id` exists; returns `{ success: true, userId: decoded.id }`.

- **`requireAuth(request)`** = same as `verifyAuth`; used at the start of protected handlers. **`optionalAuth(request)`** returns `userId` if present and does not fail if no token.

### Refresh flow

- **POST /api/auth/refresh**: Reads `refresh_token` cookie, verifies with `JWT_REFRESH_SECRET` (or `JWT_SECRET`), then issues a **new access token** (e.g. 15m), sets it in `access_token` cookie, returns 200. No new refresh token in this codebase (sliding refresh can be added later).

### Frontend

- **useAuth:** Calls `GET /api/auth/me` (sends cookies). On 401, calls `POST /api/auth/refresh` and retries `/me` once. Handles timeout and sets user/unauthenticated state.
- **apiClient:** All requests use `credentials: 'include'` so cookies are sent to same-origin API routes.

### Security details

- **Fail fast:** Login/register return 503 if `JWT_SECRET` is not set.
- **Rate limiting:** Login (and optionally register) use rate limiters from `@/lib/rate-limit` to limit brute force.
- **Cookies:** `getCookieConfig(request)` in `@/lib/cookie-utils` sets `secure` in production/HTTPS and `sameSite: 'lax'`; domain is set only for custom domains (not for *.vercel.app) so cookies work on Vercel.

---

## 5. Tests — What You Tested and Why

The app uses **Jest** for unit/integration tests in `apps/web/src/__tests__/`, with **Playwright** for E2E. Coverage thresholds (in `jest.config.js`) are 80% for branches, functions, lines, and statements.

### Test layout

- **`__tests__/lib/`** — Auth middleware, validations, API helpers, rate limit, CSRF, sanitize, date validation.
- **`__tests__/api/`** — API route behavior (e.g. cron).
- **`__tests__/components/`** — UI components (Button, Card, Input, MapView, NotificationCenter, etc.) and layout (AppLayout, Breadcrumbs, Footer).
- **`__tests__/app/`** — Page-level: search, bookings, driveway/booking.
- **`__tests__/hooks/`** — useAuth, useApi.
- **`__tests__/integration/`** — Booking flow integration.

### What’s tested and why

1. **Auth middleware (`auth-middleware.test.ts`)**  
   - Valid token → success and `userId`.  
   - No token / wrong secret / expired / invalid signature / payload without `id` → appropriate 401 and error codes.  
   - **Why:** Auth is the gate for all protected APIs; bugs here affect security and UX.

2. **Validations (`validations.test.ts`)**  
   - Zod schemas: login (email, min password length), register (name length, password complexity, roles), booking, driveway, review.  
   - **Why:** Invalid input must be rejected with clear messages; one place to lock behavior.

3. **API client / API behavior (`api.test.ts`, `cron.test.ts`)**  
   - Token refresh, error handling, request behavior; cron route logic if present.  
   - **Why:** Centralized client and critical server behavior must be reliable.

4. **Rate limit & CSRF (`rate-limit.test.ts`, `csrf.test.ts`)**  
   - Limits and CSRF checks.  
   - **Why:** Protection against abuse and cross-site attacks.

5. **Date validation (`date-validation.test.ts`)**  
   - Time ranges, duration limits, timezone/price behavior.  
   - **Why:** Bookings are time-based; wrong dates cause overbooking or bad pricing.

6. **UI components (Button, Card, Input, MapView, etc.)**  
   - Render, accessibility, key interactions.  
   - **Why:** Design system and critical UI (e.g. map, forms) must behave consistently.

7. **Pages (search, bookings, driveway/booking)**  
   - Data loading, filters, actions, error states.  
   - **Why:** User journeys (search → book → pay) must not break.

8. **Hooks (useAuth, useApi)**  
   - Auth state, refresh flow, API usage.  
   - **Why:** Hooks are the bridge between API and UI; bugs cause silent failures or wrong state.

9. **Error boundaries (`ErrorBoundary.test.tsx`, `ErrorBoundary.map.test.tsx`)**  
   - Map and general error handling and recovery.  
   - **Why:** Graceful degradation and recovery in production.

### Count (“227 tests”)

- The **227** number likely refers to total **test cases** (e.g. `it(...)` / `test(...)`), not files. You can say: “We have hundreds of unit/integration tests across lib, API, components, pages, and hooks, with 80% coverage thresholds, plus E2E with Playwright for critical flows.”

---

## 6. Turborepo Monorepo Setup

### Structure

- **Root `package.json`:**  
  - `"workspaces": ["apps/*", "packages/*"]` (npm workspaces).  
  - Scripts: `dev`, `build`, `test`, `lint`, `db:generate`, `db:migrate`, etc., often delegating to `apps/web` or `packages/database`.  
  - `postinstall`: runs `db:generate` so Prisma client is available after install.

- **`turbo.json`:**  
  - **Pipeline:**  
    - `build`: `dependsOn: ["^build"]` (build dependencies first), `outputs: [".next/**", "dist/**"]`.  
    - `dev`: `cache: false`, `persistent: true`.  
    - `test`: `dependsOn: ["build"]`, `outputs: ["coverage/**"]`.  
    - `lint`, `type-check`: `dependsOn: ["^build"]`.  
  - **globalDependencies:** `["**/.env.*local"]` so env changes invalidate caches.

### Build order

- Turborepo runs `build` in dependency order: e.g. `packages/database` and `packages/shared` build first (they have `build` producing `dist/`), then `apps/web` (which depends on them via workspace refs).

### Why Turborepo

- **Caching:** Re-runs only what changed.  
- **Parallelism:** Independent tasks run in parallel.  
- **Single CLI:** `turbo run build`, `turbo run test`, etc., from root.  
- **Clear dependencies:** `^build` ensures packages are built before the app.

### Package dependency flow

- **apps/web** depends on **@parkway/database** and **@parkway/shared** (via `file:../../packages/...`).  
- **packages/database** uses Prisma (schema in package); **packages/shared** is TypeScript-only.  
- Root scripts often `cd` into the relevant app/package and run npm scripts; Turborepo is used for `turbo run build` / `test` / `lint` when you want cached, dependency-aware runs.

---

## Quick Interview Cheat Sheet

- **Architecture:** Next.js (App Router) + API routes, Prisma + Postgres, JWT in httpOnly cookies, Stripe, monorepo (apps + packages).
- **APIs:** Consistent JSON shape, Zod validation, `requireAuth`/optionalAuth, ~28+ endpoints across auth, bookings, driveways, payments, favorites, reviews, notifications, dashboard, cron.
- **Race conditions:** Prisma `$transaction` for booking create (capacity check + create) and payment intent (read + create/retrieve intent + update `paymentIntentId`). Only CONFIRMED bookings reserve capacity.
- **JWT:** Access (short-lived cookie) + refresh (long-lived); verify in `auth-middleware`; refresh endpoint issues new access token; cookies httpOnly, secure, sameSite.
- **Tests:** Jest for unit/integration (lib, API, components, pages, hooks); 80% coverage; Playwright E2E; focus on auth, validations, booking flow, and critical UI.
- **Turborepo:** npm workspaces + Turbo pipeline; `^build` and caching; `packages/database` and `packages/shared` built before `apps/web`.

Good luck in your interview.
