# Web → Mobile: Feasibility & Breaking Points

**Context:** Converting the Parkway Spot Next.js web app to Android and iOS (React Native/Expo recommended).  
**Purpose:** How feasible the conversion is, and where the main breaking points and risks are.

---

## 1. Feasibility summary

| Aspect | Feasibility | Notes |
|--------|-------------|--------|
| **Overall** | **Feasible** | Backend can stay; most work is auth adaptation, new client UI, and native integrations. No fundamental blockers. |
| **Backend** | High | REST API, Prisma, Stripe webhooks, Cloudinary are platform-agnostic. A few **must-have** backend changes for mobile (auth). |
| **Auth** | Medium | Currently cookie-only. **Breaking point:** backend must support Bearer tokens and token-in-body for login/refresh. |
| **Payments** | Medium | Same PaymentIntent flow; **breaking point:** mobile needs a different client (Stripe React Native), not a backend change. |
| **Maps** | Medium | **Breaking point:** Leaflet is web-only; full replace with `react-native-maps` and possibly new map keys. |
| **UI / product** | High | Rebuild screens in RN; reuse types, validation, and business logic. No backend dependency. |

**Verdict:** **Feasible** with a small set of well-defined breaking points. The only mandatory backend changes are auth (Bearer + token-in-body). Everything else is client-side or optional backend (e.g. push).

---

## 2. Breaking points (must fix or redesign)

These are the points that **block** or **strongly constrain** a native app if not addressed.

### 2.1 Auth: cookie-only today

**Current behavior:**

- Login/register set **httpOnly cookies** (`access_token`, `refresh_token`); response body has user data but **no tokens**.
- **Refresh:** `POST /api/auth/refresh` reads **only** `refresh_token` from cookies; returns new access token in a **Set-Cookie** (no token in body).
- **All protected routes:** `verifyAuth()` in `auth-middleware.ts` reads **only** `request.cookies.get('access_token')`. No `Authorization` header.

**Why it breaks mobile:**  
Native apps don’t use browser cookies. They need to send `Authorization: Bearer <accessToken>` and store/refresh tokens in secure storage. Without backend support for that, the app cannot authenticate.

**What to do:**

| Change | Where | Effort |
|--------|--------|--------|
| **1. Accept Bearer token** | `lib/auth-middleware.ts` in `verifyAuth()`: if no cookie, read `Authorization: Bearer <token>` and use that. | Small (one place). |
| **2. Refresh from body** | `api/auth/refresh/route.ts`: accept `refreshToken` in **request body** (e.g. `{ refreshToken }`). If present, validate it and return `{ accessToken }` (and optionally `refreshToken`) in **JSON**. Keep existing cookie behavior for web. | Small. |
| **3. Return tokens in login/register body** | Login and register: in the success response JSON, **also** include `accessToken` and `refreshToken` so mobile can store them. Web can ignore these and keep using Set-Cookie. | Small. |

**Risk:** Low. Backward compatible if you keep cookie behavior and add Bearer + body as an alternative.

---

### 2.2 Auth: upload routes read cookie directly

**Current behavior:**  
`api/upload/image/route.ts` and `api/upload/verification-document/route.ts` read `request.cookies.get('access_token')` themselves instead of using `requireAuth()`.

**Why it matters:**  
Once `verifyAuth()` supports Bearer, routes that use `requireAuth()` automatically work with mobile. Routes that only read the cookie do not.

**What to do:**  
Switch both upload routes to use `requireAuth(request)` (and use returned `userId` if needed). Then they automatically support both cookie (web) and Bearer (mobile).  
**Effort:** Small. **Risk:** Low.

---

### 2.3 Google OAuth: redirect-based flow

**Current behavior:**  
Web uses redirect-based OAuth: user goes to Google, then callback hits `/api/auth/google/callback`, which sets cookies and **redirects** the user back to the app.

**Why it breaks mobile:**  
Native apps typically use **Google Sign-In SDK** (or similar), get an `id_token` (or access token), and send it to **your** backend. There is no browser redirect.

**What to do:**  
Add an endpoint, e.g. `POST /api/auth/google/token`, that accepts `{ idToken }` (or similar), verifies it with Google, finds/creates the user, and returns **JSON** with `user`, `accessToken`, `refreshToken` (same shape as login/register with tokens in body). Mobile uses Google SDK → get id_token → call this endpoint → store tokens.  
**Effort:** Medium (one new route + verification). **Risk:** Low if you follow Google’s server-side token verification.

---

### 2.4 Payments: Stripe web vs native

**Current behavior:**  
Web uses `@stripe/stripe-js` and `PaymentElement`; checkout is browser-based; `credentials: 'include'` sends cookies.

