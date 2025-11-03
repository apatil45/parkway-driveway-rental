# Manual Testing Guide - Comprehensive Functionality Testing

This guide provides step-by-step instructions for manually testing all features of the Parkway Driveway Rental platform.

## Prerequisites

1. **Start the development server:**
   ```bash
   cd apps/web
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

2. **Test user credentials:**
   - Email: `driver@parkway.com`
   - Password: `password123`

---

## Test Suite 1: Authentication & Navigation

### 1.1 Homepage Loads Correctly
**Steps:**
1. Navigate to `http://localhost:3000`
2. Verify homepage loads without errors
3. Check that "Parkway" logo/branding is visible
4. Verify no console errors

**Expected:** Homepage displays correctly with branding

### 1.2 Navbar Functionality
**Steps:**
1. Check navbar is visible at top of page
2. Verify logo is clickable (links to home)
3. Check navigation links are visible:
   - Search
   - My Driveways (if logged in)
   - Bookings (if logged in)
4. Click each navigation link
5. Verify active page is highlighted

**Expected:** Navbar is functional and all links work

### 1.3 Global Search Bar
**Steps:**
1. Locate search bar in navbar (desktop view)
2. Click on search input
3. Type "downtown" and press Enter
4. Verify redirects to `/search?location=downtown`
5. Click search bar again
6. Verify dropdown shows "Recent Searches" section
7. Verify "Quick Actions" section appears

**Expected:** Search bar functions correctly with recent searches

### 1.4 User Registration
**Steps:**
1. Navigate to `/register`
2. Fill in registration form:
   - Email: `test-${Date.now()}@example.com`
   - Name: `Test User`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
3. Click "Sign Up"
4. Verify redirect to dashboard or login

**Expected:** User can register successfully

### 1.5 User Login
**Steps:**
1. Navigate to `/login`
2. Enter email: `driver@parkway.com`
3. Enter password: `password123`
4. Click "Sign In"
5. Verify redirect to dashboard

**Expected:** User can login successfully

---

## Test Suite 2: Dashboard & Navigation

### 2.1 Dashboard Loads with Stats
**Steps:**
1. Login as user
2. Navigate to `/dashboard`
3. Verify "Welcome back" message appears
4. Check that stats cards are displayed:
   - Total Bookings
   - Active Bookings
   - Total Earnings (if owner)
   - Average Rating

**Expected:** Dashboard displays with all stats

### 2.2 Dashboard Stats Are Clickable
**Steps:**
1. On dashboard, click "Total Bookings" card
2. Verify redirects to `/bookings`
3. Go back to dashboard
4. Click "Active Bookings" card
5. Verify redirects to `/bookings?status=CONFIRMED`
6. Go back to dashboard
7. If owner, click "Total Earnings" card
8. Verify redirects to `/bookings?status=COMPLETED`
9. Go back to dashboard
10. Click "Average Rating" card
11. Verify redirects to `/driveways`

**Expected:** All stats cards are clickable and navigate correctly

---

## Test Suite 3: Search & Map Features

### 3.1 Search Page Loads
**Steps:**
1. Navigate to `/search`
2. Verify search interface is visible
3. Check filters are displayed
4. Verify search results area is visible

**Expected:** Search page loads correctly

### 3.2 Map Displays on Search Page
**Steps:**
1. Navigate to `/search`
2. Wait 3-5 seconds for map to load
3. Verify map is displayed (Leaflet map container)
4. Check for markers on map (if driveways exist)
5. Verify map is interactive (can zoom/pan)

**Expected:** Map displays with markers

### 3.3 Map View Mode Toggle
**Steps:**
1. On search page, locate view mode buttons
2. Click "Map" button
3. Verify view switches to map-only
4. Click "List" button
5. Verify view switches to list-only
6. Click "Split" button
7. Verify view switches to split view

**Expected:** View mode toggle works correctly

### 3.4 Map Markers and Clustering
**Steps:**
1. On search page with map visible
2. Verify markers are displayed (P badges)
3. Zoom out to see clustering
4. Verify clusters show count numbers
5. Click on a marker
6. Verify popup appears with driveway info
7. Click "View Details" in popup
8. Verify redirects to driveway detail page

**Expected:** Map markers and clustering work correctly

---

## Test Suite 4: Driveway Management

### 4.1 Driveways List Page
**Steps:**
1. Navigate to `/driveways`
2. Verify driveways list is displayed (or empty state)
3. Check for "New" or "Create" button
4. Verify each driveway shows title, address, price

