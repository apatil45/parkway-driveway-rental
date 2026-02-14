# Parkway App – Full Audit Report

**Scope:** UI, design, facts, logic, syntax, and consistency across the web app.  
**Date:** 2025-02-07.

---

## 1. Architecture & Data Flow

### 1.1 API client

- **Client:** `@/lib/api-client` is fetch-based and used by all app pages and hooks. Response shape: `{ data: json }` where `json` is the full body (e.g. `{ success, data, message, statusCode }` from `createApiResponse`). Consumers correctly use `response.data.data` for payload.
- **Tests:** Several tests import `@/lib/api` (axios) for mocking. That’s intentional (axios in tests, fetch in app).
- **Contact API:** `POST /api/contact` returns plain `{ message }` (no `createApiResponse`). Client only checks for success (no throw), so behavior is correct but **inconsistent** with the rest of the API.

**Recommendation:** Have contact route return `createApiResponse({}, 'Email sent successfully')` and optionally keep reading `response.data.message` or ignore for success-only flow.

### 1.2 Auth

- **Middleware:** `requireAuth` / `verifyAuth` in `@/lib/auth-middleware` are used by protected API routes. JWT in `access_token` cookie; refresh in `refresh_token`.
- **useAuth:** Calls `/auth/me`; on 401 tries refresh then retries. 10s timeout then assumes unauthenticated. Login/register set cookies via API; logout POSTs and redirects to `/`.
- **Facts:** Login uses `loginSchema` (email + min 8 char password). Register uses `registerSchema` (name, email, password with complexity, roles). Passwords hashed with bcryptjs; JWT 7d, refresh 30d.

### 1.3 Booking & payment flow

- **Create booking:** `POST /bookings` validates body with `createBookingSchema`, checks driveway exists/active/not own, time in future, end > start, `PricingService.validateDuration`, dynamic pricing, capacity (CONFIRMED + COMPLETED only), then creates PENDING/PENDING. No payment intent created in POST (created at checkout).
- **Payment intent:** `POST /api/payments/intent` with `bookingId` loads booking, verifies `userId`, rejects if already paid or CANCELLED/EXPIRED, retrieves or creates Stripe PaymentIntent, updates `paymentIntentId` in DB in same transaction. Logic is correct; Stripe required for booking payments.
- **Webhook:** (Not fully read) Completes payment and confirms booking; referenced in dashboard stats and booking list.
- **Facts:** Only CONFIRMED + payment COMPLETED count toward capacity. PENDING does not reserve a spot.

---

## 2. UI & Design

### 2.1 Design system (globals.css)

