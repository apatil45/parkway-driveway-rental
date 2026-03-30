# Parkway Spot: Web App → Android & iOS Procedure

**Purpose:** Step-by-step procedure to convert the Parkway Spot Next.js web app into native Android and iOS apps.  
**Current stack:** Next.js 16, React 18, TypeScript, Tailwind, Leaflet, Stripe, REST API (Vercel), Prisma/Supabase, Cloudinary, JWT (httpOnly cookies).

---

## 1. Choose the approach

| Approach | Pros | Cons | Best for Parkway Spot |
|----------|------|------|------------------------|
| **React Native (Expo)** | Reuse React/TS; one codebase; large ecosystem; Stripe/Map libs exist. | Maps and payments need native modules; some web-only deps (e.g. Leaflet) must be replaced. | **Recommended** — max code reuse, same team skills. |
| **Flutter** | Single codebase; great performance; consistent UI. | New language (Dart); full UI rewrite; no reuse of React components. | Good if you want to invest in Flutter long-term. |
| **Capacitor (wrap web)** | Ship existing web app inside a native shell; fastest to “app”. | Feels like a web view; limited native UX; maps/payments may be brittle. | Fast MVP or internal build; not ideal for store quality. |
| **Full native (Kotlin + Swift)** | Best performance and platform fit. | Two codebases; no reuse; highest cost. | Only if you have separate Android/iOS teams. |

**Recommendation:** Use **React Native with Expo** so you reuse logic, types, and API patterns while getting real native builds and store distribution.

---

## 2. High-level procedure

```
1. Audit & plan     → What to share, what to replace, what’s mobile-only.
2. Repo structure   → Add apps/mobile (Expo) to monorepo; share types/api client.
3. API & auth       → Keep existing REST API; switch auth to token storage (no cookies).
4. Core app         → Screens, nav, and state (auth, listings, bookings).
5. Native pieces    → Maps (react-native-maps), payments (Stripe React Native), images, push.
6. Build & test     → EAS Build or local; TestFlight / internal testing.
7. Store listing    → App Store & Play Store accounts, assets, privacy, submission.
```

---

## 3. Phase 1 — Audit and plan

### 3.1 What stays as-is (backend)

- **REST API** on Vercel (`/api/*`) — no change; mobile apps call the same endpoints.
- **Database (Prisma + Supabase)** — no change.
- **Stripe webhooks** — no change (payment confirmation, etc.).
- **Cloudinary** — no change (upload URLs and responses work from mobile).
- **Auth logic** — same JWT access/refresh; only **where** you store tokens changes (see below).

### 3.2 What you reuse (with small adapters)

- **Types** — `@parkway/shared` and any DTOs: reuse in mobile.
- **API client** — Axios/fetch + base URL + interceptors: reimplement or share (e.g. in a shared `packages/api-client` that works in RN).
- **Validation** — Zod schemas: work in React Native.
- **Business logic** — Pricing, booking rules, etc.: move to shared package or copy into mobile.

### 3.3 What you replace (web-only → mobile)

| Web | Mobile replacement |
|-----|--------------------|
| Next.js App Router, `next/navigation` | React Navigation (stack, tabs, deep links). |
| Tailwind CSS | NativeWind (Tailwind for RN) or StyleSheet / Tamagui. |
| Leaflet / react-leaflet | `react-native-maps` (Google Maps / Apple Maps). |
| Stripe React (Elements, card field) | `@stripe/stripe-react-native` (native payment sheet). |
| httpOnly cookies (JWT) | Secure storage: `expo-secure-store` (or react-native-keychain); send `Authorization: Bearer <accessToken>` and handle refresh in client. |
| Next.js API routes (server) | Not used by app; app calls your existing Vercel API URL. |

### 3.4 Mobile-only additions

