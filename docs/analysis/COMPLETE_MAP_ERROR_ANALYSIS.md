# 🔍 COMPLETE LINE-BY-LINE ANALYSIS: Map Container Reuse Error

## 📋 Executive Summary

**Error**: "Map container is being reused by another instance"  
**Location**: Occurs when clicking driveways on search page  
**Root Cause**: Race condition between React's component lifecycle, Next.js router navigation, and Leaflet's DOM element tracking

---

## 🏗️ Architecture Overview

### Component Hierarchy
```
RootLayout (layout.tsx)
  └─ ErrorBoundary
      └─ ToastProvider
          └─ SearchPage (page.tsx)
              └─ SearchPageContent
                  └─ MapView (MapView.tsx)
                      └─ LeafletMap (dynamic import)
                          └─ MapContainer (react-leaflet)
```

### Key Files
1. `apps/web/src/app/search/page.tsx` - Search page with map container
2. `apps/web/src/components/ui/MapView.tsx` - Map component wrapper
3. `apps/web/src/components/ErrorBoundary.tsx` - Error handling

---

## 🔄 EXACT SEQUENCE OF EVENTS (Line-by-Line)

### **Phase 1: Initial Render (Search Page Load)**

#### `apps/web/src/app/search/page.tsx`

**Line 70-76**: State and refs initialization
```typescript
const mapContainerRef = useRef<HTMLDivElement>(null);
const [canRenderMap, setCanRenderMap] = useState(true);
const [containerKey, setContainerKey] = useState(0);
const router = useRouter();
const pathname = usePathname();
```

**Line 84-98**: Pathname change effect
```typescript
useEffect(() => {
  setContainerKey(prev => prev + 1);  // ⚠️ ISSUE: Increments on EVERY pathname change
  setCanRenderMap(false);
  const timer = setTimeout(() => {
    if (pathname === '/search') {
      setCanRenderMap(true);
    }
  }, 100);
  return () => clearTimeout(timer);
}, [pathname]);
```

**PROBLEM IDENTIFIED #1**: This effect runs when pathname changes, but it also runs when:
- User navigates TO search page
- User navigates AWAY from search page
- Any route change happens

This causes `containerKey` to increment even when we don't want it to!

**Line 543-547**: Container div with dynamic key
```typescript
<div 
  ref={mapContainerRef}
  key={`map-wrapper-${containerKey}`}  // ⚠️ ISSUE: Key changes = React destroys/recreates div
  className="..."
>
```

**CRITICAL UNDERSTANDING**: When `containerKey` changes:
1. React schedules the old div for destruction
2. React creates a NEW div element
3. BUT: The old div might still exist in DOM when Leaflet tries to initialize
4. Leaflet sees the old div still has `_leaflet_id` → ERROR

**Line 548-566**: Conditional MapView rendering
```typescript
{!emptyResults && canRenderMap && (
  <MapView
    key={`mapview-${viewMode}-${Date.now()}-${Math.random()...}`}  // ⚠️ ISSUE: Key regenerates on EVERY render!
    viewMode={viewMode}
    center={mapCenter}
    markers={mapMarkers}
    ...
  />
)}
```

**PROBLEM IDENTIFIED #2**: The MapView key uses `Date.now()` which changes on EVERY render, not just on mount. This causes React to constantly destroy and recreate MapView!

---

### **Phase 2: MapView Component Lifecycle**

#### `apps/web/src/components/ui/MapView.tsx`

**Line 8-33**: Dynamic import with SSR disabled
```typescript
const LeafletMap = dynamic(async () => {
  const L = await import('react-leaflet');
  const leaflet = await import('leaflet');
  // ...
}, { ssr: false });
```

**PROBLEM IDENTIFIED #3**: Dynamic import means:
- Component only loads on client
- There's a delay between component mount and actual Leaflet code loading
- During this delay, React might have already started rendering

**Line 42**: Map key generation
```typescript
const mapKeyRef = useRef<string>(`map-${viewMode}-${Date.now()}-${Math.random()...}`);
```

**PROBLEM IDENTIFIED #4**: This key is generated ONCE when the component function is created, but the component function is recreated on every render because it's inside a dynamic import callback!

**Line 348-503**: useLayoutEffect - Synchronous cleanup
```typescript
useLayoutEffect(() => {
  mountCountRef.current += 1;
  cleanupMap(true);  // Force cleanup
  setCanRender(false);
  
  // ... cleanup logic ...
  
  if (mountCountRef.current === currentMount && !isDestroyedRef.current && !isNavigatingRef.current) {
    setCanRender(true);  // ⚠️ ISSUE: Sets canRender immediately
  }
}, [viewMode]);
```

