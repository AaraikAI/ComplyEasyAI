-- ============================================================================
-- Create DemoRequest Table for Supabase
-- ============================================================================
-- This SQL script creates the DemoRequest table and DemoRequestStatus enum
-- Run this in your Supabase SQL editor

-- Step 1: Create the DemoRequestStatus enum
CREATE TYPE "DemoRequestStatus" AS ENUM (
  'pending',
  'contacted',
  'scheduled',
  'completed',
  'qualified',
  'proposal_sent',
  'negotiation',
  'converted',
  'disqualified',
  'no_response'
);

-- Step 2: Create the DemoRequest table
-- Note: Supabase uses gen_random_uuid() which is available in PostgreSQL 13+
-- If you get an error, you may need to enable the uuid-ossp extension:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Then use: DEFAULT uuid_generate_v4()::text
CREATE TABLE "DemoRequest" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "jobTitle" TEXT,
  "phone" TEXT,
  "companySize" TEXT,
  "industry" TEXT,
  "country" TEXT,
  "interestedTier" TEXT,
  "currentChallenge" TEXT,
  "howDidYouHear" TEXT,
  "message" TEXT,
  "status" "DemoRequestStatus" NOT NULL DEFAULT 'pending',
  "scheduledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "assignedTo" TEXT,
  "welcomeEmailSentAt" TIMESTAMP(3),
  "followUpEmailSentAt" TIMESTAMP(3),
  "notes" TEXT,
  "source" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "convertedToUserId" TEXT,
  "convertedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create indexes for better query performance
CREATE INDEX "DemoRequest_email_idx" ON "DemoRequest"("email");
CREATE INDEX "DemoRequest_status_idx" ON "DemoRequest"("status");
CREATE INDEX "DemoRequest_company_idx" ON "DemoRequest"("company");
CREATE INDEX "DemoRequest_interestedTier_idx" ON "DemoRequest"("interestedTier");
CREATE INDEX "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");
CREATE INDEX "DemoRequest_scheduledAt_idx" ON "DemoRequest"("scheduledAt");

-- Step 4: Create a function to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a trigger to automatically update updatedAt
CREATE TRIGGER update_demo_request_updated_at
  BEFORE UPDATE ON "DemoRequest"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verification queries (optional - run these to verify the table was created)
-- ============================================================================
-- SELECT * FROM "DemoRequest" LIMIT 1;
-- SELECT COUNT(*) FROM "DemoRequest";

