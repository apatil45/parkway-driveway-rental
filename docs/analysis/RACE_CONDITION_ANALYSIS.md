# Race Condition Analysis - What's Creating the Problem

## The Three Competing Systems

### 1. **React's Rendering Cycle** (Async, Batched)
- React batches state updates
- Component unmounting is async
- DOM updates happen in batches
- React doesn't wait for cleanup to complete

### 2. **Next.js Router Navigation** (Async, Fast)
- Navigation can be very fast
- Route changes trigger re-renders immediately
- Old components unmount while new ones mount
- No guarantee of cleanup completion

### 3. **Leaflet's DOM Tracking** (Synchronous, Immediate)
- Leaflet attaches `_leaflet_id` immediately
- Checks for existing `_leaflet_id` synchronously
- No async cleanup - it's immediate or not at all
- Throws error if `_leaflet_id` exists

## The Race Conditions

### Race Condition #1: Unmount vs Cleanup
```
Timeline:
T0: User clicks driveway
T1: router.push() called
T2: React starts unmounting MapView
T3: MapContainer unmounts → cleanupMap() called
T4: Navigation completes → New page renders
T5: cleanupMap() still running (might not complete)
T6: User navigates back
T7: New MapContainer tries to initialize
T8: Old cleanup still running → _leaflet_id might still exist
T9: ERROR: "Map container is being reused"
```

**Problem**: React doesn't wait for cleanup to complete before unmounting.

### Race Condition #2: Key Change vs DOM Update
```
Timeline:
T0: containerKey changes (setContainerKey(prev => prev + 1))
T1: React schedules old div for destruction
T2: React creates new div
T3: But old div might still exist in DOM
T4: MapContainer renders in new div
T5: Leaflet initializes
T6: But if old div cleanup isn't complete, Leaflet might see old _leaflet_id
```

**Problem**: React's DOM updates are batched, so old and new divs can coexist briefly.

### Race Condition #3: useLayoutEffect vs MapContainer Render
```
Timeline:
T0: useLayoutEffect runs
T1: cleanupMap() called
T2: setCanRender(true) called (immediately)
T3: React renders MapContainer
T4: MapContainer creates .leaflet-container div
T5: Leaflet initializes
T6: But cleanup might not be complete
T7: ERROR if old _leaflet_id still exists
```

**Problem**: `useLayoutEffect` runs before paint, but cleanup might not be synchronous.

### Race Condition #4: Dynamic Import vs React Render
```
Timeline:
T0: MapView component mounts
T1: Dynamic import starts loading
T2: React continues rendering
T3: MapContainer tries to render
T4: But Leaflet code might not be loaded yet
T5: When Leaflet loads, it initializes
T6: But container state might have changed
```

**Problem**: Dynamic import adds another async layer.

## Can We Separate Them?

### Option 1: Separate Map from Navigation (Logical? ✅)

**Idea**: Keep map mounted, just hide it when navigating away.

**Pros**:
- No unmount/remount cycle
- No cleanup needed
- Map state persists
- No race conditions

**Cons**:
- Map stays in memory when not needed
- Might cause performance issues
- Not truly "separated" - still in DOM

**Verdict**: **Logical for our app?** Maybe, but not ideal. We want to clean up when not on search page.

### Option 2: Separate Cleanup from Unmount (Logical? ✅)

**Idea**: Cleanup BEFORE unmounting, wait for completion.

**How**:
1. When navigating away: Cleanup first, THEN unmount
2. When navigating back: Wait for cleanup, THEN mount

**Pros**:
- Ensures cleanup completes
- No race condition
- Clean separation

**Cons**:
- Adds delay to navigation
- More complex state management
- User might notice slight delay

**Verdict**: **Logical for our app?** Yes! This makes sense.

### Option 3: Separate Container from Map (Logical? ✅)

**Idea**: Always keep a container div, but destroy/recreate only the MapContainer.

**How**:
- Keep wrapper div mounted
- Only unmount/remount MapContainer component
- Container div stays, but is cleaned between maps

**Pros**:
- No container recreation
- Cleaner lifecycle
- Less React churn

**Cons**:
- Still need to clean container between maps
- Might not solve the issue if Leaflet tracks the container

**Verdict**: **Logical for our app?** Maybe, but might not solve the root issue.

### Option 4: Separate Map Instance from Container (Logical? ✅)

**Idea**: Use a portal or iframe to isolate Leaflet completely.

**How**:
- Render map in an iframe or portal
- Completely isolated DOM
- No interference with main app

**Pros**:
- Complete isolation
- No race conditions
- Clean separation

**Cons**:
- Complex implementation
- iframe has limitations (events, styling)
- Portal still shares DOM

**Verdict**: **Logical for our app?** Probably overkill.

## Out-of-the-Box Ideas

