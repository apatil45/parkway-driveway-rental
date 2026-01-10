# Environment Variables Configuration Guide

**Date**: 2024-12-27  
**Status**: Complete documentation of all environment variables

---

## Environment File Location

**Local Development**: `apps/web/.env.local`  
**Production**: Set via Vercel dashboard or deployment platform

⚠️ **IMPORTANT**: Never commit `.env.local` to git - it contains secrets!

---

## Required Environment Variables

These variables **MUST** be set for the application to function:

### 1. Database Configuration
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```
- **Purpose**: PostgreSQL database connection string
- **Source**: Supabase project settings
- **Format**: Must start with `postgresql://`
- **Example**: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

### 2. Authentication Secrets
```bash
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-characters-long"
```
- **Purpose**: JWT token signing and refresh token secrets
- **Security**: Must be at least 32 characters long
- **Generation**: Use secure random strings
- **Note**: `JWT_REFRESH_SECRET` is optional - falls back to `JWT_SECRET` if not set

---

## Optional Environment Variables

### Payment Processing (Stripe)

Required for payment functionality:

```bash
STRIPE_SECRET_KEY="sk_test_..." # or sk_live_... for production
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # or pk_live_... for production
```

- **Purpose**: Stripe payment processing
- **Source**: https://dashboard.stripe.com/apikeys
- **Webhook Secret**: Get from Stripe webhook settings
- **Status**: Application works without these, but payments will be disabled

---

### Email Service (Resend)

Required for sending email notifications:

```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

- **Purpose**: Send booking confirmations, payment receipts, etc.
- **Source**: https://resend.com (free tier: 3,000 emails/month)
- **Status**: If not set, emails are logged to console instead of sent
- **Default**: `RESEND_FROM_EMAIL` defaults to `noreply@parkway.app` if not set

---

### Image Storage (Cloudinary)

Required for image uploads:

```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

- **Purpose**: Store and serve driveway images
- **Source**: https://console.cloudinary.com (free tier: 25GB storage)
- **Status**: If not set, image uploads will fail

---

### Geocoding (OpenCage)

Optional for enhanced address geocoding:

```bash
OPENCAGE_API_KEY="your_opencage_api_key"
```

- **Purpose**: Convert addresses to coordinates
- **Source**: https://opencagedata.com/api
- **Status**: Application uses Nominatim (OpenStreetMap) as fallback if not set
- **Note**: Nominatim is free but has rate limits

---

### Supabase (Optional)

For Supabase-specific features:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
```

- **Purpose**: Supabase client-side features
- **Source**: Supabase project settings
- **Status**: Optional - only needed if using Supabase client features

---

### Rate Limiting (Upstash Redis)

Optional for production rate limiting:

```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

- **Purpose**: Redis-based rate limiting
- **Source**: https://upstash.com
- **Status**: Currently commented out in code - uses in-memory rate limiting by default
- **Note**: Only needed for production scale

---

### Cron Jobs Security

Optional for securing cron endpoints:

```bash
CRON_SECRET="your-secure-random-string"
```

- **Purpose**: Authenticate cron job requests (Vercel Cron, etc.)
- **Security**: Should be a secure random string
- **Status**: Optional - cron jobs work without it but less secure
- **Usage**: Set in Vercel dashboard for cron job authorization header

---

### Application URLs

```bash
NEXT_PUBLIC_API_URL="/api"  # Defaults to /api if not set
FRONTEND_URL="http://localhost:3000"  # For callbacks and redirects
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"  # For real-time features (not implemented yet)
```

- **Purpose**: Configure API and frontend URLs
- **Status**: All optional with sensible defaults

---

### Node Environment

```bash
NODE_ENV="development"  # or "production" or "test"
```

- **Purpose**: Set application environment
- **Default**: Automatically set by Next.js
- **Note**: Usually set automatically by deployment platform

---

## Environment Variable Validation

### Run Validation Script

```bash
npm run validate-env
```

This script:
- ✅ Checks that all required variables are set
- ⚠️ Warns about missing optional variables
- 🔒 Masks sensitive values in output
- 📊 Provides summary of configuration

### Validation Checks

The script validates:
- ✅ `DATABASE_URL` exists and starts with `postgresql://`
- ✅ `JWT_SECRET` exists and is at least 32 characters
- ⚠️ Optional variables are documented but not required

---

## Environment Variables by Feature

### Core Application (Required)
- `DATABASE_URL` - Database connection
- `JWT_SECRET` - Authentication
- `JWT_REFRESH_SECRET` - Refresh tokens (optional)

### Payment Processing
- `STRIPE_SECRET_KEY` - Server-side Stripe key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe key

### Email Notifications
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Sender email address

