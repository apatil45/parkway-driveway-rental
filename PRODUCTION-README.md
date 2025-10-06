# 🚗 Parkway.com - Production Backend

A complete, production-ready driveway rental platform with real database, authentication, and comprehensive APIs.

## 🎯 **What You Now Have**

### ✅ **Real Database & APIs**
- **PostgreSQL Database**: Connected to your Render database
- **Sequelize ORM**: Professional database management
- **JWT Authentication**: Secure token-based auth with bcrypt
- **Comprehensive APIs**: Full CRUD operations for all entities
- **Real-time Features**: Socket.io for live updates
- **Security**: Helmet, CORS, input validation
- **Production Ready**: Error handling, logging, monitoring

## 🚀 **Quick Start**

### **Option 1: Use the Batch File (Recommended)**
```bash
# Double-click this file:
start-production.bat
```

### **Option 2: Manual Start**
```bash
# Set environment variables (Windows)
set JWT_SECRET=supersecretjwtkey
set DATABASE_URL=postgresql://parkway_user:5JEJVL2GX12E9mAQRPPoqI62QM2NNVFR@dpg-d3a95kndiees73d311vg-a.virginia-postgres.render.com/parkway_db
set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
set CLOUDINARY_CLOUD_NAME=deguirpcb
set CLOUDINARY_API_KEY=969444696786874
set CLOUDINARY_API_SECRET=wJPxIpBFLs4Um_ewlV6eY75LZ7k
set OPENCAGE_API_KEY=6769cc75d3b74a2ba2c3948f83710337
set FRONTEND_URL=http://localhost:5173

# Start the server
node production-server.js
```

## 📋 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### **Driveways**
- `GET /api/driveways` - List all driveways (with search, filters)
- `GET /api/driveways/:id` - Get single driveway
- `POST /api/driveways` - Create driveway (owner only)
- `PUT /api/driveways/:id` - Update driveway (owner only)
- `DELETE /api/driveways/:id` - Delete driveway (owner only)
- `GET /api/driveways/my/driveways` - Get user's driveways

### **Bookings**
- `GET /api/bookings/my` - Get user's bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/owner` - Get owner's bookings

### **System**
- `GET /api/health` - Comprehensive health check

## 🗄️ **Database Schema**

### **Users Table**
- `id`, `email`, `password` (hashed), `firstName`, `lastName`, `phone`
- `role` (driver/owner/admin), `isActive`, `profileImage`
- `lastLogin`, `emailVerified`, `phoneVerified`

### **Driveways Table**
- `id`, `title`, `description`, `address`, `latitude`, `longitude`
- `price`, `capacity`, `amenities` (JSON), `images` (JSON)
- `isActive`, `isAvailable`, `carSize`, `accessInstructions`
- `restrictions`, `ownerId`

### **Bookings Table**
- `id`, `startTime`, `endTime`, `totalPrice`, `status`
- `specialInstructions`, `paymentStatus`, `paymentIntentId`
- `stripeSessionId`, `cancellationReason`, `cancelledAt`
- `completedAt`, `userId`, `drivewayId`

## 🔐 **Authentication Flow**

1. **Registration**: User provides email, password, personal info
2. **Password Hashing**: bcrypt with 12 salt rounds
3. **JWT Token**: 7-day expiration with user data
4. **Protected Routes**: Bearer token in Authorization header
5. **Role-based Access**: Driver, Owner, Admin permissions

## 🏠 **Driveway Features**

### **Search & Filtering**
- Text search (title, description, address)
- Price range filtering
- Car size filtering
- Location-based search
- Pagination support

### **Owner Management**
- Create/edit/delete driveways
- Upload multiple images
- Set availability and restrictions
- View booking requests

## 📅 **Booking System**

### **Booking Process**
1. User selects driveway and time slot
2. System checks for conflicts
3. Calculates total price
4. Creates pending booking
5. Owner can confirm/cancel
6. Real-time notifications

### **Status Management**
- `pending` - Awaiting owner confirmation
- `confirmed` - Owner approved
- `cancelled` - Cancelled by user/owner
- `completed` - Booking finished
- `expired` - Time passed without confirmation

## ⚡ **Real-time Features**

### **Socket.io Events**
- `join-room` - Join user-specific room
- `booking-created` - Notify owner of new booking
- `booking-updated` - Notify users of status changes
- `new-booking` - Real-time booking notifications

## 🛡️ **Security Features**

### **Authentication Security**
- JWT tokens with expiration
- Password hashing with bcrypt
- Role-based authorization
- Account activation status

### **API Security**
- Helmet security headers
- CORS configuration
- Input validation
- SQL injection protection
- Rate limiting ready

### **Data Protection**
- Password never returned in responses
- Sensitive data filtering
- Secure database connections
- Environment variable protection

## 📊 **Monitoring & Health**

### **Health Check Response**
```json
{
  "status": "OK",
  "message": "Parkway.com production server is running!",
  "timestamp": "2024-01-03T...",
  "uptime": 3600,
  "memory": { "rss": 50000000, "heapTotal": 20000000 },
  "environment": "development",
  "database": "connected",
  "version": "1.0.0"
}
```

### **Logging**
- Morgan HTTP request logging
- Error logging with stack traces
- Database connection monitoring
- Real-time event logging

## 🚀 **Production Deployment**

### **Environment Variables**
```env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
OPENCAGE_API_KEY=your-geocoding-key
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=3000
```

### **Database Setup**
1. PostgreSQL database (Render/Heroku/AWS)
2. Environment variables configured
3. Database tables auto-created
4. Indexes for performance optimization

## 🧪 **Testing Your APIs**

### **Test Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","firstName":"Test","lastName":"User","phone":"1234567890","role":"driver"}'
```

### **Test Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### **Test Health Check**
```bash
curl http://localhost:3000/api/health
```

## 🎯 **What You Get**

✅ **Real PostgreSQL Database** with your Render connection  
✅ **JWT Authentication** with secure password hashing  
✅ **Complete CRUD APIs** for all entities  
✅ **Real-time Features** with Socket.io  
✅ **Production Security** with Helmet and CORS  
✅ **Comprehensive Logging** and monitoring  
✅ **Error Handling** and graceful degradation  
✅ **Scalable Architecture** ready for production  

## 🎉 **Your Production Backend is Ready!**

Your Parkway.com driveway rental platform now has:
- **Real database** with PostgreSQL
- **Secure authentication** with JWT
- **Complete APIs** for all features
- **Real-time capabilities** with Socket.io
- **Production-ready** security and monitoring

**Start your production server and begin building your "Airbnb for parking" platform! 🚗✨**
