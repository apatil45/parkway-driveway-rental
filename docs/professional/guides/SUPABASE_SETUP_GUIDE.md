# 🗄️ Supabase Database Setup Guide

## 🎯 **Step-by-Step Instructions**

### **Step 1: Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Verify your email

### **Step 2: Create New Project**
1. Click "New Project"
2. Fill in details:
   - **Name**: `parkway-platform`
   - **Database Password**: Create strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing**: Select **FREE** tier
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### **Step 3: Get Database URL**
1. Go to **Settings > Database**
2. Scroll to "Connection string"
3. Copy the URI (looks like):
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### **Step 4: Create Environment File**
1. Copy `env.template` to `apps/web/.env.local`
2. Replace `[YOUR-PASSWORD]` with your actual password
3. Replace `[PROJECT-REF]` with your project reference

### **Step 5: Run Database Migrations**
```bash
# From the project root
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

### **Step 6: Verify Setup**
```bash
# Test database connection
npx prisma studio
```

## 🔧 **Database Schema Overview**

Your Parkway platform will have these tables:

### **Users Table**
- `id` - Unique identifier
- `email` - User email (unique)
- `name` - User full name
- `password` - Hashed password
- `roles` - Array of roles (DRIVER, OWNER, ADMIN)
- `phone` - Optional phone number
- `address` - Optional address
- `avatar` - Optional profile image
- `isActive` - Account status

### **Driveways Table**
- `id` - Unique identifier
- `title` - Driveway title
- `description` - Detailed description
- `address` - Physical address
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `pricePerHour` - Rental price
- `capacity` - Number of cars
- `carSize` - Supported car sizes
- `amenities` - Available amenities
- `images` - Array of image URLs
- `isActive` - Listing status
- `isAvailable` - Availability status
- `ownerId` - Foreign key to users

### **Bookings Table**
- `id` - Unique identifier
- `startTime` - Booking start time
- `endTime` - Booking end time
- `totalPrice` - Total cost
- `status` - Booking status (PENDING, CONFIRMED, etc.)
- `paymentStatus` - Payment status
- `specialRequests` - User requests
- `vehicleInfo` - Car details (JSON)
- `userId` - Foreign key to users
- `drivewayId` - Foreign key to driveways

### **Reviews Table**
- `id` - Unique identifier
- `rating` - 1-5 star rating
- `comment` - Review text
- `userId` - Foreign key to users
- `drivewayId` - Foreign key to driveways

### **Notifications Table**
- `id` - Unique identifier
- `title` - Notification title
- `message` - Notification content
- `type` - Notification type
- `isRead` - Read status
- `userId` - Foreign key to users

## 🎉 **What You Get with Supabase FREE Tier**

- ✅ **500MB PostgreSQL database**
- ✅ **50,000 monthly active users**
- ✅ **Real-time subscriptions**
- ✅ **Built-in authentication**
- ✅ **1GB file storage**
- ✅ **Auto-generated API**
- ✅ **Dashboard interface**

## 🚀 **Next Steps After Setup**

1. **Test the database** with Prisma Studio
2. **Set up Cloudinary** for file storage
3. **Configure Stripe** for payments
4. **Test API endpoints** locally
5. **Deploy to Vercel**

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Connection Error**: Check your DATABASE_URL format
2. **Migration Failed**: Ensure password is correct
3. **Permission Denied**: Check database permissions
4. **Timeout**: Verify network connection

### **Getting Help:**
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Prisma Documentation: [prisma.io/docs](https://prisma.io/docs)
- Community Discord: [discord.supabase.com](https://discord.supabase.com)

---

**Ready to set up your database? Follow the steps above and let me know when you have your DATABASE_URL!** 🚀