**PROBLEM IDENTIFIED #5**: `useLayoutEffect` runs BEFORE browser paint, but:
- Cleanup might not be complete
- Leaflet DOM elements might still exist
- Setting `canRender(true)` immediately allows MapContainer to render
- MapContainer tries to initialize on a container that might still have Leaflet tracking

**Line 556-697**: MapContainer ref callback
```typescript
<MapContainer
  key={`${mapKeyRef.current}-${viewMode}-${mountCountRef.current}`}
  ref={(map) => {
    if (!map) {
      // Unmounting - cleanup
      return;
    }
    
    // ⚠️ CRITICAL: This callback runs when MapContainer mounts
    // But it might run BEFORE cleanup is complete!
    
    if (isCleaningUpRef.current || isDestroyedRef.current || isNavigatingRef.current) {
      return;  // Guard check
    }
    
    // Check for _leaflet_id
    if ((container as any)._leaflet_id) {
      cleanupMap(true);
      return;  // Don't initialize
    }
    
    // ... initialization logic ...
  }}
>
```

**PROBLEM IDENTIFIED #6**: The ref callback runs when React creates the MapContainer, but:
- React might create MapContainer BEFORE cleanup completes
- The container div might still have `_leaflet_id` from previous instance
- Even with checks, there's a race condition window

---

### **Phase 3: User Clicks Driveway (Navigation Trigger)**

#### `apps/web/src/app/search/page.tsx` - Line 605-632

**EXACT SEQUENCE**:
```typescript
onClick={async () => {
  // Step 1: Change containerKey
  setContainerKey(prev => prev + 1);  // ⚠️ ISSUE: This triggers React to destroy old div
  
  // Step 2: Unmount MapView
  setCanRenderMap(false);  // ⚠️ ISSUE: This triggers React unmount, but async!
  
  // Step 3: Wait for React to process
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => requestAnimationFrame(resolve));
  // ⚠️ ISSUE: requestAnimationFrame doesn't guarantee React has finished unmounting!
  
  // Step 4: Cleanup
  cleanupMap();  // ⚠️ ISSUE: Cleanup runs, but old div might already be destroyed by React
  
  // Step 5: More cleanup
  await new Promise(resolve => setTimeout(resolve, 50));
  cleanupMap();
  
  // Step 6: Navigate
  router.push(`/driveway/${driveway.id}`);  // ⚠️ ISSUE: Navigation happens, but cleanup might not be complete
}
```

**PROBLEM IDENTIFIED #7**: The sequence has multiple race conditions:
1. `setContainerKey` triggers React to destroy old div
2. `setCanRenderMap(false)` triggers React to unmount MapView
3. But React's unmounting is ASYNC - it doesn't happen immediately
4. `requestAnimationFrame` doesn't wait for React's unmount cycle
5. Cleanup runs, but might be cleaning up a div that React is already destroying
6. Navigation happens before everything is settled

---

## 🐛 ROOT CAUSES IDENTIFIED

### **Root Cause #1: React Key Changes Too Early**
- `containerKey` changes BEFORE cleanup completes
- React destroys old div while Leaflet still thinks it's in use
- New div is created, but old div's `_leaflet_id` might still be in Leaflet's registry

### **Root Cause #2: Async React Lifecycle vs Sync Cleanup**
- React's unmounting is asynchronous
- Our cleanup is synchronous
- We're trying to clean up before React finishes unmounting
- Leaflet sees the container as "in use" during this window

### **Root Cause #3: Dynamic Import Timing**
- MapView is dynamically imported
- There's a delay between component mount and Leaflet code availability
- During this delay, React might have already rendered MapContainer
- MapContainer tries to initialize before Leaflet is ready

### **Root Cause #4: Multiple Key Regenerations**
- MapView key regenerates on every render (Date.now())
- Container key changes on pathname change
- This causes constant remounting
- Each remount creates a new Leaflet instance attempt

### **Root Cause #5: useLayoutEffect Timing**
- `useLayoutEffect` runs before paint
- But cleanup might not be complete
- `setCanRender(true)` happens immediately
- MapContainer renders before container is truly clean

### **Root Cause #6: Ref Callback Race Condition**
- MapContainer's ref callback runs when component mounts
- But it might run before cleanup completes
- Even with guards, there's a timing window

---

## 🔧 THE REAL PROBLEM

**The fundamental issue**: We're trying to coordinate THREE asynchronous systems:
1. **React's rendering cycle** (async, batched)
2. **Next.js router navigation** (async, can be fast)
3. **Leaflet's DOM tracking** (synchronous, immediate)

These three systems are not synchronized, creating race conditions.

---

## 💡 THE SOLUTION

We need to ensure **complete synchronization**:

1. **Wait for React to fully unmount** before changing keys
2. **Wait for cleanup to complete** before allowing new initialization
3. **Prevent any initialization** if container is not 100% clean
4. **Use a more reliable unmount detection** mechanism

Let me implement a fix that addresses all these issues.
