# MapContainer Basics - How It Works

## What is MapContainer?

`MapContainer` is a React component from the `react-leaflet` library. It's a wrapper that:
1. Creates a DOM element (a `<div>`)
2. Initializes a Leaflet.js map instance on that element
3. Manages the lifecycle of the Leaflet map

## How MapContainer Works

### Step 1: React Renders MapContainer

```tsx
<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="..." />
  <Marker position={[lat, lng]} />
</MapContainer>
```

When React renders this:
- React creates a **wrapper div** (this is what `containerRef` points to in our code)
- Inside that div, MapContainer creates **its own div** with class `leaflet-container`
- This inner div is where Leaflet actually renders the map

### Step 2: Leaflet Initialization

When MapContainer mounts, it:
1. Creates a div element: `<div class="leaflet-container">...</div>`
2. Calls Leaflet's `L.map(divElement)` to create a map instance
3. Leaflet attaches tracking properties to the div:
   - `div._leaflet_id` = unique ID (e.g., `123`)
   - `div._leaflet` = reference to the map instance
4. Leaflet stores this mapping in its internal registry

### Step 3: DOM Structure

The actual DOM structure looks like this:

```
<div ref={containerRef}>                    ← Our wrapper (containerRef)
  <div class="leaflet-container"            ← Created by MapContainer
       _leaflet_id="123"                    ← Leaflet tracking
       _leaflet={MapInstance}>               ← Leaflet tracking
    <div class="leaflet-pane leaflet-map-pane">
      <div class="leaflet-pane leaflet-tile-pane">
        <!-- Tiles, markers, etc. -->
      </div>
    </div>
  </div>
</div>
```

## The Problem: Container Reuse

### What Leaflet Does

Leaflet tracks maps by:
1. **Unique ID**: Each map gets a unique `_leaflet_id` on its container div
2. **Registry**: Leaflet maintains an internal registry: `L.Map._leaflet_id = { 123: mapInstance }`
3. **Validation**: When creating a new map, Leaflet checks if the container already has `_leaflet_id`
4. **Error**: If `_leaflet_id` exists, Leaflet throws: "Map container is being reused by another instance"

### Why It Happens

```
Scenario:
1. User on /search → MapContainer creates div with _leaflet_id=123
2. User clicks driveway → Navigate to /driveway/[id]
3. React unmounts MapContainer → But cleanup might not complete
4. User navigates back to /search
5. React might reuse the same div (if key hasn't changed)
6. MapContainer tries to initialize → Leaflet sees _leaflet_id=123 still exists
7. ERROR: "Map container is being reused"
```

## Current Implementation Analysis

### Our Wrapper Structure

```tsx
// In search/page.tsx
<div 
  ref={mapContainerRef}
  key={`map-wrapper-${containerKey}`}  // ← This forces React to recreate div
>
  {canRenderMap && (
    <MapView ... />  // ← This renders MapContainer
  )}
</div>
```

### MapView Structure

```tsx
// In MapView.tsx
<div
  ref={containerRef}  // ← Points to our wrapper div
  key={mapKeyRef.current}
>
  {canRender && containerRef.current && isContainerClean(containerRef.current) ? (
    <MapContainer ... />  // ← Creates leaflet-container div inside containerRef
  ) : (
    <div>Loading...</div>
  )}
</div>
```

## The Issue: Two Levels of Containers

We have **TWO** container divs:

1. **Outer container** (`mapContainerRef` in search page)
   - Has key: `map-wrapper-${containerKey}`
   - This is what we're trying to control

2. **Inner container** (`containerRef` in MapView)
   - Wraps MapContainer
   - Also has a key: `mapKeyRef.current`

3. **Leaflet container** (created by MapContainer)
   - Has class: `leaflet-container`
   - Has `_leaflet_id` and `_leaflet` properties
   - This is what Leaflet tracks

## The Real Problem

When we check `isContainerClean(containerRef.current)`, we're checking the **wrapper div**, but:
- Leaflet attaches `_leaflet_id` to the **inner `leaflet-container` div**, not the wrapper
- Our cleanup might remove the inner div, but if React reuses the wrapper div, MapContainer might try to create a new inner div before the old one is fully cleaned

## What MapContainer Actually Does

When MapContainer mounts:

```javascript
// Pseudocode of what MapContainer does internally
function MapContainer({ center, zoom, children }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Create the div that Leaflet will use
    const div = document.createElement('div');
    div.className = 'leaflet-container';
    containerRef.current.appendChild(div);
    
    // Initialize Leaflet map
    const map = L.map(div, { center, zoom });
    
    // Leaflet automatically does:
    // div._leaflet_id = generateUniqueId();
    // div._leaflet = map;
    // L.Map._leaflet_id[div._leaflet_id] = map;
    
    return () => {
      // Cleanup
      map.remove();  // This should remove _leaflet_id
    };
  }, []);
  
  return <div ref={containerRef}>{children}</div>;
}
```

## Key Insight

**MapContainer creates its own div inside our wrapper div.**

So the structure is:
```
Our wrapper div (containerRef)
  └─ MapContainer's div (created by react-leaflet)
      └─ leaflet-container div (created by MapContainer, has _leaflet_id)
```

When we check `isContainerClean(containerRef.current)`, we need to check:
1. Does the wrapper have `_leaflet_id`? (shouldn't, but check anyway)
2. Does it have any `.leaflet-container` children? (this is what matters!)

## The Solution Should Be

1. **Force React to destroy wrapper div** when navigating (✅ we do this with `containerKey`)
2. **Ensure no `.leaflet-container` exists** before allowing MapContainer to render (✅ we check this)
3. **But**: We might be checking the wrong container or at the wrong time

Let me check if we're checking the right container...