**Expected:** Driveways list page loads correctly

### 4.2 Create Driveway Page
**Steps:**
1. Navigate to `/driveways/new`
2. Verify form fields are present:
   - Title
   - Address
   - Price per hour
   - Capacity
   - Images (upload component)
   - Amenities
3. Fill in form:
   - Title: "Test Driveway"
   - Address: "123 Test St, Test City"
   - Price: "10"
   - Capacity: "2"
4. Click "Create"
5. Verify redirects to `/driveways`

**Expected:** Can create new driveway

### 4.3 Image Upload Component
**Steps:**
1. On create/edit driveway page
2. Locate "Images" section
3. Click "Upload Images" button
4. Select an image file
5. Verify image uploads (if Cloudinary configured)
6. Verify image preview appears
7. Try "Replace" button on uploaded image
8. Try "Remove" button

**Expected:** Image upload component works correctly

---

## Test Suite 5: Booking & Payment Flow

### 5.1 View Driveway Details
**Steps:**
1. Navigate to `/search`
2. Click on a driveway card
3. Verify redirects to `/driveway/[id]`
4. Check driveway details are displayed:
   - Title
   - Address
   - Price
   - Images
   - Amenities
   - Booking form

**Expected:** Driveway detail page loads correctly

### 5.2 Booking Form
**Steps:**
1. On driveway detail page
2. Locate booking form
3. Fill in:
   - Start time (datetime-local)
   - End time (datetime-local)
   - Vehicle info (optional)
4. Click "Book Now"
5. Verify redirects to `/checkout?bookingId=xxx`

**Expected:** Booking form works and redirects to checkout

### 5.3 Checkout Page
**Steps:**
1. After booking, verify checkout page loads
2. Check booking summary is displayed:
   - Driveway title
   - Address
   - Dates/times
   - Total price
3. Verify Stripe payment form is present
4. Check "Pay" button is visible

**Expected:** Checkout page displays booking and payment form

---

## Test Suite 6: Floating Action Buttons

### 6.1 FAB is Visible
**Steps:**
1. Navigate to homepage
2. Scroll to bottom-right
3. Verify floating action button is visible
4. Check it's not visible on `/login` or `/register`

**Expected:** FAB appears on appropriate pages

### 6.2 FAB Expands
**Steps:**
1. Click the FAB button
2. Verify it expands to show actions:
   - Quick Search
   - List Driveway (if authenticated)
   - Book Parking
3. Click each action
4. Verify appropriate navigation occurs

**Expected:** FAB expands and actions work

---

## Test Suite 7: UI Components & Visual

### 7.1 Consistent Layout
**Steps:**
1. Visit each major page:
   - `/`
   - `/search`
   - `/driveways`
   - `/bookings`
   - `/dashboard`
2. Verify navbar is consistent on all pages
3. Check footer is present (if configured)
4. Verify layout is consistent

**Expected:** All pages have consistent layout

### 7.2 Responsive Design
**Steps:**
1. Open browser DevTools
2. Set viewport to mobile (375x667)
3. Visit homepage
4. Verify mobile menu icon appears
5. Check FAB is visible
6. Test mobile menu opens/closes
7. Set viewport to tablet (768x1024)
8. Verify layout adapts
9. Set viewport to desktop (1280x720)
10. Verify full layout displays

**Expected:** Design is responsive across all breakpoints

---

## Test Suite 8: Navigation Flow

### 8.1 Complete User Journey
**Steps:**
1. Start at homepage
2. Click "Search" in navbar
3. Enter search query
4. Click on a driveway
5. Fill booking form
6. Complete booking
7. Verify redirects to checkout
8. Navigate back to dashboard
9. Check booking appears in bookings list

**Expected:** Complete flow works end-to-end

---

## Reporting Issues

When testing, note:
- ✅ Passed tests
- ❌ Failed tests with error description
- ⚠️ Partial functionality with notes
- 📸 Screenshots of issues (if any)

## Test Checklist Summary

- [ ] Authentication & Navigation (5 tests)
- [ ] Dashboard & Navigation (3 tests)
- [ ] Search & Map Features (4 tests)
- [ ] Driveway Management (3 tests)
- [ ] Booking & Payment Flow (3 tests)
- [ ] Floating Action Buttons (2 tests)
- [ ] UI Components & Visual (2 tests)
- [ ] Navigation Flow (1 test)

**Total:** 23 manual test cases

