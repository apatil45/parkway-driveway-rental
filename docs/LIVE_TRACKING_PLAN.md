# Driver Navigation to Booked Driveway (Google Maps–style, in our map)

**Goal:** When a driver has a confirmed booking for a driveway, they can open **our map** and get a **route** from their current location (A) to the driveway (B)—like Google Maps turn-by-turn style, but inside our app. **Owner does not see any tracking;** this is only to help the driver get to the spot.

---

## 1. Use case

| Actor  | What they get |
|--------|----------------|
| Driver | From “My Bookings” (or booking detail), taps **“Get directions”** or **“Navigate”** → Our map opens with: (1) driver’s current location, (2) driveway as destination, (3) **route line** (polyline) from A to B, (4) optional turn-by-turn instructions. Driver’s position can update live on the map as they move (no data sent to server). |
| Owner  | No change. Owner does **not** see driver location or any tracking. |

**Business rule:** Only show “Get directions” for the **driver’s own** CONFIRMED (or paid) bookings; destination is always the booked driveway’s lat/lng.

---

## 2. What we need (no owner tracking, no DB for location)

- **Our map (Leaflet)** – Already in the app; reuse for the “navigate to booking” view.
- **Driver’s current location** – Browser `navigator.geolocation.getCurrentPosition` or `watchPosition` (updates the blue dot on our map; all in the browser, no backend).
- **Route from A → B** – Call a **routing API** to get a polyline (list of lat/lng points) from current location to driveway, then draw that polyline on our map.
- **Optional:** Turn-by-turn instructions (text list) from the same routing response.

No need for:
- Storing driver location in the database
- Owner seeing the driver on a map
- WebSockets or real-time server push

---

## 3. Routing API (to get the “route” like Google Maps)

We need a service that returns a **route** (polyline or list of coordinates) between two points. Options:

| Service | Free tier | Notes |
|---------|-----------|--------|
| **OSRM** (public demo) | Yes | `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson` – returns GeoJSON line. No API key. Can hit CORS from browser; may need to call from our API (proxy) instead of directly from frontend. |
| **OpenRouteService** | Yes (e.g. 2k req/day) | API key required. Returns GeoJSON or polyline. Good for production. |
| **Mapbox Directions** | Yes (e.g. 100k req/mo) | API key required. Returns polyline; great docs. |

**Recommendation:** Start with **OSRM** (public) via a **small proxy API** in our app (e.g. `GET /api/routing?from=lat,lng&to=lat,lng`) so the frontend doesn’t hit CORS. Later you can switch the proxy to OpenRouteService or Mapbox if you need higher limits or better quality.

---

## 4. High-level flow

```
[Driver] taps "Get directions" for a booking
    → Frontend: get driver position (geolocation)
    → Frontend: call our API GET /api/routing?from=lat,lng&to=drivewayLat,drivewayLng
    → Our API: call OSRM (or other), return polyline / GeoJSON
    → Frontend: draw polyline on Leaflet map + driver marker + driveway marker
    → (Optional) Frontend: start watchPosition to move driver marker as they drive (no server)
```

All location data stays in the browser except the one-time routing request (from → to). No tracking stored for the owner.

---

## 5. Step-by-step implementation (you code, guided)

### Step 1 – Routing API (backend proxy)

- Add **GET /api/routing** (or **/api/directions**).
  - Query params: `from=lat,lng` and `to=lat,lng` (e.g. driver position and driveway).
  - In the route handler, call OSRM:  
    `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`
  - Return the route geometry (GeoJSON or array of coordinates) and, if you want turn-by-turn, the legs/steps from OSRM response.
  - Optional: validate that `from`/`to` are within a reasonable distance (e.g. 200 km) to avoid abuse.
- No auth required for this proxy if you only use it from the “navigate to booking” screen (booking is already validated there). Or require auth and optionally check that `to` matches a driveway the user has a booking for.

### Step 2 – “Navigate” / “Get directions” entry point (driver only)

- On **My Bookings** (or booking detail) page, for each **driver’s** CONFIRMED (or paid) booking, show a button: **“Get directions”** or **“Navigate to this spot”**.
  - Link to a new route, e.g. `/bookings/[id]/navigate` or open a modal/sheet that shows the map.
  - Pass booking id (and optionally driveway lat/lng/address) so the navigate view knows the destination.

### Step 3 – Navigate view (our map + route)

- New page or modal: **Navigate to booking**.
  - Inputs: booking id (from URL or state). Fetch booking details (driveway lat, lng, address) from existing `GET /api/bookings/[id]` (driver already has access).
  - Get driver’s current position: `navigator.geolocation.getCurrentPosition`.
  - Call **GET /api/routing?from=currentLat,currentLng&to=drivewayLat,drivewayLng**.
  - Render **our map** (Leaflet):
    - Driver: marker or circle at current position (e.g. blue dot).
    - Destination: marker at driveway (e.g. pin or “P”).
    - Route: draw the polyline from the routing API response.
  - Fit map bounds to show both driver and driveway (and the route).

### Step 4 – Live update of driver position on the map (optional but nice)

- Use `navigator.geolocation.watchPosition` (instead of a single `getCurrentPosition`) so the driver’s marker moves as they move. No server call for position updates; only the initial route fetch. Optionally **re-fetch route** when the driver has moved a lot (e.g. 500 m) to get an updated path (e.g. if they went off-route).

### Step 5 – Turn-by-turn instructions (optional)

- OSRM response includes `legs[].steps`. In the navigate view, show a list of instructions (e.g. “Turn left onto Main St”, “Arrive at destination”). No extra API; just parse the response you already get in Step 1.

### Step 6 – Polish

- Handle geolocation errors (permission denied, unavailable).
- “Open in Google Maps” / “Open in Apple Maps” as a fallback link (driveway address or lat/lng) so the driver can switch to their preferred app if they want.

---

## 6. Checklist summary

| # | Task | Type |
|---|------|------|
| 1 | GET /api/routing (proxy to OSRM or other): from & to → polyline + optional steps | Backend |
| 2 | “Get directions” button on driver’s booking (bookings page or detail) | Frontend |
| 3 | Navigate view: our map + driver marker + driveway marker + route polyline | Frontend |
| 4 | (Optional) watchPosition to update driver marker on map | Frontend |
| 5 | (Optional) Turn-by-turn instructions from OSRM steps | Frontend |
| 6 | (Optional) “Open in Google/Apple Maps” link | Frontend |

No database changes, no owner tracking, no location storage—just driver-only navigation in our map, Google Maps style.
