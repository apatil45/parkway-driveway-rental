# Parkway – Project Brief (Master Reference)

**Use this document with any LLM or tool for:** resume bullets, project summaries, LinkedIn/portfolio text, emails to founders or investors, job applications, cover letters, interview talking points, and technical discussions.

---

## 1. PROJECT IDENTITY

- **Name:** Parkway (Parkway Driveway Rental Platform)
- **Tagline:** Marketplace connecting drivers with available parking spaces; property owners monetize driveways, drivers find affordable parking.
- **Product type:** Two-sided marketplace (B2C) – peer-to-peer driveway/parking rental.
- **Positioning:** Professional driveway rental platform designed for **100% free hosting** (Vercel + Supabase + Cloudinary + OpenStreetMap).
- **Repository / project alias:** driveway-rental, parkway-platform.

---

## 2. BUSINESS & PRODUCT

### What it does
- **Owners:** List driveways with photos, address, location (lat/long), pricing, capacity, car sizes, amenities (e.g. covered, EV charging). Manage listings, bookings, and earnings.
- **Drivers:** Search by location, view results on an interactive map, see availability and pricing, book a slot, pay securely, and manage bookings.
- **Platform:** Handles auth, listings, search, booking lifecycle, payments, reviews, notifications, and favorites.

### Value proposition
- **For owners:** Passive income from unused parking/driveway space.
- **For drivers:** Convenient, often cheaper parking near destination vs. traditional lots.
- **For the project:** Full-stack, production-oriented marketplace built with modern stack and cost-conscious hosting.

### User roles
- **DRIVER** – search, book, pay, review, favorites.
- **OWNER** – create/edit driveways, manage bookings, view earnings.
- **ADMIN** – (schema support; implementation may vary.)

### Key flows
- Register / login (JWT + refresh, httpOnly cookies).
- Search driveways (filters, map, list).
- View driveway detail (map, pricing, availability, reviews, favorite).
- Book (select time range, vehicle info, dynamic price preview).
- Pay (Stripe Payment Intents, webhook for confirmation).
- Post-booking: status updates, reviews, notifications.
- Favorites: save driveways, sync across sessions after login.

---

## 3. TECHNOLOGY STACK

### Frontend
- **Framework:** Next.js 16 (App Router), React 18.
- **Language:** TypeScript (strict).
- **Styling:** Tailwind CSS.
- **Forms & validation:** React Hook Form, Zod.
- **State:** React state/hooks; Zustand where used.
- **Maps:** Leaflet, react-leaflet; direct Leaflet usage in search map (MapViewDirect) to avoid React DOM conflicts.
- **Payments (client):** Stripe (React Stripe.js, Elements).
- **HTTP client:** Axios (withCredentials, interceptors, refresh token handling).
- **Icons:** Heroicons.

### Backend (API)
- **Runtime:** Node.js (Next.js API routes = serverless functions on Vercel).
- **API style:** REST; route handlers in `apps/web/src/app/api/*` (GET, POST, PATCH, DELETE).
- **Auth:** JWT access + refresh tokens; bcrypt password hashing; `requireAuth` middleware; cookie-based session.
- **Validation:** Zod schemas (shared in `lib/validations.ts`).
- **Errors:** Centralized `createApiError` / `createApiResponse`; structured logging; ErrorBoundary + user-friendly messages.

### Database
- **ORM:** Prisma.
- **Database:** PostgreSQL (e.g. Supabase).
- **Models:** User, Driveway, Booking, Review, Favorite, Notification (with relations, indexes, cascade deletes).
- **Migrations:** Prisma Migrate; migrations in `packages/database/migrations`.

### External services
- **Database:** Supabase (PostgreSQL).
- **Payments:** Stripe (Payment Intents, webhooks for confirmation).
- **Storage (images):** Cloudinary.
- **Maps:** OpenStreetMap (tiles, optional geocoding e.g. Nominatim).
- **Hosting:** Vercel (Next.js + serverless APIs).

### DevOps & quality
- **Monorepo:** npm workspaces; Turborepo (build/lint/test pipelines).
- **CI:** GitHub Actions – unit tests, integration tests (Postgres service), E2E (Playwright), lint, type-check; optional coverage upload (e.g. Codecov).
- **Cron (Vercel):** expire-bookings (daily), complete-bookings (daily).
- **Security:** CSP and other headers in Next config; middleware for auth/protection where applicable.

### Packages (monorepo)
- **apps/web** – Next.js app (frontend + API routes).
- **packages/database** – Prisma schema, client, migrations, seed.
- **packages/shared** – Shared TypeScript types and utilities used by app and database.

---

## 4. ARCHITECTURE HIGHLIGHTS

- **Monorepo:** Single repo; shared packages keep types and DB client in sync.
- **Serverless-first:** No long-lived server; stateless API routes; DB and external services hold state.
- **API design:** Consistent JSON responses (e.g. `{ data, message, success }`); standardized errors (message, code, statusCode).
- **Map handling:** Dedicated empty div for Leaflet so React does not reconcile map DOM (avoids “removeChild” / NotFoundError).
- **Pricing:** Server-side and client-side pricing service (base price, duration, optional surge/time/day multipliers; minimum price and duration enforced).

---

## 5. FEATURES (IMPLEMENTED)