- **Push notifications** — FCM (Android), APNs (iOS); backend: store FCM/APNs tokens, send via Firebase or one-signal.
- **Deep links** — `parkwayspot://booking/123`, `https://parkwayspot.com/booking/123` (universal links).
- **Maps** — API keys: Google Maps (Android + iOS optional), Apple Maps (iOS); ensure same geocoding/search as web (e.g. Nominatim or same service).
- **Splash & icons** — App icon, splash screen, adaptive icons (Android).

---

## 4. Phase 2 — Repo and shared code

### 4.1 Monorepo layout (example)

```
driveway-rental/
  apps/
    web/                 # Existing Next.js (unchanged)
    mobile/              # New: Expo (React Native)
  packages/
    database/            # Existing Prisma (used by API only)
    shared/              # Existing; extend for mobile
    api-client/          # New (optional): base URL, fetch/axios, auth headers, refresh
```

### 4.2 Shared package usage

- **`@parkway/shared`** — Used by `apps/mobile` for types (User, Driveway, Booking, etc.). Ensure no Node-only code (e.g. no `fs`, no Prisma import in shared).
- **API base URL** — Config (e.g. `https://your-app.vercel.app` or env); mobile uses this for all `/api/*` calls.

### 4.3 Auth change for mobile

- **Web today:** JWT in httpOnly cookie; refresh via cookie.
- **Mobile:** No cookies. Store:
  - `accessToken` and `refreshToken` in `expo-secure-store`.
  - On each request: `Authorization: Bearer <accessToken>`.
  - On 401: call refresh endpoint with `refreshToken` (body or header), get new access (and optionally new refresh); retry request.
- **Backend:** Add support for `Authorization: Bearer <token>` in addition to cookie (or cookie only for web). Many stacks already support both; if not, add a small middleware that reads `req.headers.authorization` and sets the user.

---

## 5. Phase 3 — Mobile app core (Expo)

### 5.1 Setup Expo

```bash
cd apps
npx create-expo-app@latest mobile --template tabs
cd mobile
```

- Add TypeScript, ensure Node target compatible with shared package.
- Add workspace dependency: `"@parkway/shared": "file:../../packages/shared"`.

### 5.2 Navigation structure (match web)

- **Tabs:** Home (search), Bookings, Favorites, Profile (or Account).
- **Stacks:** Auth (Login, Register), Search (search + list + detail), Driveway (create/edit, verify), Booking (detail, checkout).
- **Deep links:** Configure scheme `parkwayspot` and (optional) universal links.

### 5.3 Screens to implement (from web)

| Web route / area | Mobile screen(s) |
|------------------|------------------|
| `/`, `/search` | Home, Search (map + list). |
| `/driveways/[id]`, `/driveways/[id]/book` | Driveway detail, Booking form. |
| `/driveways/new`, `/driveways/[id]/edit` | Create/Edit driveway. |
| `/bookings`, `/bookings/[id]` | Bookings list, Booking detail. |
| `/login`, `/register` | Login, Register. |
| `/profile`, `/driveways` (my list) | Profile, My driveways. |
| Favorites | Favorites (from API). |

Reuse **logic and types**; rebuild UI with RN components (or NativeWind).

### 5.4 State and data

- **Auth state** — Context or Zustand; read tokens from secure store on startup; clear on logout.
- **API calls** — Same endpoints as web: `GET/POST /api/driveways`, `/api/bookings`, etc. Use shared types for request/response.
- **Forms** — React Hook Form + Zod (same as web) where possible.

---

## 6. Phase 4 — Native integrations

### 6.1 Maps

- **Library:** `react-native-maps`.
- **Providers:** Google Maps (Android + iOS) and/or Apple Maps (iOS). Use same lat/long and radius logic as web; reuse geocoding (e.g. Nominatim) via your API or direct from app.
- **Features:** Map view with markers (listings), user location, region for search; tap marker → detail or bottom sheet (like web).

### 6.2 Payments (Stripe)

