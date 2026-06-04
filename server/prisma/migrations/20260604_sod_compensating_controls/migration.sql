-- Add structured compensating-controls storage to SoDViolation.
-- Additive, nullable JSONB column; existing rows are unaffected.
ALTER TABLE "SoDViolation" ADD COLUMN IF NOT EXISTS "compensatingControls" JSONB;
