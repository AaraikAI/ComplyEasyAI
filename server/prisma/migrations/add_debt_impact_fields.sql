-- Add fields to ComplianceDebt and ChangeImpact tables
-- Run this SQL in Supabase SQL Editor

-- Add controlId and deadline to ComplianceDebt
ALTER TABLE "ComplianceDebt" 
ADD COLUMN IF NOT EXISTS "controlId" TEXT,
ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);

-- Add foreign key for controlId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ComplianceDebt_controlId_fkey'
    ) THEN
        ALTER TABLE "ComplianceDebt"
        ADD CONSTRAINT "ComplianceDebt_controlId_fkey" 
        FOREIGN KEY ("controlId") REFERENCES "FrameworkControl"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ComplianceDebt_controlId_idx" ON "ComplianceDebt"("controlId");
CREATE INDEX IF NOT EXISTS "ComplianceDebt_deadline_idx" ON "ComplianceDebt"("deadline");

-- Add fields to ChangeImpact
ALTER TABLE "ChangeImpact"
ADD COLUMN IF NOT EXISTS "downstreamDependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "severity" TEXT CHECK ("severity" IN ('critical', 'high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS "estimatedResolutionDays" INTEGER,
ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ChangeImpact_severity_idx" ON "ChangeImpact"("severity");
CREATE INDEX IF NOT EXISTS "ChangeImpact_resolvedAt_idx" ON "ChangeImpact"("resolvedAt");

