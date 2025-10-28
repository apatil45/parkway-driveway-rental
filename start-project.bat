@echo off
echo 🚀 Starting Parkway Driveway Rental Application...
echo.

echo 📦 Setting up environment variables...
set JWT_SECRET=supersecretjwtkey
set SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co
set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk
set NODE_ENV=development

echo ✅ Environment variables set
echo.

echo 🔧 Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0 && node index.js"

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 🌐 Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo 🎉 Application is starting up!
echo.
echo 📍 Backend: http://localhost:3000
echo 📍 Frontend: http://localhost:5173
echo.
echo ⚠️  Please wait for both servers to fully start before testing
echo.
pause
