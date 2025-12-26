-- Add name and deadline fields to ComplianceGoal table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE "ComplianceGoal" 
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);

-- Add index on name for faster searches
CREATE INDEX IF NOT EXISTS "ComplianceGoal_name_idx" ON "ComplianceGoal"("name");

