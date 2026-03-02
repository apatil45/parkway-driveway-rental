# Owner Address-Proof Verification – Runbook & Doc Checklist

## What the docs must have

### 1. **Feature design & behaviour**
- **Goal**: What verification is for (prove right to list; in-house + optional future third-party).
- **Actors**: Owner, Admin, Public – who does what.
- **Flow**: Submit docs → auto pipeline (verify/reject/manual) → admin queue for borderline → badge when verified.
- **Data model**: `VerificationStatus`, fields on `driveways`, `verificationProvider` / `verificationExternalId` for future third-party.
- **Accepted docs**: Deed, lease, utility bill, etc. (name + address).
- **Out of scope**: No doc authenticity check, no mandatory verification.

**Where**: `docs/DRIVEWAY_OWNER_ADDRESS_PROOF_DESIGN.md` (design + implementation status).

---

### 2. **Environment & database**
- **Two DBs in this repo**:
  - **Root `.env`**: `DATABASE_URL` → often **local** PostgreSQL (`localhost:5432/driveway_rental`).
  - **`apps/web/.env.local`**: `DATABASE_URL` → **Supabase** (or whatever the running app uses).
- **App at runtime** uses the env loaded by Next.js (e.g. `apps/web/.env.local`). Prisma in the app uses that same `DATABASE_URL`.
- **Migrations / sync** must be applied to **the DB the app uses**. If the app points at Supabase, run sync (or migrate) against that URL, not only local.

**Where**: This runbook + `docs/professional/guides/ENVIRONMENT_SETUP.md` or `LOCAL_ENVIRONMENT_SETUP.md`.

---

### 3. **Applying schema changes (verification columns)**
- **Prisma migration**: `packages/database/migrations/20260223140000_add_driveway_verification/`.
- **Idempotent sync script** (adds columns if missing):  
  `packages/database/migrations/.../sync_verification_columns.sql`
- **Apply to the app’s DB** (e.g. Supabase):
  ```bash
  # From repo root – uses DATABASE_URL from apps/web/.env.local
  node scripts/sync-verification-on-app-db.js
  ```
- **Apply to local DB** (when using root `.env`):
  ```bash
  cd packages/database
  npx prisma db execute --file migrations/20260223140000_add_driveway_verification/sync_verification_columns.sql
  ```
- If you add more migrations later, run `npx prisma migrate deploy` (or equivalent) against the **same** `DATABASE_URL` the app uses.

---

### 4. **APIs & routes**
- **Owner**: `POST /api/upload/verification-document`, `POST /api/driveways/[id]/verify`, `GET /api/driveways/[id]/verify`.
- **Admin**: `GET /api/admin/verifications`, `PATCH /api/admin/verifications/[drivewayId]` (approve/reject).
- **Public**: `GET /api/driveways` and `GET /api/driveways/[id]` include `verificationStatus`; no doc URLs or rejection reason exposed.

**Where**: Design doc (flow) + code (route handlers). Optional: separate API.md or OpenAPI snippet.

---

### 5. **Admin & roles**
- **ADMIN** role: Required for `/api/admin/verifications` and `/admin/verifications` UI.
- How to grant ADMIN (e.g. direct DB update or seed); no self-service.

**Where**: Design doc or `docs/professional/guides/ENVIRONMENT_SETUP.md`.

---

### 6. **Storage**
- Verification documents: **Cloudinary** folder `driveway-rental/verifications` (PDF + images).
- Env: `CLOUDINARY_*` in `apps/web/.env.local` (or app env).

**Where**: Design doc (implementation status) + env guide.

---

### 7. **Troubleshooting**
- **500 on driveways list/detail/verify**: Usually “column `driveways.verificationStatus` does not exist” → app DB missing verification columns. Run `node scripts/sync-verification-on-app-db.js` (or sync SQL against the app’s `DATABASE_URL`).
- **Different DBs**: Confirm which `DATABASE_URL` the app loads (e.g. `apps/web/.env.local`) and run migrations/sync against that URL.

**Where**: This runbook.

---

### 8. **Future third-party verification**
- Schema is ready: `verificationProvider` (`'in_house' | 'third_party'`), `verificationExternalId`.
- When integrating a vendor: set those fields and keep using the same `verificationStatus` and badge behaviour.

**Where**: `docs/DRIVEWAY_OWNER_ADDRESS_PROOF_DESIGN.md` (implementation status + comparison table).

---

## Quick checklist for “doc must have”

| Topic | Must have | Where |
|--------|-----------|--------|
| What verification is & who does what | ✓ | Design doc |
| Flow (submit → auto/manual → badge) | ✓ | Design doc |
| Data model & future third-party fields | ✓ | Design doc |
| Which DB the app uses vs local | ✓ | Runbook + env guides |
| How to apply verification schema to app DB | ✓ | Runbook + sync script |
| API list (owner, admin, public) | ✓ | Design doc + runbook |
| Admin role & access | ✓ | Runbook / env guide |
| Storage (Cloudinary, env) | ✓ | Design doc |
| Troubleshooting (500, missing column) | ✓ | Runbook |
| Out of scope / limitations | ✓ | Design doc |
