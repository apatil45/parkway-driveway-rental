-- AlterTable: Make password optional for OAuth users, add googleId
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "users" ADD COLUMN "googleId" TEXT;

-- CreateIndex: Unique constraint for googleId (one Google account per user)
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