- **Tokens:** CSS variables for primary (blue) scale and surface/border. Dark mode variables exist; no `class="dark"` toggle in layout found.
- **Components:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.input`, `.card`, `.skeleton`; min-height 44px on btn/input for touch; `focus-visible` outline; `.skip-nav` for a11y.
- **Typography:** Base uses Inter (Next font); `h1`–`h3` and `p` scaled in `@layer base`.

### 2.2 Layout

- **Root layout:** ErrorBoundary → ToastProvider → min-h-screen wrapper; no navbar/footer in layout (they’re in AppLayout).
- **AppLayout:** Used by most pages; wraps children with Navbar + main + Footer. No `showFloatingActions` (removed).
- **Navbar:** Sticky, z-30, hidden on `/login` and `/register`. Desktop: logo, nav links, SearchBar, Dashboard/Profile, NotificationCenter, UserMenu (or Sign In/Sign Up). Mobile: hamburger → MobileMenu. Structure: header > container > flex > [Logo, nav, Right Side div (Desktop Auth div + mobile button)]. Four nested divs; four closing divs – correct.
- **Footer:** Four columns (Brand, For Drivers, For Owners, Support); links and copyright. Correct.

### 2.3 Pages (summary)

- **Home:** Hero, CTA, featured driveways (if any), uses api-client and AppLayout.
- **Search:** Map + list; filters; list open by default; constants for navbar/search height; ErrorBoundary around map/list; device plan applied (list overlay on mobile).
- **Driveway detail:** Booking form, pricing preview, FavoriteButton, reviews, ImageWithPlaceholder; auth-gated booking.
- **Bookings:** Device plan implemented (thumbnail, one-line date, status label, host + tap-to-call, collapsible details, 44px actions, pagination); filter default CONFIRMED.
- **Dashboard:** Stats (total/active/completed bookings, earnings for owner, average rating); role-based cards; refresh; recent activity from notifications.
- **Checkout:** Fetches booking by ID, StripeCheckout with clientSecret; redirect to login with return URL when not authenticated.
- **Contact:** Form (name, email, type, subject, message); contact info and FAQ cards; inputs use custom classes (not `.input`) – consider `.input` for consistency and 44px height.
- **Login/Register:** Card layout, react-hook-form + zod; login redirect uses `decodeURIComponent(redirect)` – can throw on malformed query; wrap in try/catch and fallback to `/dashboard`.

### 2.4 Consistency

- **Buttons:** Mix of `<Button>` component and raw `<button>` / `<Link>` with classes. Contact submit and some CTAs use raw buttons; most primary actions use `btn btn-primary` or `Button`.
- **Forms:** Login/register use Input + zod; contact uses uncontrolled inputs with local state; driveway edit/new and booking form use mixed patterns. Using `.input` and shared `Input` where possible would help touch targets and consistency.
- **Cards:** `Card` from UI used on dashboard, contact, search; booking cards are custom `<article>` with border/surface. Fine.
- **Errors:** `createAppError` and `getUserFriendlyMessage` used in many places; toasts and inline messages are consistent.

---

## 3. Logic & Facts

### 3.1 Dashboard stats (already updated)

- Total bookings: user as guest or host.
- Active: same scope, status PENDING or CONFIRMED.
- Completed-or-confirmed: same scope, CONFIRMED or COMPLETED.
- Total earnings: owner only, paymentStatus COMPLETED.
- Average rating: owner = avg reviews on their driveways; driver = avg reviews on driveways they’ve completed (COMPLETED bookings). Null when no reviews.

### 3.2 Bookings list

- GET `/bookings`: user as driver or driveway owner; optional `status` filter; pagination. Response includes driveway and owner (id, name, phone). Correct.

### 3.3 Driveways

- Schema: title, description, address, lat/lng, pricePerHour, capacity, carSize, amenities, images, isActive, isAvailable. Validation in `createDrivewaySchema` / `updateDrivewaySchema` matches.
- Image upload: Client does not set `Content-Type: multipart/form-data` (boundary set by browser). Correct.

### 3.4 Reviews

- One review per user per driveway (unique); rating 1–5; optional comment. Create review schema and API usage align.

### 3.5 Favorites

- Toggle by drivewayId; unique (userId, drivewayId). API and FavoriteButton usage consistent.

---

## 4. Syntax & Types

### 4.1 TypeScript

- **Booking status:** API and components use string literals `'PENDING'`, `'CONFIRMED'`, etc. Prisma enum exists; dashboard stats use `as const` arrays. No issues.
- **Dashboard stats:** `averageRating: number | null`; `completedOrConfirmedBookings`, `totalEarningsScope` added and used correctly.
- **Driveway types:** `@/types/driveway` and inline interfaces in pages; some duplication (e.g. Driveway in driveway/[id] vs shared type). Optional: centralize in `types/driveway.ts`.

### 4.2 Validation

- **Zod:** loginSchema, registerSchema, createDrivewaySchema, createBookingSchema, bookingQuerySchema, createReviewSchema, drivewaySearchSchema, etc. Used in API routes with `safeParse` and user-facing messages. Coherent.

### 4.3 Linting

- No linter errors reported in the files that were edited or inspected. Bookings page and dashboard stats route are clean.

---

## 5. Security & Resilience

### 5.1 Middleware

- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection; HSTS in production. Matcher excludes api, _next/static, _next/image, favicon. Correct.

### 5.2 Auth

- Protected routes use `requireAuth`; 401 returns JSON error. Login rate-limited via `rateLimiters.login`. Passwords not logged.

### 5.3 API

- Contact route does not use `createApiError`; returns plain `{ message }` and 500 with error message in body. Consider sanitizing and using createApiError for consistency and to avoid leaking stack/env in production.

---

## 6. Checkout & fetch vs axios

- **Checkout page** uses api-client (fetch). On failure, `handleResponse` throws with `err.response = { status, data }`. There is no `err.code` (that’s axios). The code checks `!err.response` then `err.code === 'ECONNABORTED'` / `ERR_NETWORK`; for fetch those are never true, so it always falls back to “Unable to connect to the server. Please try again.” Behavior is correct; the `err.code` branches are dead code and can be removed for clarity.

---

## 7. Contact API response shape

- Contact POST returns `{ message: '...' }` with status 200. Client does not read the body for success; it only relies on no throw. So success path is fine. Error path: API returns 400/500 with `{ message }`; client uses `error.response?.data?.message`. Works. Aligning with `createApiResponse` / `createApiError` would still improve consistency.

---

## 8. Recommendations Summary

| Priority | Item | Action |
|----------|------|--------|
| Medium | Login redirect | Wrap `decodeURIComponent(redirect)` in try/catch; on error use `/dashboard`. |
| Medium | Contact API | Return `createApiResponse` and use `createApiError` for errors. |
| Low | Contact form inputs | Use `.input` class (or `Input` component) for 44px height and consistency. |
| Low | Checkout error handling | Remove unreachable `err.code === 'ECONNABORTED'` / `ERR_NETWORK` branches or document that they’re for future axios use. |
| Low | Driveway types | Consider centralizing in `@/types/driveway` to avoid duplication. |

---

## 9. What’s in good shape

- **Auth flow:** Login, register, refresh, logout, and protected routes are consistent and use cookies + JWT correctly.
- **Booking creation:** Validation, pricing, capacity, and transaction handling are correct.
- **Payment intent:** Booking ownership, status checks, and idempotent retrieve/create are correct.
- **Dashboard stats:** Definitions and role-based behavior (including driver “avg rating of booked driveways”) are correct and implemented.
- **Device plan (bookings):** Responsive layout, thumbnails, status label, host + tap-to-call, collapsible details, 44px actions, and pagination are implemented.
- **Error handling:** `createAppError` and user-facing messages are used across the app.
- **Accessibility:** focus-visible, skip-nav, aria-labels where checked; 44px touch targets in globals and bookings.
- **Search:** Layout constants, list/map behavior, and filters align with the intended UX.

This audit reflects the codebase as of the review; any later changes may need a quick re-check on the items above.
