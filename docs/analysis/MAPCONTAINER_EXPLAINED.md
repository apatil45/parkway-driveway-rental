# MapContainer - How It Works (Direct Answer)

## What is MapContainer?

`MapContainer` is a React component from `react-leaflet` that:
1. **Creates a DOM element** (a `<div>`)
2. **Initializes a Leaflet.js map** on that element
3. **Manages the map lifecycle** (mount/unmount)

## What Does MapContainer Contain?

When you render:
```tsx
<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="..." />
  <Marker position={[lat, lng]} />
</MapContainer>
```

MapContainer internally:
1. Creates a `<div>` element
2. Calls `L.map(divElement)` to create a Leaflet map instance
3. Renders child components (TileLayer, Marker, etc.) inside that div

## The DOM Structure

```
Your component tree:
<MapView>
  <div ref={containerRef}>              ← Our wrapper div
    <MapContainer>                      ← react-leaflet component
      <div class="leaflet-container"    ← Created by MapContainer
           _leaflet_id="123"             ← Leaflet tracking (attached by Leaflet)
           _leaflet={mapInstance}>       ← Leaflet tracking
        <div class="leaflet-pane leaflet-map-pane">
          <div class="leaflet-pane leaflet-tile-pane">
            <!-- Tiles rendered here -->
          </div>
          <!-- Markers, popups, etc. rendered here -->
        </div>
      </div>
    </MapContainer>
  </div>
</MapView>
```

## Key Points

1. **MapContainer creates its own div** with class `leaflet-container`
2. **Leaflet attaches `_leaflet_id`** to that div (not to our wrapper)
3. **The `leaflet-container` div is a child** of our `containerRef` div
4. **Leaflet tracks maps by `_leaflet_id`** on the container div

## How Leaflet Tracks Maps

When Leaflet initializes a map:
```javascript
const map = L.map(containerDiv);
// Leaflet does:
containerDiv._leaflet_id = generateUniqueId();  // e.g., "123"
containerDiv._leaflet = map;
// Also stores in registry:
L.Map._leaflet_id[containerDiv._leaflet_id] = map;
```

When Leaflet tries to create a new map:
```javascript
if (containerDiv._leaflet_id) {
  throw new Error("Map container is being reused by another instance");
}
```

## The Problem

When navigating:
1. Old map has `_leaflet_id="123"` on its container div
2. React unmounts MapContainer
3. Cleanup should remove `_leaflet_id`
4. But if cleanup doesn't complete, or if React reuses the div, Leaflet sees `_leaflet_id` still exists
5. **ERROR**: "Map container is being reused"

## What We're Currently Doing

1. **Wrapper div with key**: `key={`map-wrapper-${containerKey}`}`
   - Forces React to destroy/recreate the wrapper div
   
2. **Checking for Leaflet artifacts**: `isContainerClean(containerRef.current)`
   - Checks if wrapper div has `_leaflet_id` (shouldn't)
   - Checks if wrapper div has `.leaflet-container` children (shouldn't)

3. **Cleanup function**: Removes all `.leaflet-container` divs and their `_leaflet_id`

## The Issue

The problem might be:
- **Timing**: MapContainer renders and creates `.leaflet-container` div before cleanup completes
- **React reuse**: Even with key change, React might briefly reuse elements
- **Leaflet async**: Leaflet initialization might be async, causing race conditions

## Solution Approach

We need to ensure:
1. **Old container is completely destroyed** before new one renders
2. **New container is verified clean** before MapContainer renders
3. **MapContainer only initializes** if container is truly clean

The key insight: **MapContainer creates a child div with `leaflet-container` class, and Leaflet attaches `_leaflet_id` to that child div, not our wrapper.**