### Image Storage
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Geocoding
- `OPENCAGE_API_KEY` - OpenCage API key (optional)

### Rate Limiting
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL (optional)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token (optional)

### Cron Jobs
- `CRON_SECRET` - Cron job authentication (optional)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (optional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (optional)

---

## Setup Instructions

### 1. Copy Template File

```bash
cp env.local.template apps/web/.env.local
```

### 2. Fill in Required Values

Edit `apps/web/.env.local` and replace placeholder values:
- `DATABASE_URL` - Get from Supabase
- `JWT_SECRET` - Generate secure random string (32+ chars)
- `JWT_REFRESH_SECRET` - Generate secure random string (32+ chars)

### 3. Add Optional Services (As Needed)

**For Payments:**
- Get Stripe keys from https://dashboard.stripe.com/apikeys
- Set up webhook at https://dashboard.stripe.com/webhooks

**For Emails:**
- Sign up at https://resend.com
- Get API key and verify domain

**For Images:**
- Sign up at https://cloudinary.com
- Get cloud name, API key, and secret

### 4. Validate Configuration

```bash
npm run validate-env
```

---

## Production Deployment

### Vercel Deployment

1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables
4. Set environment for each variable (Production, Preview, Development)

### Required for Production:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY` (if using payments)
- `STRIPE_WEBHOOK_SECRET` (if using payments)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if using payments)
- `RESEND_API_KEY` (if using emails)
- `RESEND_FROM_EMAIL` (if using emails)

### Recommended for Production:
- `CRON_SECRET` - For securing cron endpoints
- `UPSTASH_REDIS_REST_URL` - For production rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - For production rate limiting

---

## Security Best Practices

### ✅ Do:
- ✅ Use strong, random secrets (32+ characters)
- ✅ Use different secrets for development and production
- ✅ Rotate secrets periodically
- ✅ Use environment-specific values
- ✅ Never commit `.env.local` to git
- ✅ Use secure storage for production secrets

### ❌ Don't:
- ❌ Use weak or predictable secrets
- ❌ Share secrets between environments
- ❌ Commit secrets to version control
- ❌ Hardcode secrets in code
- ❌ Expose secrets in client-side code (except `NEXT_PUBLIC_*`)

---

## Troubleshooting

### "DATABASE_URL not found"
- Check that `.env.local` exists in `apps/web/`
- Verify the file is named correctly
- Restart development server after adding variables

### "JWT_SECRET is not set"
- Ensure `JWT_SECRET` is at least 32 characters
- Check for typos in variable name
- Restart server after adding

### "Stripe not configured"
- Payment features require all three Stripe variables
- Check that keys are from the same Stripe account
- Verify webhook secret matches your webhook endpoint

### "Email not sending"
- Check `RESEND_API_KEY` is set
- Verify `RESEND_FROM_EMAIL` is a verified domain
- Check Resend dashboard for API usage limits

---

## Summary

### Minimum Required (Core Functionality):
1. `DATABASE_URL`
2. `JWT_SECRET`

### Recommended (Full Features):
3. `JWT_REFRESH_SECRET`
4. `STRIPE_SECRET_KEY`
5. `STRIPE_WEBHOOK_SECRET`
6. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
7. `RESEND_API_KEY`
8. `RESEND_FROM_EMAIL`

### Optional (Enhanced Features):
9. `CLOUDINARY_*` (for image uploads)
10. `OPENCAGE_API_KEY` (for enhanced geocoding)
11. `CRON_SECRET` (for cron job security)
12. `UPSTASH_REDIS_*` (for production rate limiting)

---

## Quick Reference

| Variable | Required | Purpose | Source |
|----------|----------|---------|--------|
| `DATABASE_URL` | ✅ Yes | Database connection | Supabase |
| `JWT_SECRET` | ✅ Yes | Authentication | Generate |
| `JWT_REFRESH_SECRET` | ⚠️ Optional | Refresh tokens | Generate |
| `STRIPE_SECRET_KEY` | ⚠️ Optional | Payments | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Optional | Webhooks | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ Optional | Payments | Stripe Dashboard |
| `RESEND_API_KEY` | ⚠️ Optional | Emails | Resend |
| `RESEND_FROM_EMAIL` | ⚠️ Optional | Emails | Resend |
| `CLOUDINARY_*` | ⚠️ Optional | Images | Cloudinary |
| `OPENCAGE_API_KEY` | ⚠️ Optional | Geocoding | OpenCage |
| `CRON_SECRET` | ⚠️ Optional | Cron security | Generate |
| `UPSTASH_REDIS_*` | ⚠️ Optional | Rate limiting | Upstash |

---

**Last Updated**: 2024-12-27
