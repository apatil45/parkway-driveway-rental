-- Idempotent sync: add VerificationStatus enum and columns if missing (e.g. DB was restored or migration marked applied but not run).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationStatus') THEN
    CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');
  END IF;
END
$$;

ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationSubmittedAt" TIMESTAMP(3);
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationRejectedAt" TIMESTAMP(3);
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationRejectionReason" TEXT;
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationDocumentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationConfidence" DOUBLE PRECISION;
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationAutoResult" TEXT;
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationExtractedAddress" TEXT;
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationExtractedName" TEXT;
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationProvider" TEXT;
ALTER TABLE "driveways" ADD COLUMN IF NOT EXISTS "verificationExternalId" TEXT;

CREATE INDEX IF NOT EXISTS "driveways_verificationStatus_idx" ON "driveways"("verificationStatus");
