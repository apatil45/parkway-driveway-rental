@echo off
echo 🚀 Starting Parkway Driveway Rental Application...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d D:\Projects\driveway-rental && set JWT_SECRET=supersecretjwtkey && set SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co && set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk && node index.js"

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d D:\Projects\driveway-rental\frontend && npm run dev"

echo.
echo ⏳ Waiting for servers to start...
timeout /t 10 /nobreak > nul

echo.
echo 🎉 Application Status:
echo ====================
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo ✅ Both servers should be running now!
echo 🌐 Open your browser and go to: http://localhost:5173
echo.
pause
