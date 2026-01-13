# MapContainer Flow - Exact Sequence

## DOM Structure Hierarchy

```
Search Page (search/page.tsx)
└─ <div ref={mapContainerRef} key={`map-wrapper-${containerKey}`}>
    └─ <MapView key={`mapview-${viewMode}-${containerKey}`}>
        └─ <div ref={containerRef} key={mapKeyRef.current}>
            └─ <MapContainer>  ← react-leaflet component
                └─ <div class="leaflet-container" _leaflet_id="123" _leaflet={map}>
                    └─ Leaflet map content (tiles, markers, etc.)
```

## The Three Container Levels

1. **Level 1: `mapContainerRef`** (in search page)
   - Key: `map-wrapper-${containerKey}`
   - Purpose: Force React to destroy/recreate on navigation
   - Has Leaflet tracking? **NO** (shouldn't have)

2. **Level 2: `containerRef`** (in MapView)
   - Key: `mapKeyRef.current`
   - Purpose: Wrapper for MapContainer
   - Has Leaflet tracking? **NO** (shouldn't have)
   - Contains: `.leaflet-container` div (created by MapContainer)

3. **Level 3: `.leaflet-container` div** (created by MapContainer)
   - Created by: react-leaflet's MapContainer component
   - Has Leaflet tracking? **YES** (`_leaflet_id`, `_leaflet`)
   - This is what Leaflet tracks!

## Current Flow When Navigating

### Step 1: User on /search
```
mapContainerRef.current = <div key="map-wrapper-0">
  containerRef.current = <div key="map-xxx">
    <div class="leaflet-container" _leaflet_id="123">
      <!-- Map content -->
    </div>
  </div>
</div>
```

### Step 2: User clicks driveway
```
onClick handler:
  setCanRenderMap(false)  ← Unmounts MapView
  router.push('/driveway/123')
```

### Step 3: Navigation away
```
React unmounts MapView
  → MapContainer unmounts
  → cleanupMap() runs
  → Tries to remove _leaflet_id
  → But navigation is already happening
```

### Step 4: Navigate back to /search
```
useEffect detects: !wasOnSearch && isOnSearch
  → setContainerKey(prev => prev + 1)  ← Key changes to 1
  → setCanRenderMap(true)
  
React sees key changed:
  → Destroys old div (key="map-wrapper-0")
  → Creates new div (key="map-wrapper-1")
  
MapView renders:
  → containerRef.current = new div (fresh, no children)
  → useLayoutEffect runs:
    → cleanupMap()  ← Cleans... but containerRef is already new!
    → isContainerClean(containerRef.current)  ← Returns true (it's new!)
    → setCanRender(true)
  
MapContainer renders:
  → Creates <div class="leaflet-container">
  → Leaflet initializes map
  → Attaches _leaflet_id="456"
```

## The Problem: Race Condition

The issue might be:

1. **Old div destruction timing**: When `containerKey` changes, React schedules the old div for destruction, but it might not be immediately removed from DOM

2. **MapContainer initialization**: MapContainer creates the `.leaflet-container` div synchronously when it renders, but Leaflet initialization might be async

3. **Check timing**: We check `isContainerClean` in `useLayoutEffect`, but MapContainer renders AFTER that, so the check passes, but then MapContainer creates the div

4. **Leaflet's check**: When Leaflet tries to initialize, it checks if the container (the `.leaflet-container` div) has `_leaflet_id`. But if React hasn't fully cleaned up the old div, or if there's any leftover reference, Leaflet might see it.

## What MapContainer Actually Does

When `<MapContainer>` renders:

```javascript
// Pseudocode from react-leaflet source
function MapContainer({ center, zoom, children, ...props }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create the div that Leaflet will use
    // This happens INSIDE the containerRef div
    const mapDiv = containerRef.current;  // ← Uses the parent div!
    
    // Initialize Leaflet
    const map = L.map(mapDiv, { center, zoom });
    
    // Leaflet does:
    // mapDiv._leaflet_id = uniqueId();
    // mapDiv._leaflet = map;
    
    return () => {
      map.remove();
    };
  }, []);
  
  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {children}
    </div>
  );
}
```

**WAIT!** I think I found the issue!

MapContainer uses `containerRef.current` (the div we pass to it) **directly** as the Leaflet container. It doesn't create a child div - it uses the div itself!

So the structure is:
```
containerRef.current (our wrapper div)
  ← Leaflet attaches _leaflet_id directly to this div!
  ← Leaflet renders map content as children of this div
```

This means:
- `containerRef.current` IS the Leaflet container
- `_leaflet_id` is attached to `containerRef.current`, not a child
- When we check `isContainerClean(containerRef.current)`, we're checking the right thing
- But MapContainer might be trying to initialize before our cleanup completes

## The Real Issue

When `containerKey` changes:
1. React destroys old div (key="map-wrapper-0")
2. React creates new div (key="map-wrapper-1")
3. MapView renders with new `containerRef`
4. But if the old div cleanup isn't complete, or if there's any reference leak, Leaflet might see the old `_leaflet_id`

Or, more likely:
- MapContainer's `useEffect` runs and tries to initialize Leaflet
- But `containerRef.current` might still have `_leaflet_id` from a previous render
- Even though we checked and cleaned, there might be a timing issue

## Solution: Ensure Complete Isolation

We need to ensure:
1. Old container is completely destroyed before new one is created
2. New container is verified clean before MapContainer renders
3. MapContainer only initializes if container is truly clean

The key is: **MapContainer uses `containerRef.current` directly as the Leaflet container**, so we must ensure that div is completely fresh and clean.
