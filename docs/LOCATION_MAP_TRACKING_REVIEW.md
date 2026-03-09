# Senior Engineer Review: Location, Map & User Tracking

**Scope:** Geolocation usage, map components, navigation, routing, and privacy.

---

## 1. Current Architecture

### Location Usage (3 places)

| Location | API | Purpose |
|----------|-----|---------|
| **Search page** | `getCurrentPosition` (once on mount) | Set user lat/lon for "nearby" search; stored in URL/state only |
| **AddressAutocomplete** | `getCurrentPosition` (once) | Center map, show "nearby" suggestions; `enableHighAccuracy: false`, `maximumAge: 5min` |
| **Navigate page** | `watchPosition` (continuous) | Live driver marker, route from A→B; location never sent to server after route fetch |

### Map Components

- **MapView** (react-leaflet) – used in driveway detail
- **MapViewDirect** (Leaflet or Mapbox) – search page, map-first layout
- **Navigate page** – custom Leaflet (no react-leaflet) for directions

### Data Flow

```
Driver location → Browser only (watchPosition)
                → One-time: /api/routing?from=lat,lng&to=lat,lng (for route polyline)
                → Never stored in DB
Owner → Does NOT see driver location (per LIVE_TRACKING_PLAN)
```

---

## 2. What’s Good

### Privacy
- Driver location stays in browser; no server-side storage
- Owner sees only driveway address, not live driver position
- Permissions-Policy: `geolocation=(self)` – only your origin can use location

### Security
- Routing API is a proxy; no CORS from browser to OSRM
- Lat/lng validation (-90/90, -180/180)
- No auth on routing (acceptable for public route data)

### UX
- Map shows destination even when geolocation fails
- "Open in Google Maps" fallback when location unavailable
- Clear error messages for permission denied, timeout, etc.

### Implementation
- `watchPosition` cleanup on unmount
- Route fetched once; marker updates without re-fetching
- Destination map works without location

---

## 3. Gaps & Recommendations

### High Priority

#### 3.1 Routing API: Auth & Abuse
**Issue:** `/api/routing` is unauthenticated. Anyone can abuse it.

**Recommendation:**
- Require auth for routing (or at least a valid session)
- Or: validate that `to` matches a driveway the user has a booking for
- Add rate limiting (e.g. 30 req/min per IP)

#### 3.2 Routing API: Distance Limit
**Issue:** No max distance. OSRM can be queried for arbitrary long routes.

**Recommendation:**
- Reject if distance > ~200 km (e.g. haversine check)
- Reduces abuse and OSRM load

#### 3.3 OSRM Rate Limits
**Issue:** Public OSRM demo has usage limits; no fallback in code.

**Recommendation:**
- Add `OSRM_DEMO_URL` env var for easy swap
- Document fallback: OpenRouteService or Mapbox Directions if OSRM limits hit
- Consider self-hosted OSRM for production

#### 3.4 Manual “Start from” Fallback
**Issue:** When geolocation fails on mobile, user can’t get a route in our map.

**Recommendation:**
- Add “Where are you?” address input (optional)
- Geocode → use as `from` for routing
- Enables route on map without location permission

### Medium Priority

#### 3.5 Re-route on Significant Off-course
**Issue:** Route is fetched once. If user drives off route, route stays stale.

**Recommendation (LIVE_TRACKING_PLAN Step 4):**
- When `watchPosition` reports new position, check distance from last route point
- If > 500 m off route, re-fetch route from current position to destination

#### 3.6 Search Page: Geolocation UX
**Issue:** Auto-detection on mount with no user consent; no explicit “Use my location” CTA.

**Recommendation:**
- Add “Use my location” button instead of (or in addition to) auto-detect
- Reduces surprise permission prompts; better UX and privacy

#### 3.7 Coordinate Precision
**Issue:** No explicit rounding; full precision stored.

**Recommendation:**
- For display: 5–6 decimals is enough
- For storage: 6 decimals (~10 cm) is sufficient for driveways
- Optional: round to 6 decimals before DB write for consistency

### Low Priority

#### 3.8 Compass / Heading Mode
**Issue:** Map doesn’t rotate with device direction.

**Recommendation:**
- Use DeviceOrientation for heading
- Rotate map so “up” = direction of travel (like Google Maps nav)
- Requires motion permission; make it opt-in

#### 3.9 CSP for OSRM
**Issue:** Not needed – routing is server-side. CSP only affects browser.

**Status:** No change needed.

#### 3.10 Location Accuracy Display
**Issue:** User doesn’t see `position.coords.accuracy`.

**Recommendation:**
- Optional: show “Accuracy: ~±X m” when accuracy > 50 m
- Helps user understand why marker might jump

---

## 4. Privacy Checklist

| Item | Status |
|------|--------|
| No driver location stored in DB | ✅ |
| Owner cannot see driver location | ✅ |
| Permissions-Policy allows geolocation | ✅ (self only) |
| Location in URL params (search) | ⚠️ Shared if user shares URL |
| Route fetch sends lat/lng to our API | ⚠️ One-time; consider logging policy |

**Recommendation:** Add a short privacy note: “We use your location only to show directions and nearby results. We do not store or share your location.”

---

## 5. Summary: Priority Order

| # | Action | Effort |
|---|--------|--------|
| 1 | Add manual “Start from” address input on navigate page | Medium |
| 2 | Auth or booking validation on routing API | Low |
| 3 | Distance limit on routing API (e.g. 200 km) | Low |
| 4 | Rate limit on routing API | Low |
| 5 | “Use my location” button on search (instead of auto) | Low |
| 6 | Re-route when user is >500 m off route | Medium |
| 7 | Privacy note for location usage | Low |
| 8 | OSRM fallback / env config | Low |

---

## 6. No User Tracking

- **User tracking** = storing or sharing user location over time for analytics.
- **Current behavior:** Location is used only for:
  - Search (nearby driveways)
  - Directions (route + live marker)
- **No server-side storage or tracking.** Implementation is aligned with privacy.
