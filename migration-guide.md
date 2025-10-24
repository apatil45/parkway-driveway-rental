# 🚀 VERCEL MIGRATION GUIDE - PARKWAY.COM

## 📋 PRE-MIGRATION CHECKLIST

### 1. Set up Supabase Database
1. Go to [supabase.com](https://supabase.com)
2. Create a new account and project
3. Note down your project URL and anon key
4. Set up database tables (see SQL schema below)

### 2. Export Data from Render Database
```bash
# Connect to your Render database and export data
pg_dump $DATABASE_URL > render_backup.sql
```

### 3. Import Data to Supabase
```bash
# Import data to Supabase
psql $SUPABASE_DATABASE_URL < render_backup.sql
```

## 🗄️ DATABASE SCHEMA (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  roles TEXT[] DEFAULT ARRAY['driver'],
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driveways table
CREATE TABLE driveways (
  id VARCHAR(255) PRIMARY KEY,
  ownerId UUID REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  description TEXT,
  drivewaySize VARCHAR(50) DEFAULT 'Medium',
  carSizeCompatibility VARCHAR(50) DEFAULT 'All',
  pricePerHour DECIMAL(10,2) NOT NULL,
  availability VARCHAR(100) DEFAULT '24/7',
  amenities TEXT,
  images JSONB DEFAULT '[]',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  drivewayId VARCHAR(255) REFERENCES driveways(id) ON DELETE CASCADE,
  startTime TIMESTAMP WITH TIME ZONE NOT NULL,
  endTime TIMESTAMP WITH TIME ZONE NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  specialRequests TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driveways ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Driveways are publicly readable" ON driveways
  FOR SELECT USING (isActive = true);

CREATE POLICY "Users can create driveways" ON driveways
  FOR INSERT WITH CHECK (auth.uid() = ownerId);

CREATE POLICY "Users can update their own driveways" ON driveways
  FOR UPDATE USING (auth.uid() = ownerId);

CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = userId);
```

## 🔧 MIGRATION STEPS

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Install Dependencies
```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install Vercel CLI (if not already installed)
npm install -g vercel
```

### Step 3: Set up Environment Variables
Create `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Vercel Configuration
VERCEL_URL=your_vercel_app_url
```

### Step 4: Update Frontend Code
1. Replace Socket.IO with Supabase real-time
2. Update API endpoints to use `/api` routes
3. Update authentication to use Supabase Auth

### Step 5: Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 🔄 CODE CHANGES REQUIRED

### Frontend Changes
1. **Replace Socket.IO with Supabase Real-time**
```javascript
// Old Socket.IO code
import io from 'socket.io-client'
const socket = io()

// New Supabase real-time code
import { realtime } from './lib/supabase'
const subscription = realtime.subscribeToDriveways((payload) => {
  console.log('Driveway updated:', payload)
})
```

2. **Update API Calls**
```javascript
// Old API calls
const response = await fetch('http://localhost:3000/api/driveways')

// New API calls
const response = await fetch('/api/driveways')
```

3. **Update Authentication**
```javascript
// Old authentication
const token = localStorage.getItem('token')

// New Supabase authentication
import { auth } from './lib/supabase'
const { user } = await auth.getCurrentUser()
```

### Backend Changes
1. **Convert Express Routes to Vercel Functions**
   - Move routes from `routes/` to `api/`
   - Convert to serverless function format
   - Use Supabase client instead of Sequelize

2. **Update Database Operations**
```javascript
// Old Sequelize code
const user = await User.findByPk(id)

// New Supabase code
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', id)
  .single()
```

## 🧪 TESTING CHECKLIST

### Before Migration
- [ ] Export all data from Render database
- [ ] Test Supabase connection
- [ ] Verify all environment variables

### After Migration
- [ ] Test user registration
- [ ] Test user login
- [ ] Test driveway creation
- [ ] Test driveway listing
- [ ] Test booking creation
- [ ] Test real-time updates
- [ ] Test file uploads
- [ ] Test payment integration

## 🚨 ROLLBACK PLAN

If migration fails:
1. Keep Render database running during migration
2. Update DNS to point back to Render
3. Restore from backup if needed
4. Fix issues and retry migration

## 📊 PERFORMANCE OPTIMIZATION

### Vercel Optimizations
1. **Use Edge Functions** for global performance
2. **Implement ISR** for static content
3. **Optimize images** with Vercel Image Optimization
4. **Use Vercel Analytics** for monitoring

### Supabase Optimizations
1. **Enable connection pooling**
2. **Use database indexes**
3. **Implement caching** where appropriate
4. **Monitor query performance**

## 💰 COST COMPARISON

### Current (Render)
- Database: $7/month
- Hosting: Free tier limitations

### Vercel + Supabase
- Vercel: Free tier (100GB bandwidth)
- Supabase: Free tier (500MB database, 2GB bandwidth)
- **Total: $0/month** (within free tier limits)

## 🎯 SUCCESS METRICS

- [ ] All features working correctly
- [ ] Performance improved or maintained
- [ ] Zero downtime during migration
- [ ] Cost reduced to $0
- [ ] Better scalability and reliability
