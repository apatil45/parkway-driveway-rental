# State Machine Implementation - Map Container Fix

## Overview

Implemented a state machine-based solution to eliminate race conditions in map container lifecycle management.

## State Machine

The map lifecycle is now tracked with explicit states:

```
CLEANING → CLEAN → READY → INITIALIZING → INITIALIZED
   ↑                                    ↓
   └────────────────────────────────────┘
              (on error/unmount)
```

### States

1. **CLEANING**: Cleanup is in progress
2. **CLEAN**: Cleanup completed, container is clean
3. **READY**: Container is clean and ready for initialization
4. **INITIALIZING**: Map initialization started
5. **INITIALIZED**: Map is fully initialized and ready
6. **DESTROYED**: Component is unmounting/unmounted

## Key Features

### 1. Async Cleanup with Promise Tracking

```typescript
const cleanupMap = async (): Promise<void> => {
  // Returns a Promise that resolves when cleanup is complete
  // Uses requestAnimationFrame to ensure DOM operations complete
  // Verifies cleanup completion before resolving
}
```

**Benefits**:
- Can wait for cleanup completion
- Prevents race conditions
- Ensures DOM is truly clean

### 2. Debounced Initialization

```typescript
const scheduleInitialization = () => {
  // Waits for:
  // 1. Cleanup completion (if in progress)
  // 2. React commit (requestAnimationFrame x2)
  // 3. Container validation
  // Only then sets state to READY and allows render
}
```

**Benefits**:
- Ensures all async operations complete
- Prevents premature initialization
- Guarantees clean container

### 3. Initialization Queue

```typescript
// If MapContainer ref callback runs before READY state,
// initialization is queued and processed when READY
initializationQueueRef.current.push(() => {
  // Initialize when safe
});
```

**Benefits**:
- Handles timing issues
- Prevents initialization on dirty containers
- Ensures proper sequencing

### 4. State-Based Rendering

```typescript
// MapContainer only renders when:
// 1. canRender is true
// 2. mapState === 'READY'
// 3. Container is clean (isContainerClean)
{mapState === 'READY' && isContainerClean(containerRef.current) ? (
  <MapContainer ... />
) : (
  <div>Loading...</div>
)}
```

**Benefits**:
- Explicit state control
- Prevents rendering on dirty containers
- Clear lifecycle management

## Flow Diagram

### Normal Flow (Navigation)

```
1. User clicks driveway
   └─> setCanRenderMap(false)
   └─> MapView unmounts
   └─> cleanupMap() starts (state: CLEANING)
   └─> router.push()

2. Navigate back to /search
   └─> containerKey increments
   └─> React creates new div
   └─> MapView mounts
   └─> useLayoutEffect runs
   └─> cleanupMap() (state: CLEANING → CLEAN)
   └─> scheduleInitialization()
   └─> Wait for cleanup + React commit
   └─> State: READY
   └─> setCanRender(true)
   └─> MapContainer renders
   └─> Ref callback: state === READY
   └─> Initialize map (state: INITIALIZING → INITIALIZED)
```

### Error Recovery

```
If container reuse error occurs:
   └─> Catch error in ref callback
   └─> State: CLEANING
   └─> cleanupMap()
   └─> State: CLEAN → READY
   └─> scheduleInitialization()
   └─> Retry initialization
```

## Benefits

1. **No Race Conditions**: State machine ensures proper sequencing
2. **Reliable Cleanup**: Async cleanup with Promise tracking
3. **Safe Initialization**: Only initializes when container is clean and ready
4. **Error Recovery**: Handles errors gracefully and retries
5. **Clear Lifecycle**: Explicit states make debugging easier

## Testing Checklist

- [ ] Navigate from /search to /driveway/[id] and back
- [ ] Navigate multiple times quickly
- [ ] Check browser console for errors
- [ ] Verify map renders correctly
- [ ] Verify no "Map container is being reused" errors
- [ ] Test with slow network (throttle)
- [ ] Test with fast navigation (multiple clicks)

## Implementation Files

- `apps/web/src/components/ui/MapView.tsx` - State machine implementation
- `apps/web/src/app/search/page.tsx` - Container key management (unchanged)

## Next Steps

1. Test thoroughly in development
2. Monitor for any edge cases
3. Add logging if needed for debugging
4. Consider adding state visualization for debugging
