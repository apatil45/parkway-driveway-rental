-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "driveways" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "verificationSubmittedAt" TIMESTAMP(3),
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationRejectedAt" TIMESTAMP(3),
ADD COLUMN "verificationRejectionReason" TEXT,
ADD COLUMN "verificationDocumentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "verificationConfidence" DOUBLE PRECISION,
ADD COLUMN "verificationAutoResult" TEXT,
ADD COLUMN "verificationExtractedAddress" TEXT,
ADD COLUMN "verificationExtractedName" TEXT,
ADD COLUMN "verificationProvider" TEXT,
ADD COLUMN "verificationExternalId" TEXT;

-- CreateIndex
CREATE INDEX "driveways_verificationStatus_idx" ON "driveways"("verificationStatus");