### Idea 1: **Map Pool Pattern** (Like Object Pooling)
**Concept**: Pre-create map instances, reuse them instead of creating/destroying.

**How**:
- Create a pool of map instances
- When navigating: Return map to pool (don't destroy)
- When returning: Get map from pool
- Only create new if pool is empty

**Pros**:
- No creation/destruction overhead
- No cleanup needed
- Fast switching

**Cons**:
- Memory overhead
- Complex state management
- Maps might have stale data

**Verdict**: **Interesting but complex**

### Idea 2: **Single Map Instance, Multiple Containers**
**Concept**: Keep one Leaflet map instance, just move it between containers.

**How**:
- Create map instance once
- When navigating: Detach map from container (but keep instance)
- When returning: Attach map to new container
- No cleanup needed

**Pros**:
- No initialization overhead
- No cleanup needed
- Fast switching

**Cons**:
- Leaflet might not support this
- Complex implementation
- Might have state issues

**Verdict**: **Probably not supported by Leaflet**

### Idea 3: **Lazy Map Initialization with Queue**
**Concept**: Queue map initialization requests, process one at a time.

**How**:
- When MapContainer renders: Add to queue
- Process queue sequentially
- Wait for previous cleanup before next initialization
- Ensure only one map initializes at a time

**Pros**:
- Guarantees no race conditions
- Simple to implement
- Reliable

**Cons**:
- Adds delay
- More complex state
- Might feel slow

**Verdict**: **Good idea, worth considering**

### Idea 4: **Map as Separate Route/Page**
**Concept**: Make map its own route, use Next.js layout to keep it mounted.

**How**:
- `/search` route includes map in layout
- Map stays mounted when navigating to `/driveway/[id]`
- Just hide/show map instead of unmounting

**Pros**:
- No unmount/remount
- No cleanup needed
- Simple

**Cons**:
- Map in memory when not needed
- Layout complexity
- Not truly "separate"

**Verdict**: **Simple but not ideal**

### Idea 5: **Web Worker for Map** (Most Out-of-the-Box)
**Concept**: Run Leaflet in a Web Worker, render to canvas.

**How**:
- Leaflet runs in Web Worker
- Renders to canvas
- No DOM manipulation
- No _leaflet_id tracking

**Pros**:
- Complete isolation
- No DOM race conditions
- Parallel processing

**Cons**:
- Major rewrite
- Leaflet might not support this
- Complex implementation
- Performance considerations

**Verdict**: **Very out-of-the-box, but probably not feasible**

### Idea 6: **Map as Singleton Service**
**Concept**: Create map as a singleton service, manage lifecycle outside React.

**How**:
- Create MapService class
- Manages single map instance
- React components just request/release map
- Service handles all cleanup

**Pros**:
- Centralized management
- No React lifecycle issues
- Clean separation

**Cons**:
- More complex architecture
- Need to sync with React
- Still need cleanup

**Verdict**: **Good architectural pattern**

### Idea 7: **Virtual Container Pattern**
**Concept**: Always render to a virtual container, swap containers when needed.

**How**:
- Keep a "virtual" container div always mounted
- MapContainer always renders to this container
- When navigating: Clean container, don't unmount MapContainer
- When returning: Container is already clean, just re-initialize

**Pros**:
- No unmount/remount
- Container always exists
- Simpler lifecycle

**Cons**:
- MapContainer stays mounted
- Still need cleanup
- Might not solve issue

**Verdict**: **Interesting, might work**

### Idea 8: **Debounced Map Initialization**
**Concept**: Wait for all async operations to complete before initializing.

**How**:
- When MapContainer renders: Don't initialize immediately
- Wait for: React commit, cleanup completion, navigation completion
- Use a debounce/throttle mechanism
- Only initialize when "safe"

**Pros**:
- Ensures all async ops complete
- Simple to implement
- Reliable

**Cons**:
- Adds delay
- Might feel slow
- Need to track multiple conditions

**Verdict**: **Practical solution**

## Recommended Approach

Based on analysis, I recommend **Option 2 + Idea 8**:

1. **Separate cleanup from unmount**: Cleanup BEFORE unmounting, wait for completion
2. **Debounced initialization**: Wait for all async operations before initializing map
3. **State machine**: Use a state machine to track: CLEANING → CLEAN → READY → INITIALIZING → INITIALIZED

This ensures:
- Cleanup always completes before unmount
- Initialization only happens when safe
- No race conditions
- Reliable behavior

## Implementation Strategy

1. **Add cleanup completion tracking**: Use Promise/async to track cleanup completion
2. **Add initialization queue**: Queue initialization requests, process when safe
3. **Add state machine**: Track map state explicitly
4. **Add debounce**: Wait for React commit + cleanup + navigation to complete

This is logical for our app and should solve the race conditions.
