# 🔧 Vercel Environment Variables Configuration

## 📋 **REQUIRED ENVIRONMENT VARIABLES FOR VERCEL**

### **1. Supabase Configuration (REQUIRED)**
```
SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk
```

### **2. Payment Processing (OPTIONAL - Add when ready)**
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public_key_here
```

### **3. Image Upload (OPTIONAL - Add when ready)**
```
CLOUDINARY_CLOUD_NAME=deguirpcb
CLOUDINARY_API_KEY=969444696786874
CLOUDINARY_API_SECRET=wJPxIpBFLs4Um_ewlV6eY75LZ7k
```

### **4. Geocoding (OPTIONAL - Add when ready)**
```
OPENCAGE_API_KEY=6769cc75d3b74a2ba2c3948f83710337
```

### **5. Frontend Environment Variables (AUTOMATIC)**
These are automatically set by Vercel:
```
VITE_SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk
VITE_API_URL=/api
```

---

## 🚀 **HOW TO SET ENVIRONMENT VARIABLES IN VERCEL**

### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com](https://vercel.com)
2. Select your project
3. Go to **"Settings"** tab
4. Click **"Environment Variables"**

### **Step 2: Add Each Variable**
Click **"Add New"** and add each variable:

#### **Required Variables:**
- **Name:** `SUPABASE_URL`
- **Value:** `https://aqjjgmmvviozmedjgxdy.supabase.co`
- **Environment:** Production, Preview, Development

- **Name:** `SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk`
- **Environment:** Production, Preview, Development

#### **Optional Variables (Add when ready):**
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** `sk_test_your_stripe_secret_key_here`
- **Environment:** Production, Preview, Development

- **Name:** `CLOUDINARY_CLOUD_NAME`
- **Value:** `deguirpcb`
- **Environment:** Production, Preview, Development

- **Name:** `CLOUDINARY_API_KEY`
- **Value:** `969444696786874`
- **Environment:** Production, Preview, Development

- **Name:** `CLOUDINARY_API_SECRET`
- **Value:** `wJPxIpBFLs4Um_ewlV6eY75LZ7k`
- **Environment:** Production, Preview, Development

- **Name:** `OPENCAGE_API_KEY`
- **Value:** `6769cc75d3b74a2ba2c3948f83710337`
- **Environment:** Production, Preview, Development

### **Step 3: Redeploy**
After adding environment variables:
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Or trigger a new deployment by pushing to GitHub

---

## 🎯 **MINIMUM REQUIRED FOR DEPLOYMENT**

**For basic functionality, you only need:**
```
SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk
```

**This will enable:**
- ✅ User registration and login
- ✅ Driveway listing and creation
- ✅ Booking system
- ✅ Real-time updates
- ✅ Basic functionality

**Add other services (Stripe, Cloudinary, etc.) when you're ready to implement payments and image uploads.**