- **Library:** `@stripe/stripe-react-native`.
- **Flow:** Create PaymentIntent (or SetupIntent) via your backend (same as web); in app, present Stripe’s native payment sheet; confirm; backend webhook confirms booking.
- **No card UI in app:** Use Stripe’s sheet so you avoid PCI scope in the app.

### 6.3 Images

- **Listing images** — Cloudinary URLs: use `Image` or `FastImage`; same URLs as web.
- **Upload (create/edit listing)** — Either upload from app to your API (API uploads to Cloudinary) or presigned URL from API; same backend flow as web.

### 6.4 Push notifications

- **Expo:** `expo-notifications`; optionally EAS + FCM/APNs.
- **Backend:** Store device token per user; on booking created/cancelled/etc., send push (e.g. Expo push service or FCM/APNs directly).

---

## 7. Phase 5 — Build and test

### 7.1 Build

- **Expo EAS Build:** `eas build --platform all` (or `ios` / `android`). Use `eas.json` for profiles (development, preview, production).
- **Or local:** `npx expo run:ios`, `npx expo run:android` (requires Xcode / Android Studio and device or simulator).

### 7.2 Test

- **Internal:** EAS internal distribution or TestFlight (iOS) / internal testing track (Android).
- **E2E:** Detox or Maestro for critical flows (login, search, book, pay).

---

## 8. Phase 6 — Store submission

### 8.1 Accounts and setup

- **Apple:** Apple Developer Program ($99/year); App Store Connect; create app record (bundle ID, name “Parkway Spot”).
- **Google:** Google Play Console (one-time fee); create app; set up store listing.

### 8.2 Assets and metadata

- **Icons:** 1024×1024 (iOS), adaptive icon (Android).
- **Screenshots:** Per device size (phone/tablet); both platforms.
- **Privacy:** Privacy policy URL (you already have for web); in-app privacy labels (Apple); Data safety form (Google).
- **Description, keywords, category:** e.g. “Parking” / “Travel” or “Lifestyle”.

### 8.3 Submission

- **iOS:** Archive via EAS or Xcode; upload to App Store Connect; submit for review (guidelines: payments, privacy, data use).
- **Android:** AAB from EAS or Gradle; upload to Play Console; complete content rating, target audience; submit for review.

### 8.4 Post-launch

- **Updates:** Bump version in app config; rebuild; submit new build to each store.
- **Deep links:** Ensure universal links (iOS) and App Links (Android) point to your domain and open the app when installed.

---

## 9. Checklist summary

| # | Task |
|---|------|
| 1 | Decide approach (recommended: React Native + Expo). |
| 2 | Add `apps/mobile` (Expo) to monorepo; link `@parkway/shared`. |
| 3 | Backend: support `Authorization: Bearer` for mobile; keep cookies for web. |
| 4 | Implement API client in mobile (base URL, auth header, refresh). |
| 5 | Implement auth screens; store tokens in secure store. |
| 6 | Implement main screens (search, map, list, detail, booking, profile, bookings, favorites). |
| 7 | Integrate maps (react-native-maps), Stripe (stripe-react-native), images. |
| 8 | Add push notifications (backend + app). |
| 9 | Configure deep links and app icon/splash. |
| 10 | EAS Build (or local); TestFlight / internal testing. |
| 11 | Apple + Google accounts; store listing; submit for review. |

---

## 10. Rough effort (order of magnitude)

| Phase | Effort (one person) |
|-------|----------------------|
| Setup + shared code + auth | 1–2 weeks |
| Core screens (no maps/payments) | 2–3 weeks |
| Maps + Stripe + images | 1–2 weeks |
| Push + deep links + polish | ~1 week |
| Store assets + submission | ~1 week |
| **Total** | **~6–9 weeks** (single dev, full-time). |

This assumes your existing API and backend stay as-is; most work is UI and native integrations.

---

*Document version: 1.0. Last updated: March 2026.*
