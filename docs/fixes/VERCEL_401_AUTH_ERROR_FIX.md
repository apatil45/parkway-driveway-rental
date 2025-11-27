# Vercel 401 Authentication Error Fix

## Problem

On Vercel production, users were experiencing 401 errors on authentication endpoints:
- `/api/auth/me` - 401 Unauthorized
- `/api/auth/refresh` - 401 Unauthorized

These errors occurred even when users were logged in, causing authentication failures.

## Root Causes

1. **Inconsistent Cookie Configuration**: Cookie settings were duplicated across multiple files with slight variations
2. **Poor Error Logging**: Auth routes didn't log detailed errors, making debugging difficult
3. **Missing Environment Variable Checks**: Routes didn't verify JWT secrets were configured before use
4. **Token Verification Errors**: Errors during token verification weren't properly logged or handled

## Solution

### 1. Created Cookie Utility Module (`apps/web/src/lib/cookie-utils.ts`)

Centralized cookie configuration with:
- Consistent `secure` and `sameSite` settings based on environment
- Helper functions: `setAuthCookies()`, `clearAuthCookies()`, `getCookieConfig()`
- Proper handling for Vercel production environment

### 2. Enhanced Error Logging

Added comprehensive error logging to all auth routes:
- Logs when tokens are missing
- Logs JWT secret configuration issues
- Logs token verification failures with error types
- Logs unexpected errors with stack traces

### 3. Improved Token Verification

Enhanced `/api/auth/refresh` and `/api/auth/me` routes:
- Check for JWT secrets before attempting verification
- Better error messages for different failure scenarios
- Proper handling of expired vs invalid tokens

### 4. Updated All Auth Routes

Refactored to use the new cookie utility:
- `/api/auth/login` - Uses `setAuthCookies()`
- `/api/auth/register` - Uses `setAuthCookies()`
- `/api/auth/refresh` - Enhanced error handling + cookie utility
- `/api/auth/logout` - Uses `clearAuthCookies()`
- `/api/auth/me` - Enhanced error logging

## Cookie Configuration

The cookie utility automatically configures cookies based on environment:

```typescript
// Production (Vercel)
- secure: true (HTTPS required)
- sameSite: 'lax' (works for same-origin requests)

// Development
- secure: false (HTTP allowed)
- sameSite: 'lax'
```

## Environment Variables Required

Ensure these are set in Vercel:

```env
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here (optional, falls back to JWT_SECRET)
```

## Testing

After deploying to Vercel:

1. **Check Vercel Logs**: Look for `[AUTH]` prefixed logs to see authentication flow
2. **Test Login**: Login should set cookies properly
3. **Test Refresh**: Token refresh should work automatically
4. **Check Browser DevTools**: Verify cookies are set with correct attributes

## Common Issues & Solutions

### Issue: Cookies not being sent
**Solution**: Ensure `withCredentials: true` is set in axios config (already done in `apps/web/src/lib/api.ts`)

### Issue: JWT_SECRET not configured
**Solution**: Add `JWT_SECRET` environment variable in Vercel dashboard

### Issue: Token expired immediately
**Solution**: Check token expiration settings (access: 15min, refresh: 30 days)

### Issue: Still getting 401 after fix
**Solution**: 
1. Clear browser cookies and try again
2. Check Vercel function logs for detailed error messages
3. Verify environment variables are set correctly

## Files Changed

- ✅ `apps/web/src/lib/cookie-utils.ts` (new)
- ✅ `apps/web/src/app/api/auth/login/route.ts`
- ✅ `apps/web/src/app/api/auth/register/route.ts`
- ✅ `apps/web/src/app/api/auth/refresh/route.ts`
- ✅ `apps/web/src/app/api/auth/me/route.ts`
- ✅ `apps/web/src/app/api/auth/logout/route.ts`

## Next Steps

1. Deploy to Vercel
2. Monitor Vercel function logs for `[AUTH]` messages
3. Test authentication flow end-to-end
4. If issues persist, check logs for specific error messages

