# 🏠 Local Environment Setup Guide

## ✅ **Current Status**

Your local environment file is configured at:
```
apps/web/.env.local
```

**✅ File exists and is properly gitignored** (will not be committed to repository)

---

## 📋 **Environment Variables in Your Setup**

Based on your configuration, you have:

### **✅ Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret

### **✅ Payment Processing (Stripe):**
- `STRIPE_SECRET_KEY` - Server-side Stripe key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe key

### **✅ Image Storage (Cloudinary):**
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### **✅ Geocoding (OpenCage):**
- `OPENCAGE_API_KEY` - For address to coordinates conversion

### **✅ Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

---

## 🔍 **Validate Your Environment**

Run the validation script to check all variables:

```bash
npm run validate-env
```

This will:
- ✅ Check that all required variables are set
- ⚠️  Warn about missing optional variables
- 🔒 Mask sensitive values in output
- 📊 Provide summary of configuration

---

## 🚀 **Quick Start for Local Development**

1. **Ensure environment file exists:**
   ```bash
   # File should be at: apps/web/.env.local
   ls apps/web/.env.local
   ```

2. **Validate environment:**
   ```bash
   npm run validate-env
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access your app:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - Health check: http://localhost:3000/api/health

---

## 🔒 **Security Notes**

### **✅ What's Protected:**
- `.env.local` is in `.gitignore` - **Never committed**
- Sensitive keys are server-side only (no `NEXT_PUBLIC_` prefix)
- Public keys use `NEXT_PUBLIC_` prefix (safe for client-side)

### **⚠️ Important:**
- Never commit `.env.local` to git
- Never share your `.env.local` file
- Use different keys for production
- Rotate secrets if exposed

---

## 🔧 **Environment Variable Usage**

### **Server-Side (API Routes):**
```typescript
// These are only available in API routes, not in components
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

### **Client-Side (React Components):**
```typescript
// Only variables with NEXT_PUBLIC_ prefix are available
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### **⚠️ Important:**
- Server-side variables (`DATABASE_URL`, `JWT_SECRET`, etc.) are **NOT** available in client components
- Only `NEXT_PUBLIC_*` variables are exposed to the browser
- This is a Next.js security feature

---

## 📝 **Adding New Environment Variables**

### **For Server-Side Use:**
1. Add to `apps/web/.env.local`:
   ```env
   MY_NEW_SECRET_KEY="your-secret-value"
   ```

2. Access in API route:
   ```typescript
   const value = process.env.MY_NEW_SECRET_KEY;
   ```

### **For Client-Side Use:**
1. Add to `apps/web/.env.local` with `NEXT_PUBLIC_` prefix:
   ```env
   NEXT_PUBLIC_MY_PUBLIC_KEY="your-public-value"
   ```

2. Access in component:
   ```typescript
   const value = process.env.NEXT_PUBLIC_MY_PUBLIC_KEY;
   ```

3. **⚠️ Remember:** This value is exposed in the browser!

---

## 🧪 **Testing Environment Variables**

### **Via API Endpoint:**
```bash
# Check which variables are set (doesn't show values)
curl http://localhost:3000/api/auth/debug
```

### **Via Validation Script:**
```bash
npm run validate-env
```

---

## 🐛 **Troubleshooting**

### **Issue: Variables not loading**
- ✅ Restart Next.js dev server after changing `.env.local`
- ✅ Ensure file is in `apps/web/.env.local` (not root)
- ✅ Check for typos in variable names
- ✅ No quotes needed unless value contains spaces

### **Issue: "Cannot read property of undefined"**
- ✅ Check variable name spelling
- ✅ Ensure server-side vars aren't used in client components
- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables

### **Issue: Database connection fails**
- ✅ Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- ✅ Check database credentials
- ✅ Ensure database is accessible from your IP

---

## 📚 **Resources**

- **Template:** `env.local.template` - Reference for all variables
- **Validation:** `apps/web/scripts/validate-env.js` - Environment checker
- **Documentation:** `CODEBASE_COMPREHENSIVE_ANALYSIS.md` - Full analysis

---

**✅ Your environment is configured and ready for local development!**

