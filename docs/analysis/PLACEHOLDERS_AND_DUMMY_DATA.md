# 📋 Placeholders, Dummy Data, and Fake Implementations

**Date**: December 2024  
**Status**: ⚠️ **REVIEW REQUIRED BEFORE PRODUCTION**  
**Purpose**: Comprehensive list of all placeholders, dummy data, stubs, and test data used throughout the codebase

---

## 🔴 CRITICAL - MUST REPLACE BEFORE PRODUCTION

### 1. **Fake Stripe Payment Intent Secrets** 🔴 CRITICAL
**Location**: `apps/web/src/app/api/payments/intent/route.ts`

**Issue**: Fake payment intent client secrets generated when Stripe is not configured:
```typescript
// Line 138 & 194
const fakeClientSecret = `pi_test_${Math.random().toString(36).slice(2)}_secret_${Math.random().toString(36).slice(2)}`;
```

**Problem**: 
- Returns fake payment secrets in development
- Payments will fail silently
- Users may think payment succeeded when it didn't

**Impact**: 
- Payment processing will not work
- Financial transactions will fail
- User confusion and potential data inconsistency

**Fix**: 
- Ensure `STRIPE_SECRET_KEY` is always set in production
- Remove stub fallback or make it fail loudly
- Add environment validation on startup

**Priority**: 🔴 **CRITICAL**

---

### 2. **Stub Webhook Response** 🔴 CRITICAL
**Location**: `apps/web/src/app/api/payments/webhook/route.ts`

**Issue**: Returns stub response when webhook signature is missing:
```typescript
// Line 157
return NextResponse.json({ received: true, stub: true });
```

**Problem**: 
- Webhook processing silently fails
- Payment statuses won't update
- Bookings won't be confirmed

**Impact**: 
- Payment webhooks won't process
- Booking statuses will be incorrect
- Users won't receive confirmations

**Fix**: 
- Ensure `STRIPE_WEBHOOK_SECRET` is always set
- Return error instead of stub in production
- Add logging for missing webhook secret

**Priority**: 🔴 **CRITICAL**

---

### 3. **Test User Credentials in Seed Data** 🔴 CRITICAL
**Location**: `packages/database/prisma/seed.ts`

**Issue**: Hardcoded test users with weak passwords:
```typescript
// Lines 10-36
const hashedPassword = await bcrypt.hash('password123', 10);

const owner = await prisma.user.upsert({
  where: { email: 'owner@parkway.com' },
  // ...
  password: hashedPassword,
  name: 'John Owner',
  phone: '+1234567890',
});

const driver = await prisma.user.upsert({
  where: { email: 'driver@parkway.com' },
  // ...
  password: hashedPassword,
  name: 'Jane Driver',
  phone: '+1234567891',
});
```

**Problem**: 
- Weak password: `password123`
- Test emails: `owner@parkway.com`, `driver@parkway.com`
- Fake phone numbers: `+1234567890`, `+1234567891`
- Generic names: `John Owner`, `Jane Driver`

**Impact**: 
- Security risk if seed runs in production
- Test accounts accessible in production
- Potential unauthorized access

**Fix**: 
- Only run seed in development
- Use environment variables for test credentials
- Add check to prevent seeding in production
- Use stronger passwords

**Priority**: 🔴 **CRITICAL**

---

### 4. **Sample Driveway Data in Seed** 🔴 CRITICAL
**Location**: `packages/database/prisma/seed.ts`

**Issue**: Hardcoded sample driveway with fake address:
```typescript
// Lines 39-58
const driveway = await prisma.driveway.create({
  data: {
    title: 'Downtown Premium Spot',
    description: 'Convenient parking spot in the heart of downtown. Close to restaurants and shopping.',
    address: '123 Main Street, Downtown, New York, NY 10001',
    latitude: 40.7589,
    longitude: -73.9851,
    pricePerHour: 5.00,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
    ],
  },
});
```

**Problem**: 
- Fake address: `123 Main Street, Downtown, New York, NY 10001`
- Unsplash placeholder images
- Generic description

**Impact**: 
- Misleading data in production
- Users may try to book non-existent driveways
- Legal issues if address is real but not owned

**Fix**: 
- Only seed in development
- Use clearly marked test data
- Add environment check before seeding

**Priority**: 🔴 **CRITICAL**

