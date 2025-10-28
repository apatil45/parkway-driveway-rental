# 🚀 Manual Startup Guide

## **Step 1: Start Backend Server**

Open **Command Prompt** or **PowerShell** and run:

```bash
cd D:\Projects\driveway-rental
set JWT_SECRET=supersecretjwtkey
set SUPABASE_URL=https://aqjjgmmvviozmedjgxdy.supabase.co
set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk
node index.js
```

**Expected Output:**
```
🚀 Backend: API-only mode - Frontend served by Vercel
✅ Stripe configured successfully
🌟 Parkway.com server running on port 3000
🌐 Environment: development
```

## **Step 2: Start Frontend Server**

Open **another** Command Prompt or PowerShell window and run:

```bash
cd D:\Projects\driveway-rental\frontend
npm run dev
```

**Expected Output:**
```
  VITE v7.1.9  ready in 1207 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## **Step 3: Access the Application**

1. **Open your browser**
2. **Go to:** http://localhost:5173
3. **Test the application:**
   - Register a new account
   - Search for driveways
   - Create a booking

## **✅ Verification**

- **Backend:** http://localhost:3000/health (should return status 200)
- **Frontend:** http://localhost:5173 (should show the application)

## **🔧 Troubleshooting**

If servers don't start:
1. Make sure Node.js is installed
2. Run `npm install` in both root and frontend directories
3. Check if ports 3000 and 5173 are available
4. Restart your computer if needed

## **🎉 Ready to Test!**

Once both servers are running, you can test all the features:
- User registration and login
- Driveway search with map
- Booking creation and management
- Role-based navigation
