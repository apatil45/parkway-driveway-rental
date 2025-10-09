# Render Environment Variables Setup Guide

This guide helps you configure the necessary environment variables for your Parkway application on Render.com.

## 1. Access Your Render Dashboard

- Log in to your Render account.
- Navigate to your Parkway web service.
- Go to the "Environment" section.

## 2. Add/Update Environment Variables

Ensure the following variables are set. Replace placeholder values with your actual credentials and URLs.

### Required Variables:

- **`DATABASE_URL`**: Your PostgreSQL connection string.
  - Example: `postgresql://username:password@host:port/database_name`
  - **Important**: This should be the "Internal Database URL" provided by Render for your PostgreSQL instance.

- **`JWT_SECRET`**: A strong, random string for JWT token signing.
  - Example: `your_super_secret_jwt_key_here_make_it_long_and_random`

- **`PORT`**: The port your application listens on. Render typically assigns `10000`.
  - Example: `10000`

- **`NODE_ENV`**: Set to `production` for your deployed service.
  - Example: `production`

### Optional (but highly recommended) Variables:

- **`JWT_EXPIRES_IN`**: Expiration time for JWT tokens.
  - Example: `7d` (7 days)

- **`STRIPE_SECRET_KEY`**: Your Stripe secret key (starts with `sk_live_` for production, `sk_test_` for testing).
  - Example: `sk_live_****************************************`

- **`STRIPE_PUBLIC_KEY`**: Your Stripe public key (starts with `pk_live_` for production, `pk_test_` for testing).
  - Example: `pk_live_****************************************`

- **`VITE_STRIPE_PUBLIC_KEY`**: This is used by the React frontend. It should be the same as `STRIPE_PUBLIC_KEY`.
  - Example: `pk_live_****************************************`

- **`STRIPE_WEBHOOK_SECRET`**: Your Stripe webhook secret for verifying webhook events.
  - Example: `whsec_****************************************`

- **`CLOUDINARY_CLOUD_NAME`**: Your Cloudinary cloud name.
  - Example: `your_cloud_name`

- **`CLOUDINARY_API_KEY`**: Your Cloudinary API key.
  - Example: `123456789012345`

- **`CLOUDINARY_API_SECRET`**: Your Cloudinary API secret.
  - Example: `****************************************`

- **`OPENCAGE_API_KEY`**: Your OpenCage Geocoding API key.
  - Example: `your_opencage_api_key`

- **`FRONTEND_URL`**: The public URL of your deployed Render frontend service.
  - Example: `https://parkway-app.onrender.com`

- **`VITE_API_URL`**: The public URL of your deployed Render backend service (often the same as `FRONTEND_URL` if it's a single service).
  - Example: `https://parkway-app.onrender.com`

---

**After adding/updating these variables, trigger a new deploy on Render.**
Monitor your deployment logs for any errors. The new error handling and `check-env` script should provide more clarity.