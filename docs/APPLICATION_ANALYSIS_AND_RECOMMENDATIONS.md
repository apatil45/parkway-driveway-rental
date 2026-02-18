# Parkway – Application Analysis & Recommendations

**Purpose:** Align the app with the business/project idea; identify what is logical, what should be changed, and what should be removed.  
**Reference:** `docs/PROJECT_BRIEF.md` (two-sided marketplace: drivers book driveways, owners earn; JWT auth, Stripe, Prisma/PostgreSQL, serverless).

---

## 1. What Is Logical and Aligned

### 1.1 Core business flows
- **Auth:** Register (DRIVER/OWNER only in UI), login, refresh, logout, profile. Matches “JWT + refresh, httpOnly cookies.”
- **Driveways:** CRUD, pricePerHour, capacity, carSize, amenities, images, lat/lng. Matches “list driveways with photos, address, pricing, capacity, amenities.”
- **Search:** Location-based, filters (price, etc.), list + map. Matches “search by location, view on map.”
- **Bookings:** Create with time range + vehicle info, status lifecycle (PENDING → CONFIRMED/EXPIRED/CANCELLED/COMPLETED). Matches “book slot, pay securely.”
- **Payments:** Stripe Payment Intents, webhook to confirm booking. Matches “Stripe Payment Intents, webhook for confirmation.”
- **Reviews:** One per user per driveway; API enforces “only if user has COMPLETED booking for this driveway.” Matches “post-booking reviews.”
- **Favorites:** Toggle by driveway, synced after login. Matches “save driveways, sync across sessions.”
- **Notifications:** In-app, mark read. Matches “notifications” in brief.
- **Dashboard:** Stats by role (bookings, earnings for owners, average rating for drivers/owners). Matches “manage listings, bookings, earnings.”
- **Cron:** expire-bookings (PENDING unpaid → EXPIRED), complete-bookings (CONFIRMED past endTime → COMPLETED). Matches “booking lifecycle.”

### 1.2 Data model
- **Schema:** User, Driveway, Booking, Review, Favorite, Notification with sensible relations and indexes. Booking has totalPrice, paymentStatus, paymentIntentId; Driveway has pricePerHour, capacity, amenities. Aligned with product.

### 1.3 Pricing and capacity
- **PricingService:** Base price, duration, minimum price/duration (e.g. $0.50 min, 10 min min). Driveway create/update validates minimum pricePerHour so 10‑min bookings meet Stripe minimum. Logical.
- **Capacity:** Only CONFIRMED + COMPLETED count toward capacity; PENDING does not reserve. Correct.

### 1.4 Security and quality
- **Test/debug routes:** All use `requireDevelopment()` and return 404 in production. Safe.
- **Auth on protected APIs:** requireAuth used on bookings, driveways, payments, reviews, favorites, dashboard, etc. Correct.
- **Cron:** Optional CRON_SECRET; recommended for production.

---

## 2. What Should Be Changed

### 2.1 High priority

| Item | Where | Change |
|------|--------|--------|
| **Block ADMIN on register** | `apps/web/src/app/api/auth/register/route.ts` | After validation, reject if `roles` includes `ADMIN` (e.g. 403 “Admin role cannot be self-assigned”). UI already hides ADMIN; API currently accepts it if someone POSTs it. |
| **Contact API consistency** | `apps/web/src/app/api/contact/route.ts` | Return `createApiResponse({}, 'Email sent successfully')` on success and `createApiError(...)` on errors so behavior and shape match rest of API. |
| **Contact when email not configured** | `apps/web/src/app/api/contact/route.ts` | If `EMAIL_HOST` / `EMAIL_FROM` / `EMAIL_TO` are missing, return 503 with a clear message (e.g. “Contact form temporarily unavailable”) instead of failing on send. |

### 2.2 Medium priority

| Item | Where | Change |
|------|--------|--------|
| **Help Center link consistency** | `apps/web/src/components/layout/Footer.tsx` | Footer “Help Center” points to `/about`. About page footer points to `/help`. Either: (a) make both point to `/help` (dedicated Help Center page), or (b) make both point to `/about` and remove or redirect `/help`. Recommendation: both → `/help` so “Help Center” has its own page. |
| **Login redirect safety** | `apps/web/src/app/login/page.tsx` | Already implemented: try/catch around `decodeURIComponent(redirect)` with fallback to `/dashboard`. No change needed. |
| **Middleware cleanup** | `apps/web/middleware.ts` | Remove trailing comment lines (e.g. “set env for testing”, “ci/cd pipelines”, “ui finishes”, “breadcrumps”). They look like stray TODOs. |

