# 📦 Monorepo Structure Explanation

**Why Multiple `node_modules` and `package.json` Files?**

---

## 🏗️ **What is a Monorepo?**

Your project uses a **monorepo** (monolithic repository) architecture. This means multiple related packages/applications live in one git repository, sharing dependencies and code.

---

## 📁 **Your Project Structure**

```
driveway-rental/
├── package.json                    # ROOT: Workspace configuration
├── node_modules/                   # ROOT: Shared dependencies
│
├── apps/
│   └── web/
│       ├── package.json            # WEB APP: Next.js app dependencies
│       └── node_modules/          # WEB APP: App-specific dependencies
│
└── packages/
    ├── database/
    │   ├── package.json            # DATABASE: Prisma dependencies
    │   └── node_modules/           # DATABASE: Package-specific deps
    │
    └── shared/
        ├── package.json            # SHARED: Utility dependencies
        └── node_modules/           # SHARED: Package-specific deps
```

---

## ❓ **Why Multiple `node_modules`?**

### **1. Workspace Isolation**
Each package/app has its own `node_modules` to:
- **Isolate dependencies** - Prevents version conflicts
- **Enable independent builds** - Each package can build separately
- **Support different Node versions** - If needed in future

### **2. npm Workspaces Feature**
Your root `package.json` has:
```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

This tells npm to:
1. **Hoist common dependencies** to root `node_modules` (shared packages)
2. **Keep package-specific deps** in local `node_modules`
3. **Link workspace packages** using `file:` protocol (e.g., `@parkway/database`)

### **3. Actual Behavior**

When you run `npm install` at the root:

```
Root node_modules/
├── react/              # Shared by web app
├── typescript/         # Shared by all
├── prisma/             # Shared by database & web
└── ...

apps/web/node_modules/
└── (mostly symlinks to root, sometimes local copies)

packages/database/node_modules/
└── @prisma/client/     # Generated Prisma client
```

---

## 📄 **Why Multiple `package.json` Files?**

Each `package.json` serves a different purpose:

### **1. Root `package.json`** (Monorepo Manager)
```json
{
  "name": "parkway-platform",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "cd apps/web && npm run dev",
    "build": "npm run build:packages && cd apps/web && npm run build"
  }
}
```
**Purpose:** 
- Define workspace structure
- Root-level scripts (dev, build, test)
- Shared dev dependencies (TypeScript, Turbo, Playwright)

### **2. `apps/web/package.json`** (Next.js Application)
```json
{
  "name": "@parkway/web",
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "@parkway/database": "file:../../packages/database",
    "@parkway/shared": "file:../../packages/shared"
  }
}
```
**Purpose:**
- Define Next.js app dependencies
- Reference workspace packages (`@parkway/database`, `@parkway/shared`)
- App-specific scripts (`dev`, `build`, `lint`)

### **3. `packages/database/package.json`** (Prisma Package)
```json
{
  "name": "@parkway/database",
  "main": "dist/index.js",
  "dependencies": {
    "@prisma/client": "^5.6.0"
  }
}
```
**Purpose:**
- Define database package dependencies
- Export Prisma client singleton
- Package-specific build scripts

### **4. `packages/shared/package.json`** (Shared Utilities)
```json
{
  "name": "@parkway/shared",
  "main": "dist/index.js",
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
```
**Purpose:**
- Define shared utilities (types, helpers)
- No runtime dependencies (just TypeScript for building)

---

## ✅ **Benefits of This Structure**

### **1. Code Reusability**
```typescript
// apps/web can import from packages
import { prisma } from '@parkway/database';
import { createApiError } from '@parkway/shared';
```

### **2. Independent Versioning**
- Each package can have its own version
- Upgrade dependencies per package
- Isolate breaking changes

### **3. Faster Builds**
- Build only changed packages
- Share build cache (via Turbo)
- Parallel builds

### **4. Better Organization**
- Clear separation: `apps/` (applications) vs `packages/` (libraries)
- Shared code doesn't duplicate
- Easier to add new apps/packages

---

## 🔧 **How It Works**

### **Installation Flow:**

1. **Run `npm install` at root**
   ```
   npm install
   ```

2. **npm detects workspaces:**
   - Scans `apps/*` and `packages/*`
   - Reads all `package.json` files
   - Resolves dependencies

3. **Dependency Resolution:**
   - Common deps → Root `node_modules`
   - Package-specific → Local `node_modules`
   - Workspace packages → Linked via `file:../../packages/...`

4. **Result:**
   - All packages can import each other
   - Dependencies shared when possible
   - No duplication (npm handles this)

---

## 📊 **Dependency Sharing Example**

```
Root node_modules/
├── react@18.2.0          # Shared by web app
├── typescript@5.2.2      # Shared by all
└── prisma@5.22.0         # Shared by database & web

apps/web/node_modules/
└── next@14.0.0           # Only web app needs this

packages/database/node_modules/
└── @prisma/client@5.6.0  # Generated, package-specific
```

---

## 🎯 **Is This Normal?**

**YES!** This is standard practice for:
- ✅ Next.js monorepos
- ✅ Turborepo projects
- ✅ npm/yarn workspaces
- ✅ Lerna projects
- ✅ Nx monorepos

**Examples:**
- Vercel's `turborepo` repo
- Next.js itself (monorepo with packages)
- Most large React projects

---

## 🚫 **What NOT to Do**

### **❌ Don't manually copy dependencies:**
```bash
# BAD: Don't do this
cp -r node_modules apps/web/node_modules
```

### **❌ Don't commit `node_modules`:**
```gitignore
# GOOD: Already in .gitignore
node_modules/
```

### **✅ DO use workspace commands:**
```bash
# GOOD: Install from root
npm install

# GOOD: Run workspace scripts
npm run dev          # Runs apps/web dev
npm run build        # Builds all packages
```

---

## 📝 **Summary**

| Item | Why Multiple? | Purpose |
|------|--------------|---------|
| `node_modules/` | Workspace isolation + dependency hoisting | Each package has its own deps, shared at root |
| `package.json` | Different dependencies per package | Each package defines what it needs |
| Workspace structure | Code reusability | Share `@parkway/database` and `@parkway/shared` |

---

## 🎓 **Key Takeaway**

**This is not duplication—it's organization!**

- Multiple `package.json` = Different dependency sets
- Multiple `node_modules` = Isolated, optimized dependency resolution
- Workspace linking = Share code without publishing to npm

**Your monorepo structure is correct and follows industry best practices! ✅**

---

**Last Updated:** November 3, 2025

