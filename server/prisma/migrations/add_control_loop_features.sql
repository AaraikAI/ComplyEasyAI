-- Add advanced Control Loop features
-- Run this SQL in Supabase SQL Editor

-- Add trigger type, configuration, and history tracking fields
ALTER TABLE "ControlLoop" 
ADD COLUMN IF NOT EXISTS "triggerType" TEXT DEFAULT 'manual' CHECK ("triggerType" IN ('schedule', 'threshold', 'event', 'manual')),
ADD COLUMN IF NOT EXISTS "triggerConfig" JSONB,
ADD COLUMN IF NOT EXISTS "timeoutSeconds" INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS "parentLoopId" TEXT,
ADD COLUMN IF NOT EXISTS "configuration" JSONB,
ADD COLUMN IF NOT EXISTS "lastError" TEXT;

-- Add execution history table
CREATE TABLE IF NOT EXISTS "ControlLoopHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
    "loopId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "executionPhase" TEXT NOT NULL CHECK ("executionPhase" IN ('sense', 'analyze', 'plan', 'act', 'verify', 'learn')),
    "phaseResult" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlLoopHistory_loopId_fkey" FOREIGN KEY ("loopId") REFERENCES "ControlLoop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ControlLoopHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ControlLoopHistory_loopId_idx" ON "ControlLoopHistory"("loopId");
CREATE INDEX IF NOT EXISTS "ControlLoopHistory_organizationId_idx" ON "ControlLoopHistory"("organizationId");
CREATE INDEX IF NOT EXISTS "ControlLoopHistory_timestamp_idx" ON "ControlLoopHistory"("timestamp");

-- Add foreign key for parent loop (self-referential)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ControlLoop_parentLoopId_fkey'
    ) THEN
        ALTER TABLE "ControlLoop"
        ADD CONSTRAINT "ControlLoop_parentLoopId_fkey" 
        FOREIGN KEY ("parentLoopId") REFERENCES "ControlLoop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ControlLoop_parentLoopId_idx" ON "ControlLoop"("parentLoopId");
CREATE INDEX IF NOT EXISTS "ControlLoop_triggerType_idx" ON "ControlLoop"("triggerType");

