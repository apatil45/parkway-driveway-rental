@echo off
echo.
echo ========================================
echo   🚗 Parkway.com PRODUCTION Server
echo ========================================
echo.

echo 🔧 Setting up environment variables...
set JWT_SECRET=supersecretjwtkey
set PORT=3000
set NODE_ENV=development
set OPENCAGE_API_KEY=6769cc75d3b74a2ba2c3948f83710337
set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
set CLOUDINARY_CLOUD_NAME=deguirpcb
set CLOUDINARY_API_KEY=969444696786874
set CLOUDINARY_API_SECRET=wJPxIpBFLs4Um_ewlV6eY75LZ7k
set DATABASE_URL=postgresql://parkway_user:5JEJVL2GX12E9mAQRPPoqI62QM2NNVFR@dpg-d3a95kndiees73d311vg-a.virginia-postgres.render.com/parkway_db
set FRONTEND_URL=http://localhost:5173

echo ✅ Environment variables set
echo.

echo 🚀 Starting PRODUCTION server with real database...
echo.
echo Features:
echo   🗄️  PostgreSQL Database with Sequelize ORM
echo   🔐 JWT Authentication with bcrypt password hashing
echo   🏠 Driveway CRUD operations
echo   📅 Booking system with conflict detection
echo   ⚡ Socket.io real-time features
echo   🛡️  Security headers and CORS protection
echo   📊 Comprehensive logging and monitoring
echo.

node production-server.js

echo.
echo Server stopped.
pause