### 2.3 Lower priority

| Item | Where | Change |
|------|--------|--------|
| **Contact form inputs** | `apps/web/src/app/contact/page.tsx` | Use shared `Input` component or `.input` class for 44px height and consistency with rest of app. |
| **Checkout error handling** | `apps/web/src/components/ui/StripeCheckout.tsx` or checkout page | Remove or document dead branches that check `err.code === 'ECONNABORTED'` / `ERR_NETWORK` (fetch-based client doesn’t set those). |
| **Driveway types** | Multiple pages | Consider centralizing driveway shape in `@/types/driveway` to avoid duplication across pages. |
| **Register schema** | `apps/web/src/lib/validations.ts` | Optionally restrict register schema to `z.enum(['DRIVER', 'OWNER'])` so ADMIN is invalid at validation time; keep server-side rejection as well. |

---

## 3. What Could Be Removed or Consolidated

### 3.1 Safe to remove (cleanup only)

| Item | Where | Action |
|------|--------|--------|
| **Trailing comments in middleware** | `apps/web/middleware.ts` | Delete lines 49–57 (TODOs / notes). |
| **_internal route list** | `apps/web/src/app/api/_internal/route.ts` | That file only documents that test routes *should* live under `_internal`; the actual routes are still at `/api/test-*`, `/api/auth/debug`, etc. Either: move those routes under `api/_internal/...` and keep the doc, or remove the `_internal` route file if you prefer to keep test routes at top level (they’re already dev-only). No functional change either way. |

### 3.2 Do not remove (needed for product)

- **Test/debug API routes** – Kept but gated by `requireDevelopment()`; useful for local and preview. No need to delete.
- **/earnings page** – Redirects to dashboard; satisfies About footer link. Keep.
- **/help, /host-guide, /privacy** – Fulfill linked promises from About/footer. Keep.
- **ADMIN in schema** – Keep enum value; only block assignment at registration (and optionally in validation).

### 3.3 Optional consolidation

- **“Earnings” in nav** – Dashboard already shows earnings for owners. The `/earnings` page is a simple “Go to Dashboard” card. You could change the About footer “Earnings” link to point directly to `/dashboard` and remove the `/earnings` page, or keep both for a dedicated “Earnings” entry point. Both are valid.
- **Rate limiting** – Today login uses in-memory rate limit (resets per instance). Commented Redis/Upstash code exists in `rate-limit.ts`. For production at scale, enabling Redis-based rate limiting is recommended; not a removal, just a future improvement.

---

## 4. Business Logic Summary

| Area | Status | Note |
|------|--------|------|
| **Roles** | OK | DRIVER / OWNER used; ADMIN in schema but not assignable via UI; API should reject ADMIN on register. |
| **Booking lifecycle** | OK | PENDING → pay → CONFIRMED; cron for EXPIRED and COMPLETED. |
| **Reviews** | OK | Only after COMPLETED booking; one per user per driveway. |
| **Payments** | OK | Intent per booking; webhook confirms and updates booking. |
| **Pricing** | OK | Min price/duration; driveway min pricePerHour enforced. |
| **Capacity** | OK | Only CONFIRMED + COMPLETED count. |
| **Public stats** | OK | Real data from DB; placeholder copy replaced with real stats where used. |
| **Contact** | Improve | Align response shape; handle missing email config. |
| **Help / nav** | Improve | Unify “Help Center” link (e.g. both to `/help`). |

---

## 5. Checklist for Implementation

- [ ] **Register:** Reject `roles` containing `ADMIN` in register API (and optionally in registerSchema).
- [ ] **Contact API:** Use createApiResponse / createApiError; handle missing EMAIL_* with 503.
- [ ] **Footer:** Set “Help Center” to `/help` (or standardize on `/about` and adjust copy).
- [x] **Login:** try/catch around decodeURIComponent(redirect); fallback `/dashboard` (already present).
- [ ] **Middleware:** Remove trailing comments.
- [ ] (Optional) Contact form use Input/.input; checkout remove dead err.code branches; centralize driveway types; restrict registerSchema roles.

---

*This analysis is based on the codebase and PROJECT_BRIEF as of the review date. Re-check after implementing changes.*
