# 🚀 Parkway.com Setup Instructions

## ❌ CRITICAL ISSUES IDENTIFIED

Your project has several critical issues that need to be fixed:

### 1. **Missing Environment Variables** 🔥
- No `.env` file exists
- Database connection will fail
- Authentication will not work
- Image uploads will fail
- Payments will not work

### 2. **Database Not Configured** 🔥
- PostgreSQL database not set up
- Models cannot sync
- All data operations will fail

### 3. **Missing API Keys** 🔥
- Cloudinary not configured (image uploads)
- Stripe not configured (payments)
- Geocoding not configured (location services)

## 🛠️ IMMEDIATE FIXES REQUIRED

### Step 1: Create Environment File
Create a `.env` file in the root directory with these variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/parkway_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
NODE_ENV=development
PORT=3000

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here

# Geocoding API (optional)
OPENCAGE_API_KEY=your_opencage_api_key_here
```

### Step 2: Set Up PostgreSQL Database
1. Install PostgreSQL on your system
2. Create a database named `parkway_db`
3. Update the `DATABASE_URL` in your `.env` file

### Step 3: Get API Keys
1. **Cloudinary**: Sign up at https://cloudinary.com/console
2. **Stripe**: Get test keys from https://dashboard.stripe.com/test/apikeys
3. **OpenCage**: Sign up at https://opencagedata.com/api (optional)

### Step 4: Run Setup Commands
```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

## 🔧 QUICK FIX SCRIPT

Run this PowerShell command to create a basic .env file:

```powershell
@"
# Parkway.com Environment Variables
DATABASE_URL=postgresql://postgres:password@localhost:5432/parkway_db
JWT_SECRET=dev-jwt-secret-key-change-in-production
NODE_ENV=development
PORT=3000
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
OPENCAGE_API_KEY=your_opencage_api_key_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

## ⚠️ CURRENT STATUS

- ❌ Server starts but database connection fails
- ❌ Authentication system not functional
- ❌ Image uploads will fail
- ❌ Payment processing will fail
- ❌ Location services will fail
- ❌ All user data operations will fail

## ✅ AFTER FIXES

Once you complete the setup:
- ✅ Database will connect properly
- ✅ User registration/login will work
- ✅ Driveway creation will work
- ✅ Image uploads will work
- ✅ Booking system will work
- ✅ Payment processing will work
- ✅ All features will be functional

## 🆘 NEED HELP?

If you need help with any of these steps, let me know and I can guide you through the specific setup process for your system.
