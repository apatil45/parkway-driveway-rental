# Parkway.com - Render Deployment Guide

This guide will help you deploy the Parkway.com driveway rental platform to Render from scratch.

## 🚀 Quick Start

### 1. Prerequisites
- GitHub repository with the code
- Render account
- PostgreSQL database (Render provides this)
- Stripe account for payments
- Cloudinary account for image storage

### 2. Environment Variables Setup

#### Required Environment Variables:
```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database (Render will provide this)
DATABASE_URL=postgresql://username:password@hostname:port/database_name
DB_SSL=true

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL (your Render app URL)
FRONTEND_URL=https://your-app-name.onrender.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# OpenCage Geocoding API
OPENCAGE_API_KEY=your_opencage_api_key_here
```

## 📋 Deployment Steps

### Step 1: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

#### Basic Settings:
- **Name**: `parkway-driveway-rental`
- **Environment**: `Node`
- **Branch**: `main`
- **Root Directory**: `.` (leave empty)

#### Build & Deploy:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Advanced Settings:
- **Plan**: `Starter` (free tier)
- **Auto-Deploy**: `Yes`
- **Health Check Path**: `/api/health`

### Step 2: Create PostgreSQL Database

1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `parkway-database`
   - **Database**: `parkway_db`
   - **User**: `parkway_user`
   - **Plan**: `Starter` (free tier)
3. Copy the **External Database URL** for environment variables

### Step 3: Configure Environment Variables

In your Render Web Service settings, add these environment variables:

```bash
# Copy from your PostgreSQL service
DATABASE_URL=postgresql://parkway_user:password@hostname:port/parkway_db
DB_SSL=true

# Generate a strong JWT secret
JWT_SECRET=your-super-secret-jwt-key-here

# Your app URL (will be provided by Render)
FRONTEND_URL=https://your-app-name.onrender.com

# Add your API keys
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OPENCAGE_API_KEY=your_opencage_api_key_here
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the frontend
   - Start the server
   - Run database migrations

## 🔧 Configuration Files

### render.yaml
```yaml
services:
  - type: web
    name: parkway-driveway-rental
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    autoDeploy: true
    branch: main
```

### Dockerfile (Optional)
The project includes a Dockerfile for containerized deployment if needed.

## 🗄️ Database Setup

The application will automatically:
1. Connect to PostgreSQL
2. Run database migrations
3. Create tables and indexes
4. Set up relationships

### Manual Database Setup (if needed):
```bash
# Connect to your database and run:
npm run migrate:prod
npm run db:seed
```

## 🔍 Health Checks

The application includes health check endpoints:

- **Health Check**: `GET /api/health`
- **Performance**: `GET /api/performance`

## 📊 Monitoring

### Built-in Monitoring:
- Database connection status
- Memory usage
- CPU usage
- Query performance
- Error logging

### Render Dashboard:
- View logs in real-time
- Monitor resource usage
- Check deployment status

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version (22.x recommended)
   - Verify all dependencies are installed
   - Check for missing environment variables

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check DB_SSL setting
   - Ensure database is accessible

3. **Frontend Build Issues**:
   - Check frontend dependencies
   - Verify package-lock.json is up to date
   - Check for missing assets

4. **Runtime Errors**:
   - Check application logs in Render dashboard
   - Verify all environment variables are set
   - Check database migrations ran successfully

### Debug Commands:
```bash
# Check database connection
npm run db:test

# Run migrations manually
npm run migrate:prod

# Test Cloudinary connection
npm run test-cloudinary
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **JWT Secret**: Use a strong, random secret
3. **Database**: Use SSL connections in production
4. **CORS**: Configure for your domain only
5. **Rate Limiting**: Enabled by default

## 📈 Performance Optimization

### Built-in Optimizations:
- Database connection pooling
- Query optimization
- Static file serving
- Gzip compression
- Caching strategies

### Render Optimizations:
- Use appropriate plan for your traffic
- Enable auto-scaling if needed
- Monitor resource usage

## 🎯 Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Health check returns 200 OK
- ✅ Database migrations run successfully
- ✅ Frontend loads correctly
- ✅ API endpoints respond
- ✅ No runtime errors in logs

## 📞 Support

If you encounter issues:
1. Check the Render logs
2. Verify environment variables
3. Test database connectivity
4. Review the troubleshooting section

## 🎉 Deployment Complete!

Once deployed, your Parkway.com driveway rental platform will be available at:
`https://your-app-name.onrender.com`

Features available:
- ✅ User registration and authentication
- ✅ Driveway listing and search
- ✅ Booking system
- ✅ Payment processing
- ✅ Real-time notifications
- ✅ Mobile-responsive design
