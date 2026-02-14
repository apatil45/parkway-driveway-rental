# Search Page UI Analysis

## 1. Overview

The search page is the primary discovery surface for driveway/parking rentals. It uses a **map-first, overlay list** layout (Google Maps–style): full-screen map with a sticky search bar and a right-side results list that overlaps the map.

---

## 2. Page Structure (Visual Hierarchy)

```
┌─────────────────────────────────────────────────────────────────┐
│  AppLayout (no footer, no breadcrumbs in practice for search)     │
│  ├── Navbar (sticky, z-30) — "Parkway" + nav + auth              │
│  ├── <main>                                                      │
│  │   ├── [1] Map layer (fixed, z-0, pt: 8rem)                    │
│  │   │       └── MapViewDirect + empty state + list toggle (mobile)│
│  │   ├── [2] Search bar (sticky, z-20, top: 3.75rem)             │
│  │   │       └── AddressAutocomplete + Search + Filters          │
│  │   ├── [3] Filters panel (conditional, sticky, z-20, top: 7.25rem)│
│  │   │       └── Location, price, car size, sort, radius, etc.   │
│  │   ├── [4] List backdrop (mobile, z-30, when list open)         │
│  │   └── [5] List overlay (fixed, z-40, top: 8rem)               │
│  │           └── Drag handle, close, results list, pagination     │
│  └── FloatingActions (global FAB)                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Z-order (bottom → top):** Map (0) → Search/Filters (20) → Backdrop (30) → List toggle (35) → List (40).
- **Content start:** Map and list both start at `8rem` from the top (below navbar + search bar), via `contentTopOffset`.

---

## 3. Layout & Responsiveness

| Breakpoint | Map | Search bar | List panel | List toggle |
|------------|-----|------------|------------|-------------|
| **&lt; lg** | Full width below 8rem | Full width, sticky | Slide-in from right, overlay; closed by default | Floating button top-right (over map) |
| **≥ lg** | Same | Same | Always visible (sidebarOpen true), same overlay | Hidden |

- **List:** `w-full sm:w-96 max-w-[calc(100vw-2rem)]`, `rounded-l-2xl`, `shadow-xl`.
- **Alignment:** Search bar and filters use `container mx-auto px-4` to align with the navbar.
- **Sidebar state:** Initialized from `window.innerWidth >= 1024`; on resize to ≥ lg, list is forced open.

---

## 4. Key UI Components & Behavior

### 4.1 Search bar (primary)

- **AddressAutocomplete** for “Search parking…” with location pin, voice, and info.
- **Search** (primary Button) submits current query and runs search.
- **Filters** (secondary Button) toggles the advanced filters panel.
- Single row, flex, same height for inputs/buttons (Button component keeps min-height consistent).

### 4.2 Filters panel (collapsible)

- **Location** (AddressAutocomplete), **Price min/max**, **Car size**, **Sort**, **Radius**, **Use my location**, **Amenities** (covered, security, ev_charging, easy_access), **Search**.
- Sticky under the search bar (`top-[7.25rem]`).
- Grid: 1 col → 2 (sm) → 4 (lg).

### 4.3 Map

- **MapViewDirect** (Leaflet), full area of its container.
- Renders only when `pathname === '/search'`, `!emptyResults`, and `canRenderMap`.
- **Markers:** custom “P” icon; click scrolls list to that driveway and highlights it (ring), then navigates to `/driveway/[id]` on card click.
- **Empty state:** Centered “MAP” + “No driveways to display on map” when no results.
- **List toggle (mobile):** Absolute top-right, list icon, only `lg:hidden`.

### 4.4 List overlay

- **Drag handle** at top (mobile) for sheet-like affordance.
- **Close** (X) top-right, mobile only.
- **Content:** “X driveways found” → list of cards.
- **Card:** Image, title, address, description (line-clamp), price/hour, stars + review count, distance, capacity, amenity pills (first 3 + “+N”).
- **Click:** Sets selected driveway, unmounts map (`setCanRenderMap(false)`), then `router.push(/driveway/[id])`.
- **Pagination:** Prev/Next + up to 5 page numbers when `totalPages > 1`.
- **Empty state:** “No driveways found”, “Try adjusting your search filters”, “Show Filters” button.

---

## 5. Data & State

- **Filters:** location, priceMin/Max, carSize, amenities, latitude, longitude, radius, sort.
- **UI state:** showFilters, sidebarOpen, selectedDriveway, canRenderMap.
- **Data:** `useDriveways()` → fetchDriveways with current filters + pagination.
- **Initial load:** `performSearch()` on mount; geolocation used once to set lat/long and show toast.
- **Map center:** From filters lat/long, else first result, else San Francisco.
- **Distance:** Haversine from filter location to each driveway (km).

---

## 6. Strengths

1. **Map-first + overlay list** matches the requested “Google Maps style” and keeps the map full-bleed.
2. **Single `contentTopOffset`** keeps map and list starting at the same vertical position (below search bar).
3. **Consistent alignment** of search/filters with navbar via shared container/padding.
4. **Responsive list:** Overlay on mobile with backdrop and toggle; always visible on desktop.
5. **Map–list sync:** Marker click scrolls and highlights the corresponding list card.
6. **Clear empty states** for no results on map and in list, with path to filters.
7. **Geolocation** improves default relevance; toast explains behavior.
8. **Unmounting map before navigation** avoids Leaflet/cleanup issues.

---

## 7. Issues & Gaps

1. **Unused `searchParams`** — `useSearchParams()` is used but `searchParams` is never read; URL query (e.g. `?location=…`) is not used to prefill filters or drive initial search.
2. **Hardcoded offset** — `contentTopOffset = '8rem'` assumes navbar + search bar height; if navbar/search height changes (e.g. different breakpoints or content), map/list can misalign unless updated.
3. **Filters panel overlap** — When filters are open, they sit at `top-[7.25rem]` and don’t push the map/list start; map/list stay at 8rem. If filters grow (e.g. more rows), they overlap the top of the map/list. No dynamic offset based on “search bar + expanded filters” height.
4. **List always open on desktop** — On lg+, `sidebarOpen` is forced true and there’s no way to get a full-width map without the list (e.g. “expand map” control).
5. **Accessibility**
   - List toggle and close use `aria-label`; drag handle is `aria-hidden`.
   - No `aria-expanded` on list toggle.
   - No focus trap or focus return when list closes on mobile.
   - List panel could use `role="region"` and `aria-label="Search results"` for screen readers.
6. **Loading in list** — When pagination or “Search” is clicked, `loading` is used on the Filters panel Search button, but the list doesn’t show a loading state (e.g. skeleton or disabled cards).
7. **Image loading/errors** — Listing images have no `loading="lazy"` or error fallback (broken image or placeholder).
8. **Star rating** — Uses `Math.floor(rating)` for filled stars; half stars or a proper rating component would be clearer.

---

## 8. Recommendations

1. **URL sync:** Read `searchParams` on mount and when they change; set filters (location, price, etc.) and run search so the page is shareable and back/forward works.
2. **Content offset:** Derive `contentTopOffset` from a shared constant or CSS variable tied to “header + search bar” height, or measure the search bar ref and set offset dynamically when filters expand.
3. **Desktop list toggle:** On lg+, allow closing the list (e.g. a chevron or “Hide list”); persist preference in sessionStorage if desired.
4. **A11y:** Add `aria-expanded={sidebarOpen}` on the list toggle, focus trap inside the list when open on mobile, return focus to toggle on close, and `role="region"` + `aria-label` on the list panel.
5. **List loading:** Show a list-level loading state (skeleton cards or overlay) when `loading` is true and results are being fetched.
6. **Images:** Add `loading="lazy"` and an `onError` fallback (or placeholder) for listing thumbnails.
7. **Remove dead code:** Remove `searchParams` if not used, or wire it into filters/initial search as above.

---

## 9. Summary

The search page delivers a map-first layout with an overlapping results list, aligned map/list start, and responsive behavior. The main gaps are URL-driven state, dynamic content offset when filters expand, desktop list toggle, list loading and image handling, and stronger accessibility (focus and ARIA). Addressing these would make the page more robust, shareable, and accessible while keeping the current UI structure.
