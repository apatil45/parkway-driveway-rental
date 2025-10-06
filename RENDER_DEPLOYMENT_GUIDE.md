# 🚀 Parkway.com Render Deployment Guide

This guide will walk you through deploying your Parkway.com driveway rental platform to Render step by step.

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Gather all required API keys and secrets

## 🔧 Step 1: Prepare Your Repository

### 1.1 Environment Variables
Create a `.env` file locally with these variables:
```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
JWT_SECRET=your-super-secret-jwt-key-here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OPENCAGE_API_KEY=your_opencage_api_key_here
NODE_ENV=production
PORT=10000
```

### 1.2 Required Services
- **Stripe Account**: For payment processing
- **Cloudinary Account**: For image uploads
- **OpenCage API**: For geocoding (get free key at [opencagedata.com](https://opencagedata.com))

## 🗄️ Step 2: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
2. **Click "New +" → "PostgreSQL"**
3. **Configure Database:**
   - **Name**: `parkway-db`
   - **Database**: `parkway_db`
   - **User**: `parkway_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (for testing) or Starter (for production)
4. **Click "Create Database"**
5. **Copy the Internal Database URL** (you'll need this)

## 🌐 Step 3: Deploy Web Service

### 3.1 Create Web Service
1. **Go to Render Dashboard**
2. **Click "New +" → "Web Service"**
3. **Connect Repository**: Select your GitHub repository
4. **Configure Service:**

#### Basic Settings:
- **Name**: `parkway-driveway-rental`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: Leave empty (root of repo)

#### Build & Deploy:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free (for testing) or Starter (for production)

### 3.2 Environment Variables
Add these environment variables in the Render dashboard:

#### Required Variables:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your_database_url_from_step_2>
JWT_SECRET=<generate_a_secure_random_string>
```

#### API Keys (get from your service providers):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENCAGE_API_KEY=your_opencage_key
```

### 3.3 Advanced Settings
- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes (deploys on git push)

## 🚀 Step 4: Deploy

1. **Click "Create Web Service"**
2. **Wait for Build**: This will take 5-10 minutes
3. **Check Logs**: Monitor the deployment logs for any errors
4. **Test Health Check**: Visit `https://your-app-name.onrender.com/health`

## ✅ Step 5: Verify Deployment

### 5.1 Health Check
Visit: `https://your-app-name.onrender.com/health`
Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "memory": {...},
  "environment": "production",
  "database": "connected"
}
```

### 5.2 Frontend Test
1. Visit: `https://your-app-name.onrender.com`
2. Should load the React application
3. Test registration and login
4. Test driveway creation and search

### 5.3 API Test
Test API endpoints:
- `GET /api/driveways` - Should return driveways
- `POST /api/auth/register` - Should create user
- `POST /api/auth/login` - Should authenticate user

## 🔧 Step 6: Configure Frontend API URLs

Update your frontend to use the production API URL:

1. **Find API calls in frontend code**
2. **Update base URL** from `http://localhost:3000` to `https://your-app-name.onrender.com`
3. **Commit and push** changes
4. **Render will auto-deploy** the updates

## 🐛 Troubleshooting

### Common Issues:

#### 1. Build Fails
- **Check**: Node.js version compatibility
- **Solution**: Ensure all dependencies are in package.json

#### 2. Database Connection Fails
- **Check**: DATABASE_URL format
- **Solution**: Verify database URL from Render dashboard

#### 3. Frontend Not Loading
- **Check**: Build command completed successfully
- **Solution**: Verify `public` directory exists after build

#### 4. API Routes Not Working
- **Check**: Environment variables are set
- **Solution**: Verify all required env vars are configured

### Debug Commands:
```bash
# Check build locally
npm run build

# Test production build
NODE_ENV=production npm start

# Check database connection
npm run migrate:prod
```

## 📊 Monitoring

### Render Dashboard:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, response times
- **Deployments**: Deployment history and status

### Health Monitoring:
- **Health Check**: `/health` endpoint
- **Database Status**: Included in health check
- **Memory Usage**: Monitored automatically

## 🔄 Updates and Maintenance

### Deploying Updates:
1. **Make changes** to your code
2. **Commit and push** to GitHub
3. **Render auto-deploys** (if auto-deploy is enabled)
4. **Monitor logs** for any issues

### Database Migrations:
- **Automatic**: Runs on each deployment via `postinstall` script
- **Manual**: Can be triggered via Render shell

## 💰 Cost Optimization

### Free Tier Limits:
- **Web Service**: 750 hours/month
- **Database**: 1GB storage, 1GB bandwidth
- **Sleep Mode**: Services sleep after 15 minutes of inactivity

### Upgrade When:
- **High Traffic**: More than 750 hours/month
- **Database Size**: More than 1GB data
- **Performance**: Need faster response times

## 🎉 Success!

Your Parkway.com driveway rental platform is now live on Render!

**Your app URL**: `https://your-app-name.onrender.com`

### Next Steps:
1. **Test all features** thoroughly
2. **Set up monitoring** and alerts
3. **Configure custom domain** (optional)
4. **Set up SSL certificate** (automatic on Render)
5. **Monitor performance** and scale as needed

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Support**: Available in dashboard
- **Community**: Render Discord and forums

---

**Happy Deploying! 🚗✨**
