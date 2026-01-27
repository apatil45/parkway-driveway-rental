# Environment Setup Guide

## Database Setup ✅
- Supabase database is configured and seeded
- Connection string: `postgresql://postgres:Parkway%40rental05@db.aqjjgmmvviozmedjgxdy.supabase.co:5432/postgres`

## Environment Variables Needed

Create these files in your project:

### 1. `apps/web/.env.local`
```bash
# Database
DATABASE_URL="postgresql://postgres:Parkway%40rental05@db.aqjjgmmvviozmedjgxdy.supabase.co:5432/postgres"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# Cloudinary (to be configured)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Stripe (to be configured)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

### 2. `apps/api/.env`
```bash
# Database
DATABASE_URL="postgresql://postgres:Parkway%40rental05@db.aqjjgmmvviozmedjgxdy.supabase.co:5432/postgres"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Cloudinary (to be configured)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Stripe (to be configured)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

## Next Steps

1. **Create the environment files** using the templates above
2. **Set up Cloudinary** for image storage
3. **Set up Stripe** for payments
4. **Test the application locally**
5. **Deploy to Vercel**

## Test Data Available

The database has been seeded with:
- **Owner**: owner@parkway.com / password123
- **Driver**: driver@parkway.com / password123
- **Sample driveway**: "Downtown Premium Spot"
- **Sample booking** and **review**

You can use these credentials to test the application!
