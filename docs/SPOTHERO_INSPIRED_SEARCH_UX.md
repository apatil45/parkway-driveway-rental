# SpotHero-Inspired Search UX for ParkwayAi

**Reference:** SpotHero (parking app) — used for inspiration only, not copied.  
**Goal:** Apply proven parking-search patterns to ParkwayAi’s driveway rental flow.

---

## SpotHero Patterns (Reference)

| Pattern | SpotHero | ParkwayAi Adaptation |
|--------|----------|----------------------|
| **Primary question** | "Where are you going?" | Same — destination-focused |
| **Search params** | Location + Start time + End time | Location + optional When (date/time) |
| **Venue focus** | Airport, stadium, mall, hospital | Transit hubs, landmarks, popular areas |
| **Section hierarchy** | Clear grouping in dropdown | RECENT / LANDMARKS / ADDRESSES |
| **Quick action** | "Use current location" | Same — at top of suggestions |
| **Mobile-first** | App-style search bar | Already: bottom sheet, FAB search |

---

## Implemented Changes

### 1. "Use current location" at top
- Shown when dropdown opens (empty or focused)
- Uses geolocation; on success, sets lat/lon and triggers search
- Placed above RECENT / FAVORITES for quick access

### 2. Venue / landmark prominence
- Market config: `popularVenues` (e.g. Newport PATH, Grove St, Exchange Place)
- Shown as "Park near [venue]" in suggestions
- POI search already supports "near airport", "near stadium" — surfaced in dropdown

### 3. Section labels and copy
- **RECENT** — "Used Xm ago" or "Xm ago" (not "Xm away" which is ambiguous)
- **NEARBY** — "~Xm from you" when we have user location
- **LANDMARKS** — Venues, transit, airports
- **ADDRESSES** — Street addresses from geocode

### 4. Copy alignment
- Search label: "Where are you going?" (SpotHero-style)
- Placeholder: "Address, landmark, or transit stop"

---

## Future: Date/Time in Search (Phase 2)

SpotHero uses **Start time** and **End time** in the search bar. For ParkwayAi:

- **Option A:** Add optional date/time to search; pass to booking page as prefilled values
- **Option B:** Add date/time + filter driveways by availability (requires API support)

Current API does not filter by availability. Phase 2 would need:
- `startTime`, `endTime` query params on `/api/driveways`
- Availability check against host calendar / blocking

---

## Files Touched

- `apps/web/src/lib/market-config.ts` — `popularVenues`
- `apps/web/src/components/ui/AddressAutocomplete.tsx` — Use current location, section labels, distance copy
- `apps/web/src/app/page.tsx` — Search label copy
- `apps/web/src/app/search/page.tsx` — Search label copy