---

### 5. **Sample Booking Data in Seed** 🔴 CRITICAL
**Location**: `packages/database/prisma/seed.ts`

**Issue**: Hardcoded sample booking with fake vehicle info:
```typescript
// Lines 62-78
const booking = await prisma.booking.create({
  data: {
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Silver',
      licensePlate: 'ABC123'
    },
    totalPrice: 40.00,
    status: 'CONFIRMED',
    paymentStatus: 'COMPLETED',
  },
});
```

**Problem**: 
- Fake vehicle: `Toyota Camry`, `Silver`, `ABC123`
- Hardcoded dates: `2024-01-15T09:00:00Z`
- Fake payment status

**Impact**: 
- Misleading booking data
- Test data in production database

**Fix**: 
- Only seed in development
- Use environment check

**Priority**: 🔴 **CRITICAL**

---

## 🟡 HIGH PRIORITY - SHOULD REPLACE

### 6. **Hardcoded Statistics on About Page** 🟡 HIGH
**Location**: `apps/web/src/app/about/page.tsx`

**Issue**: Hardcoded platform statistics:
```typescript
// Lines 134-148
<div className="text-4xl font-bold text-primary-600 mb-2">1,000+</div>
<div className="text-gray-600">Active Users</div>

<div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
<div className="text-gray-600">Listed Driveways</div>

<div className="text-4xl font-bold text-primary-600 mb-2">10,000+</div>
<div className="text-gray-600">Successful Bookings</div>

<div className="text-4xl font-bold text-primary-600 mb-2">$50K+</div>
<div className="text-gray-600">Earned by Owners</div>
```

**Problem**: 
- Fake statistics
- Not dynamic
- Misleading to users

**Impact**: 
- False advertising
- Trust issues when real numbers are lower
- Legal concerns

**Fix**: 
- Fetch real statistics from database
- Use `/api/stats/public` endpoint
- Show actual numbers or "Coming Soon" if no data

**Priority**: 🟡 **HIGH**

---

### 7. **Fallback Statistics on Home Page** 🟡 HIGH
**Location**: `apps/web/src/app/page.tsx`

**Issue**: Fallback placeholder values when stats are 0:
```typescript
// Lines 307-319
{stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : '1K+'}
{stats.activeDriveways > 0 ? stats.activeDriveways.toLocaleString() : '500+'}
{stats.completedBookings > 0 ? stats.completedBookings.toLocaleString() : '10K+'}
```

**Problem**: 
- Shows fake numbers when real stats are 0
- Misleading to users
- Inconsistent with actual data

**Impact**: 
- False representation
- Trust issues

**Fix**: 
- Show actual numbers (even if 0)
- Or show "Coming Soon" message
- Remove fallback placeholders

**Priority**: 🟡 **HIGH**

---

### 8. **Fake Testimonials on Home Page** 🟡 HIGH
**Location**: `apps/web/src/app/page.tsx`

**Issue**: Hardcoded fake testimonials:
```typescript
// Lines 445-506
<Card>
  <p>"Parkway has completely solved my parking problem..."</p>
  <div className="font-semibold">John D.</div>
  <div className="text-sm text-gray-600">Regular Driver</div>
</Card>

<Card>
  <p>"I've been listing my driveway for 6 months and made over $2,000..."</p>
  <div className="font-semibold">Sarah M.</div>
  <div className="text-sm text-gray-600">Property Owner</div>
</Card>

<Card>
  <p>"The app is intuitive and the customer service is excellent..."</p>
  <div className="font-semibold">Mike R.</div>
  <div className="text-sm text-gray-600">Both Driver & Owner</div>
</Card>
```

**Problem**: 
- Fake testimonials: `John D.`, `Sarah M.`, `Mike R.`
- Generic quotes
- No real user data

**Impact**: 
- False advertising
- Legal concerns (FTC requires disclosure)
- Trust issues when users realize they're fake

**Fix**: 
- Fetch real reviews from database
- Only show testimonials from verified users
- Add "Verified User" badges
- Or remove testimonials section until real data exists

**Priority**: 🟡 **HIGH**

---

### 9. **Hardcoded Recent Activity on Dashboard** 🟡 HIGH
**Location**: `apps/web/src/app/dashboard/page.tsx`

