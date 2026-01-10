# Quick Verification Guide - Critical Checks

## 🚨 Immediate Priority Checks (Do These First)

### 1. **Date/Time Handling Issue** ⚠️ POTENTIAL BUG
**Location**: `apps/web/src/app/driveway/[id]/page.tsx` line 181

**Issue**: Client-side validation checks `start.getTime() > new Date().getTime()` but this uses local time, while server expects UTC ISO strings. There could be timezone mismatches.

**Check**:
- [ ] Test booking with times in different timezones
- [ ] Verify datetime-local input converts correctly to ISO
- [ ] Test edge cases (midnight, DST transitions)

**Current Code**:
```typescript
if (start.getTime() < end.getTime() && start.getTime() > new Date().getTime()) {
```

**Recommendation**: Ensure consistent timezone handling between client and server.

---

### 2. **Missing Error Boundary on Critical Pages**
**Check these pages have error boundaries**:
- [ ] `/driveway/[id]` - Booking form errors
- [ ] `/checkout` - Payment errors
- [ ] `/bookings` - List loading errors

**Current Status**: ErrorBoundary exists at root level, but specific pages might need local error handling.

---

### 3. **Stripe Payment Intent Type Handling**
**Location**: `apps/web/src/components/ui/StripeCheckout.tsx` line 94-108

**Issue**: Complex type assertion for payment intent. Verify this handles all Stripe response types correctly.

**Check**:
- [ ] Test successful payment
- [ ] Test payment with redirect required
- [ ] Test payment failure
- [ ] Verify payment intent ID is always captured

---

### 4. **API Timeout Configuration**
**Location**: `apps/web/src/lib/api.ts` line 7

**Current**: `timeout: 10000` (10 seconds)

**Check**:
- [ ] Is 10 seconds enough for slow networks?
- [ ] Should timeout be configurable per endpoint?
- [ ] Are timeout errors handled gracefully?

---

### 5. **Token Refresh Queue**
**Location**: `apps/web/src/lib/api.ts` lines 18-32, 74-85

**Issue**: Request queue for token refresh. Verify it works correctly.

**Check**:
- [ ] Multiple simultaneous requests during token refresh
- [ ] Queue processes correctly after refresh
- [ ] Failed refresh clears queue properly
- [ ] No memory leaks from queued promises

---

## 🔍 Code Quality Checks

### 6. **Missing Input Validation**
**Check for**:
- [ ] XSS in user inputs (special requests, reviews)
- [ ] SQL injection (handled by Prisma, but verify)
- [ ] File upload validation (if applicable)
- [ ] URL parameter validation

### 7. **Error Message Consistency**
**Check**:
- [ ] All error messages are user-friendly
- [ ] No technical error details exposed to users
- [ ] Error messages are consistent across pages
- [ ] Loading states show appropriate messages

### 8. **Accessibility**
**Quick Checks**:
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Buttons have accessible names
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works

---

## 🧪 Quick Smoke Test (10 minutes)

Run through this flow to verify core functionality:

1. **Authentication** (2 min)
   ```
   → Register new account
   → Login
   → Verify session persists on refresh
   → Logout
   ```

2. **Search & Discovery** (2 min)
   ```
   → Search for driveways
   → Apply filters
   → Click on driveway from list
   → Click marker on map
   → Click "View Details" from map popup
   ```

3. **Booking Flow** (4 min)
   ```
   → View driveway details
   → Fill booking form
   → Submit booking (as authenticated)
   → Complete payment
   → Verify booking in list
   ```

4. **Error Scenarios** (2 min)
   ```
   → Try booking with past date (should fail)
   → Try booking with end before start (should fail)
   → Disconnect network, try API call (should show error)
   ```

---

## 🐛 Known Issues to Verify Fixed

### ✅ Fixed Issues (Verify These Work)
1. **Map Container Reuse** - Should not occur anymore
2. **_leaflet_pos Error** - Should be handled gracefully
3. **SessionStorage Cleanup** - Should clear on unmount
4. **Mount Checks** - Should prevent state updates after unmount
5. **Polling Cleanup** - Should clear intervals properly

### ⚠️ Potential Issues (Watch For)
1. **Timezone Handling** - Date/time conversion between client/server
2. **Token Refresh Race** - Multiple simultaneous refreshes
3. **Payment Verification** - Webhook vs immediate verification
4. **Concurrent Bookings** - Same time slot booked by multiple users

---

## 📊 Performance Benchmarks

**Target Metrics**:
- Initial page load: < 3 seconds
- Search results: < 1 second
- Booking creation: < 2 seconds
- Payment processing: < 5 seconds
- Map initialization: < 2 seconds

**Check**:
- [ ] Network tab shows reasonable load times
- [ ] No unnecessary API calls
- [ ] Images are optimized
- [ ] Bundle size is reasonable

---

## 🔐 Security Checklist

**Critical Security Checks**:
- [ ] No sensitive data in URLs
- [ ] Tokens in httpOnly cookies (not localStorage)
- [ ] CSRF protection enabled
- [ ] Input sanitization
- [ ] Rate limiting on API endpoints
- [ ] HTTPS enforced in production

---

## 📱 Mobile Testing

**Test on Real Devices**:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Touch interactions work
- [ ] Forms are usable (no zoom on focus)
- [ ] Map is interactive
- [ ] Payment form works

---

## 🌐 Browser Compatibility

**Test These Browsers**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

---

## 🚀 Deployment Checklist

**Before Going Live**:
- [ ] Environment variables set
- [ ] API endpoints configured
- [ ] Stripe keys configured (test vs live)
- [ ] Database connection working
- [ ] Error tracking configured (if applicable)
- [ ] Analytics configured (if applicable)
- [ ] SSL certificate valid
- [ ] Domain configured correctly

---

## 📝 Documentation

**Verify Documentation**:
- [ ] README is up to date
- [ ] Environment setup documented
- [ ] Deployment process documented
- [ ] API endpoints documented (if applicable)

---

## 🎯 Focus Areas Based on Recent Fixes

Since we just fixed map, booking, and refresh issues, **prioritize testing**:

1. **Map Interactions** (High Priority)
   - Click markers rapidly
   - Navigate between pages with map
   - Switch view modes (if applicable)
   - Test on mobile devices

2. **Booking Flow** (High Priority)
   - Complete booking as authenticated user
   - Start booking, login, complete booking
   - Test form persistence
   - Verify no duplicate submissions

3. **Refresh & Polling** (Medium Priority)
   - Test auto-refresh for pending bookings
   - Verify polling stops when component unmounts
   - Test manual refresh
   - Check memory usage during long sessions

---

## 💡 Pro Tips

1. **Use Browser DevTools**:
   - Network tab to check API calls
   - Console for errors
   - Performance tab for load times
   - Application tab for cookies/storage

2. **Test Edge Cases**:
   - Slow network (throttle in DevTools)
   - Offline mode
   - Rapid clicking
   - Multiple tabs

3. **Monitor Console**:
   - No unexpected errors
   - No memory leaks warnings
   - No React warnings

4. **Check Network Requests**:
   - No failed requests (except expected 401s)
   - Reasonable response times
   - No duplicate requests

---

## ✅ Success Criteria

**The app is ready if**:
- ✅ All critical user flows work
- ✅ No console errors in normal usage
- ✅ Error handling works for all scenarios
- ✅ Performance is acceptable
- ✅ Mobile experience is good
- ✅ Security checks pass

---

**Next Steps**: Start with the Quick Smoke Test, then work through the Critical Checks, and finally the Comprehensive Testing Checklist.

