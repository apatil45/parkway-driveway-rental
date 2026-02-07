# 🚀 Quick Start Guide for VS Code

## Prerequisites

Before starting, make sure you have:
- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm 8+** (comes with Node.js)
- **VS Code** installed

## Step-by-Step Setup

### 1. Open the Project in VS Code

```bash
# Open VS Code in the project directory
code d:\Projects\driveway-rental
```

Or:
- Open VS Code
- File → Open Folder
- Navigate to `d:\Projects\driveway-rental`
- Click "Select Folder"

### 2. Install Dependencies

Open the **Terminal** in VS Code (`Ctrl + ~` or `View → Terminal`) and run:

```bash
npm install
```

This will install all dependencies for the monorepo (frontend, packages, etc.)

### 3. Set Up Environment Variables

Create your environment file:

```bash
# Copy the template
copy env.local.template apps\web\.env.local
```

Or manually create `apps/web/.env.local` and add at minimum:

```env
# Required - Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.aqjjgmmvviozmedjgxdy.supabase.co:5432/postgres"

# Required - JWT Secrets (generate secure random strings)
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-secure-refresh-secret-min-32-chars"

# Optional but recommended
NEXT_PUBLIC_SUPABASE_URL="https://aqjjgmmvviozmedjgxdy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk"
```

**⚠️ Important:** Replace placeholder values with your actual credentials!

### 4. Generate Database Client

```bash
npm run db:generate
```

This generates the Prisma client needed for database operations.

### 5. Run Database Migrations (if needed)

If this is a fresh setup or you need to update the database schema:

```bash
npm run db:migrate
```

### 6. Start the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

## VS Code Tips

### Recommended Extensions

Install these VS Code extensions for better development experience:

1. **ESLint** - Code linting
2. **Prettier** - Code formatting
3. **Prisma** - Database schema syntax highlighting
4. **Tailwind CSS IntelliSense** - Tailwind autocomplete
5. **TypeScript and JavaScript Language Features** - Built-in, but ensure enabled

### Useful VS Code Shortcuts

- `Ctrl + ~` - Toggle terminal
- `Ctrl + Shift + P` - Command palette
- `F5` - Start debugging
- `Ctrl + B` - Toggle sidebar

### Running Commands

You can run npm scripts from VS Code:

1. **Terminal → Run Task** (`Ctrl + Shift + P` → "Run Task")
2. Or use the integrated terminal

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run type-check` - TypeScript type checking
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run test` - Run tests

## Troubleshooting

### Port Already in Use

If port 3000 is busy:
- Kill the process: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`
- Or change port in `apps/web/package.json` dev script

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules
npm install
```

### Environment Variables Not Loading

- Ensure file is at `apps/web/.env.local` (not root)
- Restart the dev server after changing `.env.local`
- Check for typos in variable names

### Database Connection Issues

- Verify `DATABASE_URL` format is correct
- Check database credentials
- Ensure database is accessible

## Next Steps

- Visit http://localhost:3000 to see your app
- Check `docs/professional/guides/` for detailed guides
- Run `npm run db:studio` to explore your database visually

## Project Structure

```
driveway-rental/
├── apps/
│   └── web/              # Next.js frontend (main app)
├── packages/
│   ├── database/         # Prisma schema & client
│   └── shared/           # Shared utilities & types
├── docs/                 # Documentation
└── tests/                # Test files
```

Happy coding! 🎉
