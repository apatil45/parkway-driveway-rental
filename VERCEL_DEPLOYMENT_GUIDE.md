# 🚀 Parkway.com - Vercel Deployment Guide

**Complete step-by-step guide for deploying Parkway.com to Vercel**

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **✅ Required Setup:**
- [ ] GitHub repository with your code
- [ ] Supabase account and project
- [ ] Vercel account
- [ ] Stripe account (for payments)
- [ ] Cloudinary account (for image uploads)

---

## 🗄️ **STEP 1: SET UP SUPABASE**

### **1.1 Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/Login with GitHub
4. Click "New Project"
5. Choose organization and enter project details:
   - **Name:** `parkway-driveway-rental`
   - **Database Password:** Generate strong password
   - **Region:** Choose closest to your users
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

### **1.2 Set up Database Schema:**
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the contents of `supabase-schema.sql`
5. Click "Run" to execute the schema
6. Verify tables are created in "Table Editor"

### **1.3 Get Supabase Credentials:**
1. Go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

---

## 🔧 **STEP 2: CONFIGURE ENVIRONMENT VARIABLES**

### **2.1 Create Frontend Environment File:**
Create `frontend/.env.local` with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### **2.2 Update API Routes:**
The API routes are already configured for Supabase. Verify these files exist:
- `api/auth/register.js`
- `api/auth/login.js`
- `api/auth/user.js`
- `api/health.js`
- `api/driveways/index.js`
- `api/bookings/index.js`

---

## 🚀 **STEP 3: DEPLOY TO VERCEL**

### **3.1 Connect to Vercel:**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### **3.2 Set Environment Variables in Vercel:**
In your Vercel project dashboard:
1. Go to "Settings" → "Environment Variables"
2. Add the following variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
OPENCAGE_API_KEY=your_opencage_key
```

### **3.3 Deploy:**
1. Click "Deploy" in Vercel
2. Wait for build to complete (5-10 minutes)
3. Your app will be available at `https://your-project.vercel.app`

---

## 🧪 **STEP 4: TEST DEPLOYMENT**

### **4.1 Health Check:**
Visit: `https://your-project.vercel.app/api/health`
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### **4.2 Test API Endpoints:**
```bash
# Test registration
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'

# Test login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Test driveways
curl https://your-project.vercel.app/api/driveways
```

### **4.3 Test Frontend:**
1. Visit your Vercel URL
2. Try user registration
3. Try user login
4. Test driveway listing
5. Test booking creation

---

## 🔧 **STEP 5: CONFIGURE ADDITIONAL SERVICES**

### **5.1 Stripe Configuration:**
1. Go to [stripe.com](https://stripe.com)
2. Get your API keys from Dashboard
3. Add to Vercel environment variables
4. Update webhook endpoints if needed

### **5.2 Cloudinary Configuration:**
1. Go to [cloudinary.com](https://cloudinary.com)
2. Get your cloud credentials
3. Add to Vercel environment variables

### **5.3 OpenCage Geocoding:**
1. Go to [opencagedata.com](https://opencagedata.com)
2. Get your API key
3. Add to Vercel environment variables

---

## 📊 **STEP 6: MONITORING AND MAINTENANCE**

### **6.1 Vercel Dashboard:**
- Monitor deployments
- Check function logs
- Monitor performance metrics
- Set up alerts for failures

### **6.2 Supabase Dashboard:**
- Monitor database performance
- Check authentication logs
- Monitor real-time connections
- Set up database backups

### **6.3 Application Monitoring:**
- Health check endpoint: `/api/health`
- Error tracking in Vercel logs
- Performance monitoring
- User analytics

---

## 🎯 **SUCCESS CRITERIA**

Your deployment is successful when:
- ✅ **Health check returns "healthy"**
- ✅ **Frontend loads without errors**
- ✅ **User registration works**
- ✅ **User login works**
- ✅ **Driveway listing works**
- ✅ **Booking creation works**
- ✅ **All API endpoints respond correctly**

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues:**

#### **Build Fails:**
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs for specific errors

#### **API Routes Not Working:**
- Verify environment variables are set
- Check Supabase connection
- Test individual endpoints

#### **Database Connection Issues:**
- Verify Supabase credentials
- Check database schema is created
- Test connection in Supabase dashboard

#### **Frontend Not Loading:**
- Check if build completed successfully
- Verify static files are served
- Check browser console for errors

---

## 🎉 **DEPLOYMENT COMPLETE!**

**Your Parkway.com driveway rental platform is now live on Vercel!**

### **Next Steps:**
1. **Test all functionality** thoroughly
2. **Set up monitoring** and alerts
3. **Configure custom domain** (optional)
4. **Set up SSL certificates** (automatic with Vercel)
5. **Plan for scaling** as your user base grows

### **Your Application URLs:**
- **Frontend:** `https://your-project.vercel.app`
- **API:** `https://your-project.vercel.app/api`
- **Health Check:** `https://your-project.vercel.app/api/health`

**🚀 Congratulations! Your Parkway.com application is now deployed and ready for users!** 🎉