**Why it’s a breaking point:**  
Mobile cannot use Stripe.js or PaymentElement. It must use `@stripe/stripe-react-native` and the **native payment sheet**. Flow is: create PaymentIntent on backend (unchanged) → mobile presents sheet → confirm → webhook updates booking (unchanged).  
`POST /api/payments/verify` is called from the web client with cookies; on mobile you’ll call it with **Bearer** (after auth fix above).

**What to do:**  
- Backend: no change if you already create PaymentIntent and handle webhook.  
- Mobile: new implementation using Stripe React Native; call verify with Bearer auth.  
**Effort:** Medium (mobile-only). **Risk:** Low; well-documented Stripe flow.

---

### 2.5 Maps: Leaflet is web-only

**Current behavior:**  
Search and listing detail use **Leaflet** and **react-leaflet** (e.g. `MapViewDirect`, `MapView`, `useMapLifecycle`). Tiles, markers, and bounds are Leaflet-specific.

**Why it’s a breaking point:**  
React Native has no DOM; Leaflet doesn’t run. You need a native map component.

**What to do:**  
Use **`react-native-maps`** on mobile. Reuse the same **data** (lat/long, radius, listing locations) and **backend** (search API). Replace only the map **UI and interaction** (markers, region, user location). You may need **Google Maps API key** (and/or Apple Maps) for production.  
**Effort:** Medium (rewrite map UIs and any Leaflet-specific logic). **Risk:** Low; react-native-maps is standard.

---

### 2.6 Base URL and CORS

**Current behavior:**  
Web uses relative `/api` or `NEXT_PUBLIC_API_URL`; same origin, so cookies and CORS are simple.

**Why it matters for mobile:**  
Mobile must call your API at an **absolute URL** (e.g. `https://your-app.vercel.app`). You must allow that origin in CORS and ensure no cookie-only assumptions.

**What to do:**  
- Configure CORS (if any) to allow the mobile app (e.g. custom scheme or a dedicated API subdomain).  
- Auth via Bearer avoids cookie/same-origin; CORS for `Authorization` and JSON is standard.  
**Effort:** Small. **Risk:** Low.

---

## 3. Non-breaking but important

| Area | Situation | Action |
|------|-----------|--------|
| **Push notifications** | Not implemented for web; needed for mobile. | Backend: store FCM/APNs tokens and send pushes; app: integrate SDK. New work, not a “break” of existing flow. |
| **Deep links** | Web uses URLs; app needs `parkwayspot://` or universal links. | Configure app and (if needed) backend for link routing. No change to existing API. |
| **Refresh token in response** | If you rotate refresh tokens on use, mobile must store and send the new one. | Document and implement same contract as web (e.g. return `refreshToken` in refresh response when using body). |

---

## 4. What does *not* break

- **REST API** (driveways, bookings, reviews, favorites, notifications, etc.): same endpoints and payloads; mobile just sends Bearer.
- **Database / Prisma / Supabase:** unchanged.
- **Stripe webhooks:** unchanged; still drive booking confirmation.
- **Cloudinary:** same URLs and upload API; mobile can upload via your API (with Bearer) or presigned URLs.
- **Business logic:** pricing, validation, booking rules — reuse in mobile or in shared packages.
- **Types (`@parkway/shared`)**: reuse as-is for mobile.

---

## 5. Risk overview

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auth changes break existing web | Low | High | Keep cookie path unchanged; add Bearer and body only as alternatives; test web login/refresh after changes. |
| Store rejection (policy, payments, privacy) | Medium | High | Follow store guidelines; clear privacy policy and payment disclosure; test payment flow on device. |
| Map or payment native bugs | Medium | Medium | Use well-known libraries; budget time for device testing and keys (Google/Apple). |
| Scope creep (feature parity + new native features) | High | Medium | Define MVP for v1 mobile (e.g. search, book, pay, bookings); defer “nice-to-haves.” |

---

## 6. Feasibility by phase

| Phase | Feasibility | Main dependency |
|-------|-------------|-----------------|
| Backend auth (Bearer + refresh body + tokens in login/register) | **High** | Single middleware + 3 route changes. |
| Mobile app shell + navigation + API client (Bearer) | **High** | No backend change beyond auth. |
| Login/register + token storage on device | **High** | Backend returns tokens in body. |
| Google Sign-In on mobile | **High** | New endpoint that accepts id_token and returns tokens. |
| Maps on mobile | **High** | Replace Leaflet with react-native-maps; same backend. |
| Payments on mobile | **High** | Stripe React Native + existing backend. |
| Push, deep links, polish | **High** | New backend/configuration work, no “unfixable” break. |

**Conclusion:** The conversion is **feasible**. The only true **breaking points** are auth (cookie-only today) and the need to replace web-only pieces (Stripe JS, Leaflet) on mobile. Once auth supports Bearer and token-in-body, and upload routes use shared auth, the rest is client and product work with no fundamental blockers.

---

*Document version: 1.0. Last updated: March 2026.*
