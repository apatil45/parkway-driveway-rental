# Testing Plan - Placeholder and Dummy Data Fixes

## Features to Test

### 1. Seed Script Protection ✅
- [ ] Verify seed script blocks in production mode
- [ ] Verify seed script allows in development mode
- [ ] Verify ALLOW_SEED=true override works

### 2. Payment Intent Endpoint ✅
- [ ] Verify returns 503 when Stripe not configured
- [ ] Verify error message is clear
- [ ] Verify no fake client secrets are generated

### 3. Webhook Endpoint ✅
- [ ] Verify returns 503 when webhook secret missing
- [ ] Verify error message is clear
- [ ] Verify no stub responses

### 4. About Page Statistics ✅
- [ ] Verify fetches real statistics
- [ ] Verify shows loading state
- [ ] Verify shows real numbers (not placeholders)

### 5. Home Page Statistics ✅
- [ ] Verify shows real numbers (not "1K+", "500+")
- [ ] Verify shows "—" for rating if no reviews
- [ ] Verify no fallback placeholders

### 6. Home Page Testimonials ✅
- [ ] Verify fetches real reviews
- [ ] Verify shows real user names
- [ ] Verify shows loading state
- [ ] Verify shows "No reviews yet" if none exist

### 7. Dashboard Activity ✅
- [ ] Verify fetches real notifications
- [ ] Verify shows real activity items
- [ ] Verify shows loading state
- [ ] Verify shows "No recent activity" if none exist