**Issue**: Hardcoded fake activity items:
```typescript
// Lines 221-258
<div>
  <p className="text-sm font-medium text-gray-900">Booking Confirmed</p>
  <p className="text-sm text-gray-600">Your booking for Downtown Premium Spot has been confirmed</p>
</div>
<span className="text-sm text-gray-500">2 hours ago</span>

<div>
  <p className="text-sm font-medium text-gray-900">Payment Received</p>
  <p className="text-sm text-gray-600">You received $40.00 for your driveway booking</p>
</div>
<span className="text-sm text-gray-500">1 day ago</span>

<div>
  <p className="text-sm font-medium text-gray-900">New Review</p>
  <p className="text-sm text-gray-600">You received a 5-star review for your driveway</p>
</div>
<span className="text-sm text-gray-500">3 days ago</span>
```

**Problem**: 
- Fake activity data
- Not dynamic
- Misleading to users

**Impact**: 
- Users see fake activity
- Confusion when real activity doesn't match
- Poor user experience

**Fix**: 
- Fetch real notifications/activity from database
- Use `/api/notifications` endpoint
- Show empty state if no activity

**Priority**: 🟡 **HIGH**

---

### 10. **Default Email Address** 🟡 MEDIUM
**Location**: `apps/web/src/lib/email.ts`

**Issue**: Default "from" email when not configured:
```typescript
// Line 25
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@parkway.app';
```

**Problem**: 
- Default email may not be verified
- Emails may not send
- Domain may not exist

**Impact**: 
- Emails won't be delivered
- Silent failures

**Fix**: 
- Require `RESEND_FROM_EMAIL` in production
- Fail loudly if not set
- Validate email format

**Priority**: 🟡 **MEDIUM**

---

## 🟢 LOW PRIORITY - PLACEHOLDERS & UI TEXT

### 11. **Input Placeholders** 🟢 LOW
**Location**: Multiple files

**Examples**:
- `apps/web/src/app/page.tsx:123`: `placeholder="Search for parking near..."`
- `apps/web/src/components/layout/SearchBar.tsx:88`: `placeholder="Search for parking..."`
- `apps/web/src/app/search/page.tsx:303`: `placeholder="City or address"`
- `apps/web/src/app/search/page.tsx:314`: `placeholder="Min"`
- `apps/web/src/app/search/page.tsx:321`: `placeholder="Max"`
- `apps/web/src/app/search/page.tsx:364`: `placeholder="5"`
- `apps/web/src/app/profile/page.tsx:169`: `placeholder="Enter your phone number"`
- `apps/web/src/app/profile/page.tsx:180`: `placeholder="Enter your address"`
- `apps/web/src/app/driveway/[id]/page.tsx:452`: `placeholder="Make (e.g., Toyota)"`
- `apps/web/src/app/driveway/[id]/page.tsx:463`: `placeholder="Model (e.g., Camry)"`
- `apps/web/src/app/driveway/[id]/page.tsx:474`: `placeholder="Color"`
- `apps/web/src/app/driveway/[id]/page.tsx:485`: `placeholder="License Plate"`
- `apps/web/src/app/driveways/new/page.tsx:74`: `placeholder="Start typing an address..."`
- `apps/web/src/app/driveways/[id]/edit/page.tsx:106`: `placeholder="Start typing an address..."`

**Status**: ✅ **OK** - These are appropriate UI placeholders

**Note**: The rotating placeholders in `AddressAutocomplete.tsx` are fine for UX.

---

### 12. **Error Messages & TODOs** 🟢 LOW
**Location**: Multiple files

**Examples**:
- `apps/web/src/components/ErrorBoundary.tsx:31`: `// TODO: Integrate with error reporting service`
- `apps/web/src/lib/errors.ts:229`: `// TODO: Integrate with error logging service (Sentry, LogRocket, etc.)`
- `apps/web/src/components/ErrorBoundary.tsx:32`: `// Example: Sentry.captureException(error, { extra: errorInfo });`
- `apps/web/src/lib/errors.ts:230`: `// Example: Sentry.captureException(error, { extra: errorLog });`

**Status**: ⚠️ **SHOULD IMPLEMENT** - Error reporting is important for production

**Priority**: 🟡 **MEDIUM** - Should implement before production

---

### 13. **Test Data in Test Files** 🟢 LOW
**Location**: `apps/web/src/__tests__/`

