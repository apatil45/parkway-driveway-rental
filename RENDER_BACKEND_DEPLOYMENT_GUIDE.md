# 🚀 **RENDER BACKEND DEPLOYMENT GUIDE**

## **Quick Setup (5 minutes)**

### **Step 1: Deploy via Render Dashboard**

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub**: `apatil45/parkway-driveway-rental`
4. **Configure Service**:
   - **Name**: `parkway-backend`
   - **Environment**: `Node`
   - **Plan**: `Starter` (Free tier)
   - **Build Command**: `npm run build`
   - **Start Command**: `node index.js`
   - **Health Check Path**: `/health`

### **Step 2: Environment Variables**

Add these environment variables in Render dashboard:

```bash
# Core Configuration
NODE_ENV=production
PORT=10000

# Supabase Database
SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk

# JWT Security
JWT_SECRET=supersecretjwtkey
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=supersecretjwtrefreshkey

# Database Connection Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Stripe (Replace with your keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Cloudinary (Your existing keys)
CLOUDINARY_CLOUD_NAME=deguirpcb
CLOUDINARY_API_KEY=969444696786874
CLOUDINARY_API_SECRET=wJPxIpBFLs4Um_ewlV6eY75LZ7k

# Geocoding
OPENCAGE_API_KEY=6769cc75d3b74a2ba2c3948f83710337

# Frontend URL (Your Vercel domain)
FRONTEND_URL=https://parkwayai.vercel.app

# Performance & Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=300
```

### **Step 3: Deploy**

1. **Click "Create Web Service"**
2. **Wait for deployment** (2-3 minutes)
3. **Copy your Render URL** (e.g., `https://parkway-backend-xxx.onrender.com`)

## **Alternative: Deploy via render.yaml**

Your `render.yaml` is already configured! You can:

1. **Push to GitHub** (already done)
2. **Go to Render Dashboard**
3. **Click "New +"** → **"Blueprint"**
4. **Connect GitHub** and select your repo
5. **Render will auto-detect `render.yaml`**

## **Post-Deployment Steps**

### **1. Update Vercel Environment Variables**

Go to your Vercel dashboard and update:

```bash
VITE_API_URL=https://your-render-backend-url.onrender.com/api
```

### **2. Test Your Live Application**

1. **Backend Health Check**: `https://your-render-url.onrender.com/health`
2. **Frontend**: `https://parkwayai.vercel.app`
3. **Test Login/Registration**

## **Expected Render URL Format**

Your backend will be available at:
```
https://parkway-backend-xxx.onrender.com
```

## **Troubleshooting**

### **Common Issues:**

1. **Build Fails**: Check Node.js version (should be 18+)
2. **Environment Variables**: Ensure all required vars are set
3. **Health Check**: Verify `/health` endpoint works
4. **CORS Issues**: Backend already configured for Vercel

### **Render Free Tier Limits:**

- **750 hours/month** (enough for 24/7)
- **Sleeps after 15 minutes** of inactivity
- **Cold start**: ~30 seconds after sleep

## **Production Optimizations**

### **For Production Scale:**

1. **Upgrade to Starter Plan** ($7/month)
   - No sleep mode
   - Better performance
   - Custom domains

2. **Add Redis Cache** (Optional)
   - Improves performance
   - Reduces database calls

3. **Custom Domain** (Optional)
   - `api.parkway.com`
   - Professional branding

## **Success Indicators**

✅ **Backend deployed successfully**
✅ **Health check returns 200**
✅ **Frontend connects to backend**
✅ **Login/registration works**
✅ **All API endpoints functional**

---

**Your Parkway backend will be live at: `https://parkway-backend-xxx.onrender.com`**

**Next: Update Vercel with your Render backend URL!**
