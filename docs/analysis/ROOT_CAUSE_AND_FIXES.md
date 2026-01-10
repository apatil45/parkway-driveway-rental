# 🔍 ROOT CAUSE ANALYSIS & FIXES - Map Container Reuse Error

## 🎯 **CRITICAL ISSUES IDENTIFIED**

### **Issue #1: Container Key Changes Too Early** ❌
**Location**: `apps/web/src/app/search/page.tsx:84-98`

**Problem**: 
- `containerKey` was incrementing on EVERY pathname change (both leaving AND returning)
- When leaving search page, React immediately destroys the container div
- But Leaflet cleanup is still running on that div
- This creates a race condition

**Fix**: 
- Only increment `containerKey` when RETURNING to search page
- When leaving, just unmount - don't change key
- This prevents React from destroying the div while cleanup is in progress

### **Issue #2: MapView Key Regenerates on Every Render** ❌
**Location**: `apps/web/src/app/search/page.tsx:550`

**Problem**:
- Key was: `mapview-${viewMode}-${Date.now()}-${Math.random()...}`
- `Date.now()` changes on every render`, not just on mount
- This causes React to constantly destroy and recreate MapView
- Each recreation tries to initialize Leaflet → race condition

**Fix**:
- Changed to: `mapview-${viewMode}-${containerKey}`
- Key only changes when containerKey changes (which is controlled)
- Prevents unnecessary remounting

### **Issue #3: useLayoutEffect Sets canRender Too Early** ❌
**Location**: `apps/web/src/components/ui/MapView.tsx:487-491`

**Problem**:
- `setCanRender(true)` was called immediately after cleanup
- But Leaflet might have async cleanup that's not complete
- MapContainer renders before container is truly clean

**Fix**:
- Added 50ms delay before setting `canRender(true)`
- Added double-check: verify container has no `_leaflet_id` and no `.leaflet-container` elements
- If container is still dirty, clean again and wait longer

### **Issue #4: onClick Sequence Race Condition** ❌
**Location**: `apps/web/src/app/search/page.tsx:605-632`

**Problem**:
- `setContainerKey` was called FIRST, before unmounting
- This triggers React to destroy the div immediately
- But MapView is still mounted and trying to clean up
- Race condition between React destroying div and cleanup running

**Fix**:
- Removed `setContainerKey` from onClick handler
- Container key only changes when returning to search page (via useEffect)
- Proper sequence: unmount → wait → cleanup → navigate

### **Issue #5: Missing Container Validation Before Render** ❌
**Location**: `apps/web/src/components/ui/MapView.tsx:579-584`

**Problem**:
- MapContainer could render even if container has Leaflet tracking
- No runtime check before rendering

**Fix**:
- Added conditional: only render MapContainer if container is verified clean
- Check for `_leaflet_id` and `.leaflet-container` elements
- Show "Preparing map..." if container is not clean

---

## 🔧 **FIXES APPLIED**

### **Fix 1: Smart Container Key Management**
```typescript
// Only regenerate when RETURNING to search page
if (!wasOnSearch && isOnSearch) {
  setContainerKey(prev => prev + 1); // Fresh container
  setCanRenderMap(true);
} else if (wasOnSearch && !isOnSearch) {
  setCanRenderMap(false); // Just unmount, don't change key
}
```

### **Fix 2: Stable MapView Key**
```typescript
// Before: key={`mapview-${viewMode}-${Date.now()}-${Math.random()...}`}
// After:  key={`mapview-${viewMode}-${containerKey}`}
```

### **Fix 3: Delayed Render with Validation**
```typescript
setTimeout(() => {
  if (container is clean) {
    setCanRender(true);
  } else {
    cleanupMap(true); // Clean again
    setTimeout(() => setCanRender(true), 50);
  }
}, 50);
```

### **Fix 4: Proper onClick Sequence**
```typescript
// 1. Unmount first
setCanRenderMap(false);
// 2. Wait for React
await requestAnimationFrame x3;
// 3. Cleanup
cleanupMap();
// 4. Wait more
await setTimeout(100);
// 5. Final cleanup
cleanupMap();
// 6. Navigate (key will change when we return)
router.push(...);
```

### **Fix 5: Runtime Container Validation**
```typescript
{canRender && container is clean ? (
  <MapContainer ... />
) : (
  <div>Preparing map...</div>
)}
```

---

## 📊 **TIMELINE OF EVENTS (FIXED)**

### **Before Fix**:
```
User clicks → setContainerKey (React destroys div) → setCanRenderMap(false) → 
cleanupMap (on destroyed div?) → router.push() → ERROR
```

### **After Fix**:
```
User clicks → setCanRenderMap(false) → wait for React → cleanupMap → 
wait → cleanupMap → router.push() → 
(When returning) → setContainerKey → fresh container → render map
```

---

## ✅ **EXPECTED RESULTS**

1. ✅ No more "Map container is being reused" errors
2. ✅ Smooth navigation without errors
3. ✅ Clean container state on every mount
4. ✅ Proper cleanup sequence
5. ✅ No race conditions

---

## 🧪 **TESTING CHECKLIST**

- [ ] Click driveway → navigate → no error
- [ ] Navigate back to search → map renders correctly
- [ ] Click multiple driveways rapidly
- [ ] Browser back/forward buttons
- [ ] Refresh page on search page
- [ ] Navigate away and return multiple times

---

## 📝 **KEY LEARNINGS**

1. **React keys are powerful but dangerous** - changing them destroys elements immediately
2. **Timing matters** - async React lifecycle vs sync cleanup
3. **Validation is critical** - always verify container state before rendering
4. **Sequence matters** - unmount → wait → cleanup → navigate (in that order)
5. **Leaflet tracks DOM elements** - not React components, so DOM state is what matters
