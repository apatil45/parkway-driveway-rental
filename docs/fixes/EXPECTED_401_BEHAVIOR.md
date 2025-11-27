# Expected 401 Behavior - Not an Error

## Overview

Seeing 401 errors in Vercel logs for `/api/auth/me` and `/api/auth/refresh` is **normal and expected** when users are not authenticated.

---

## Why This Happens

### Authentication Check Flow

1. **User visits any page** (homepage, search, etc.)
2. **Frontend automatically checks auth status** using `useAuth()` hook
3. **API call to `/api/auth/me`** is made
4. **If no cookie exists** → Returns 401 (expected)
5. **Frontend handles gracefully** → User sees public content

### When You'll See 401s

✅ **Normal scenarios:**
- User in incognito/private browsing mode
- User not logged in (first visit)
- User's session expired
- User cleared cookies

❌ **Not normal:**
- 401 after successful login (cookies not set)
- 401 when user is logged in (cookies not being sent)

---

## How It's Handled

### Frontend Behavior

The `useAuth()` hook gracefully handles 401s:

```typescript
// From apps/web/src/hooks/useAuth.ts
catch (error: any) {
  if (error.response?.status === 401) {
    // Try refresh once
    try {
      await api.post('/auth/refresh');
      // ... retry
    } catch {
      // Silently handle expected auth failures (no token)
      setAuthState({ 
        user: null, 
        loading: false, 
        error: '', 
        isAuthenticated: false 
      });
    }
  }
}
```

**Result**: User sees public content, no error messages shown.

### Logging Behavior

**Production (Vercel)**:
- 401s for unauthenticated users are **not logged as errors**
- Only actual errors (500s, token verification failures) are logged
- Reduces log noise significantly

**Development**:
- 401s are logged for debugging purposes
- Helps developers understand auth flow

---

## How to Verify It's Working

### ✅ Normal Behavior (Expected)

1. **Visit site in incognito mode**
   - See 401 in logs → ✅ Normal
   - Site loads correctly → ✅ Working
   - Can browse public pages → ✅ Working

2. **Log in successfully**
   - Cookies are set → ✅ Working
   - `/api/auth/me` returns 200 → ✅ Working
   - User sees authenticated content → ✅ Working

### ❌ Problem Behavior (Needs Fix)

1. **After login, still getting 401**
   - Check browser cookies (DevTools → Application → Cookies)
   - Verify cookies are set with correct attributes
   - Check Vercel environment variables

2. **Cookies not persisting**
   - Check cookie `secure` flag (should be `true` on HTTPS)
   - Check cookie `sameSite` attribute (should be `lax`)
   - Verify domain is correct

---

## Log Examples

### Expected Logs (Normal)

```
GET /api/auth/me → 401
[AUTH] Me: No access token cookie found (expected for unauthenticated users)
```

This is **not an error** - it's the app checking if user is logged in.

### Problem Logs (Needs Investigation)

```
POST /api/auth/login → 200
GET /api/auth/me → 401  ← Problem! Should work after login
```

This indicates cookies aren't being set or sent properly.

---

## Summary

- ✅ **401s for unauthenticated users = Normal**
- ✅ **Frontend handles gracefully**
- ✅ **No user-facing errors**
- ✅ **Logging reduced in production**
- ❌ **401s after login = Problem (needs investigation)**

---

**Bottom Line**: If you see 401s in logs for users who aren't logged in, that's expected behavior. The app is working correctly!