**Examples**:
- `apps/web/src/__tests__/__mocks__/data.ts`: Mock user data, driveway data
- All test files use mock data

**Status**: ✅ **OK** - Test data is appropriate for tests

---

### 14. **Public Endpoints List** 🟢 LOW
**Location**: `apps/web/src/lib/api.ts`

**Issue**: Hardcoded list of public endpoints:
```typescript
// Line 51
const publicEndpoints = ['/stats/public', '/health', '/test'];
```

**Status**: ⚠️ **REVIEW** - Should be configurable or more comprehensive

**Priority**: 🟡 **LOW**

---

### 15. **404 Page Text** 🟢 LOW
**Location**: `apps/web/src/app/not-found.tsx`

**Issue**: Generic 404 message:
```typescript
// Line 15
<p className="text-lg text-gray-600 mb-8">
  Oops! The page you're looking for doesn't exist or has been moved.
</p>
```

**Status**: ✅ **OK** - Appropriate placeholder text

---

## 📊 SUMMARY BY PRIORITY

### 🔴 CRITICAL (Must Fix Before Production)
1. ✅ Fake Stripe Payment Intent Secrets
2. ✅ Stub Webhook Response
3. ✅ Test User Credentials in Seed Data
4. ✅ Sample Driveway Data in Seed
5. ✅ Sample Booking Data in Seed

### 🟡 HIGH (Should Fix Soon)
6. ✅ Hardcoded Statistics on About Page
7. ✅ Fallback Statistics on Home Page
8. ✅ Fake Testimonials on Home Page
9. ✅ Hardcoded Recent Activity on Dashboard
10. ✅ Default Email Address

### 🟡 MEDIUM (Should Implement)
11. ✅ Error Reporting Integration (TODOs)
12. ✅ Public Endpoints Configuration

### 🟢 LOW (OK or Minor)
13. ✅ Input Placeholders (OK)
14. ✅ Test Data in Test Files (OK)
15. ✅ 404 Page Text (OK)

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Critical Fixes (Before Production)
1. **Remove/Protect Seed Data**
   - Add environment check: `if (process.env.NODE_ENV === 'production') return;`
   - Use environment variables for test credentials
   - Add warning logs

2. **Fix Payment Stubs**
   - Remove fake payment intent generation
   - Fail loudly if Stripe not configured
   - Add startup validation

3. **Fix Webhook Stub**
   - Return error instead of stub
   - Add logging for missing webhook secret
   - Validate on startup

### Phase 2: High Priority (Before Launch)
4. **Replace Fake Statistics**
   - Fetch real stats from database
   - Show actual numbers or "Coming Soon"
   - Remove fallback placeholders

5. **Replace Fake Testimonials**
   - Fetch real reviews from database
   - Only show verified user reviews
   - Or remove section until real data exists

6. **Replace Fake Activity**
   - Fetch real notifications
   - Show empty state if none
   - Use actual user data

### Phase 3: Medium Priority (First Month)
7. **Implement Error Reporting**
   - Integrate Sentry or similar
   - Remove TODO comments
   - Add error tracking

8. **Configure Public Endpoints**
   - Make list configurable
   - Document all public endpoints
   - Add to environment config

---

## 📝 NOTES

### Seed Data
- **Current**: Runs in all environments
- **Should**: Only run in development
- **Fix**: Add environment check at start of seed script

### Payment Processing
- **Current**: Silent failures with stubs
- **Should**: Fail loudly if not configured
- **Fix**: Remove stubs, add validation

### Statistics & Testimonials
- **Current**: Hardcoded fake data
- **Should**: Fetch from database
- **Fix**: Use real API endpoints

### Email Service
- **Current**: Logs emails if not configured
- **Should**: Fail or warn in production
- **Fix**: Add validation and warnings

---

## ✅ VERIFICATION CHECKLIST

Before going to production, verify:

- [ ] Seed script has environment check
- [ ] No fake payment intents in production
- [ ] Webhook stub removed or protected
- [ ] All statistics are real or show "Coming Soon"
- [ ] All testimonials are real or section removed
- [ ] Dashboard activity is real
- [ ] Error reporting integrated
- [ ] Email service properly configured
- [ ] All TODOs addressed or documented
- [ ] No test credentials in production

---

**Next Steps**: Address all 🔴 CRITICAL items before production deployment.