- **Authentication:** Register, login, logout, refresh, /auth/me, profile; role-based (DRIVER, OWNER, ADMIN).
- **Driveways:** CRUD; list with pagination/filters; detail page with map, gallery, pricing, reviews, favorites button.
- **Search:** Location-based search; filters; list + map view; map markers and popups.
- **Bookings:** Create (with vehicle info, time range); list; detail; cancel; status (PENDING, CONFIRMED, CANCELLED, COMPLETED, EXPIRED).
- **Payments:** Stripe Payment Intents; webhook for payment confirmation; payment status on booking.
- **Reviews:** Create (post-booking); list by driveway; ratings and comments.
- **Notifications:** In-app notifications; mark read; mark all read.
- **Favorites:** Add/remove driveway to favorites; list favorites; favorite button on driveway detail; state synced after login.
- **Dashboard:** User stats (e.g. bookings count).
- **Cron:** Auto-expire and auto-complete bookings on a schedule.
- **Image upload:** Cloudinary integration for driveway images.
- **Address/place:** Address autocomplete (e.g. OpenStreetMap Nominatim) for listing creation.

---

## 6. INITIATIVE & NOVELTY

- **Full marketplace lifecycle:** End-to-end flow from signup → search → book → pay → review, with real payments and webhooks.
- **100% free hosting strategy:** Documented and architected for Vercel + Supabase + Cloudinary + OSM to keep operational cost at $0 for small/medium scale.
- **Dynamic pricing:** Time-of-day and day-of-week multipliers; optional demand/surge; minimum price and duration; transparent breakdown on frontend.
- **Production-oriented patterns:** Structured errors, auth middleware, Zod validation, Prisma best practices, security headers, cron for booking state.
- **Favorites feature:** Full stack (DB model, migrations, API GET/POST/DELETE, validation, UI component, sync after login).
- **Map stability:** Fixes for React + Leaflet DOM conflicts (empty map container) and clearer error handling for map-related failures.

---

## 7. METRICS & SCALE (APPROXIMATE)

- **Source:** ~130+ TS/TSX files (e.g. 65 TS, 65 TSX in analysis).
- **API routes:** 35+ route files (auth, driveways, bookings, payments, reviews, notifications, favorites, dashboard, cron, health, test/debug).
- **Database models:** 6 (User, Driveway, Booking, Review, Favorite, Notification) with indexes and relations.
- **Testing:** Unit (Jest, React Testing Library), integration (API tests with Postgres), E2E (Playwright); CI runs unit, integration, E2E, lint, type-check.
- **Docs:** Professional docs (feasibility, codebase analysis, deployment, guides for Supabase, Vercel, Stripe, env setup, error handling).

---

## 8. ENVIRONMENT & DEPLOYMENT

- **Env vars (typical):** DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, STRIPE_SECRET_KEY, Cloudinary (cloud name, API key, secret), FRONTEND_URL / NEXT_PUBLIC_* as needed.
- **Build:** `npm run build` (packages → db:generate → apps/web build).
- **Deploy:** Vercel (Git-based); Prisma migrations run separately (e.g. `prisma migrate deploy`) against production DB.
- **Database:** Supabase PostgreSQL; connection string in env; migrations in repo.

---

## 9. DOCUMENTATION & QUALITY

- **README:** Overview, features, getting started, project structure, scripts, env template.
- **Docs:** Feasibility analysis, senior SDE codebase analysis, deployment plan, Vercel/Supabase/Stripe/error-handling guides, next steps prioritized.
- **Code quality:** TypeScript strict; ESLint; consistent API and error patterns; Prisma type safety.
- **Assessment (from internal analysis):** “Production ready with strategic improvements”; security and performance enhancements identified and documented.

---

## 10. SAMPLE USE PHRASES FOR RESUMES / LINKEDIN / COVER LETTERS

- “Built **Parkway**, a **two-sided marketplace** for driveway/parking rental: **Next.js 16**, **TypeScript**, **Prisma/PostgreSQL**, **Stripe**, and **Leaflet**; designed for **$0 hosting** (Vercel + Supabase + Cloudinary).”
- “Implemented **end-to-end booking and payment flows** (Stripe Payment Intents + webhooks), **dynamic pricing**, **favorites**, **reviews**, and **notifications** in a **monorepo** with **REST APIs** and **serverless** deployment.”
- “Owned **full-stack features** (auth, search, map, bookings, payments, favorites) with **Zod** validation, **JWT** auth, **error handling**, and **CI** (unit, integration, E2E with Playwright).”
- “Designed **React + Leaflet** map integration to avoid DOM conflicts and **production-ready error handling** for map and API errors.”

---

## 11. SAMPLE USE FOR EMAILS TO FOUNDERS / COMPANIES

- “I built **Parkway**, a **peer-to-peer driveway rental platform** (like Airbnb for parking): owners list driveways, drivers search and book with **Stripe** payments, **dynamic pricing**, and **reviews**. The stack is **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL**, deployed **serverless on Vercel** with a **$0 hosting** approach. I’d be interested in [role / collaboration / feedback] because…”
- “The project includes **35+ API endpoints**, **full auth and booking lifecycle**, **Stripe integration**, **map-based search**, and **CI with unit, integration, and E2E tests**. I’m looking to [expand scale / add features / join a team working on marketplaces or full-stack products].”

---

## 12. TECHNICAL KEYWORDS (FOR JOB APPLICATIONS / ATS)

Next.js, React, TypeScript, Node.js, REST API, Prisma, PostgreSQL, Supabase, Stripe, JWT, serverless, Vercel, Tailwind CSS, Zod, monorepo, Turborepo, GitHub Actions, Playwright, Jest, two-sided marketplace, payment integration, dynamic pricing, Leaflet, Cloudinary.

---

*Last updated from codebase and docs. Adjust dates and metrics as the project evolves.*
