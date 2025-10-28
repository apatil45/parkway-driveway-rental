@echo off
echo 🧪 Testing Parkway Driveway Rental Application...
echo.

echo 1️⃣ Testing Backend Health...
curl -s http://localhost:3000/health > nul
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not responding
    echo Please make sure the backend server is running
    pause
    exit /b 1
)

echo.
echo 2️⃣ Testing Frontend...
curl -s http://localhost:5173 > nul
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend is not responding
    echo Please make sure the frontend server is running
    pause
    exit /b 1
)

echo.
echo 3️⃣ Testing Search API...
curl -s "http://localhost:3000/api/driveways/search?latitude=40.7178&longitude=-74.0431&radius=1000" > nul
if %errorlevel% equ 0 (
    echo ✅ Search API is working
) else (
    echo ❌ Search API is not responding
)

echo.
echo 🎉 Application Test Complete!
echo.
echo 📍 You can now access the application at:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3000
echo.
echo 🚀 Ready for testing!
pause
