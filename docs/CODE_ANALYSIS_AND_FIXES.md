# Comprehensive Code Analysis: Map, Booking, and Refresh Logic

## Issues Found

### 1. Search Page (`apps/web/src/app/search/page.tsx`)

#### Issue 1.1: Unnecessary Search on Router Change
**Line 105-107:**
```typescript
useEffect(() => {
  performSearch();
}, [router]);
```
**Problem:** This triggers a search on every router change, even when just navigating between pages. The router object reference changes frequently.

**Fix:** Should only search when filters change or on initial mount.

#### Issue 1.2: Hardcoded viewMode with Unused Cleanup
**Line 67:**
```typescript
const [viewMode] = useState<'map' | 'list' | 'split'>('split');
```
**Line 110-160:** Cleanup effect depends on `viewMode` but it never changes.

**Problem:** The cleanup effect will never run because viewMode is constant. This is dead code.

**Fix:** Either make viewMode changeable or remove the cleanup effect.

#### Issue 1.3: Missing Dependencies in performSearch
**Line 162:** `performSearch` uses `filters` but it's not in any dependency array.

**Problem:** If filters change, search won't automatically update.

### 2. MapView Component (`apps/web/src/components/ui/MapView.tsx`)

#### Issue 2.1: Race Condition in Cleanup
**Line 203-308:** `useLayoutEffect` cleanup with delayed state update.

**Problem:** 
- Cleanup sets `isDestroyedRef.current = true` (line 133)
- Then sets `canRender` to false (line 209)
- After 150ms timeout, sets `canRender` to true (line 293)
- If component unmounts during the 150ms, state update happens on unmounted component

**Fix:** Check mount count before setting state.

#### Issue 2.2: Multiple Cleanup Effects
**Lines 177-189, 192-200, 203-308:** Three different cleanup effects.

**Problem:** Could cause cleanup to run multiple times, potentially causing issues.

**Fix:** Consolidate cleanup logic.

#### Issue 2.3: isMapValid Function Location
**Line 45-57:** `isMapValid` is defined inside the component but used by child components.

**Problem:** Function is recreated on every render, and child components (MapUpdater, MapResizeHandler) can't access it directly - they use `useMap()` hook instead.

**Note:** This is actually fine - the child components use `useMap()` hook which gives them the map instance directly.

### 3. Booking Flow (`apps/web/src/app/driveway/[id]/page.tsx`)

#### Issue 3.1: SessionStorage Not Cleaned Up
**Line 112-136:** Form data saved to sessionStorage but only cleared on successful restore.

**Problem:** If user navigates away without booking, sessionStorage persists.

**Fix:** Clear on component unmount or when booking succeeds.

#### Issue 3.2: isSubmittingRef Reset Timing
**Line 356:** `isSubmittingRef.current = false` in finally block.

**Problem:** If redirect happens (line 277), the ref is reset but component might unmount, causing potential issues if user navigates back quickly.

**Fix:** Reset ref before redirect or in cleanup.

### 4. Bookings Page (`apps/web/src/app/bookings/page.tsx`)

#### Issue 4.1: Auto-Refresh Polling
**Line 65-78:** Polling interval for pending bookings.

**Problem:** 
- Dependency array includes `pagination.page` which could cause interval to restart unnecessarily
- If component unmounts, interval might not be cleared properly if bookings array changes

**Fix:** Better dependency management and cleanup.

#### Issue 4.2: Missing Cleanup in fetchBookings
**Line 130:** `fetchBookings` doesn't check if component is still mounted.

**Problem:** If user navigates away during fetch, state updates could happen on unmounted component.

**Fix:** Use abort controller or mount check.

### 5. Checkout Page (`apps/web/src/app/checkout/page.tsx`)

#### Issue 5.1: Race Condition in Success Handler
**Line 196-200:** Success handler waits 1 second then redirects.

**Problem:** If webhook processes faster, user sees stale data. If slower, user might see "Payment Received - Confirming Booking" message unnecessarily.

**Note:** This is actually handled well by the bookings page auto-refresh.

### 6. Error Boundary (`apps/web/src/components/ErrorBoundary.tsx`)

#### Issue 6.1: Page Reload for Map Errors
**Line 54-55:** Reloads entire page for map errors.

**Problem:** Loses all application state, user context, etc.

**Fix:** Could try to reset error boundary state first, then reload only if that fails.

## Recommended Fixes

### Priority 1 (Critical)
1. Fix search page router dependency
2. Fix map cleanup race conditions
3. Fix bookings polling cleanup

### Priority 2 (Important)
4. Clean up sessionStorage properly
5. Fix viewMode cleanup logic
6. Add mount checks to async operations

### Priority 3 (Nice to Have)
7. Improve error boundary recovery
8. Optimize map cleanup consolidation

