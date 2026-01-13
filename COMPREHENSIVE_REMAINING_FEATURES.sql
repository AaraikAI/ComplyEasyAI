-- ============================================
-- Database Schema Updates for Remaining Features
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add Framework Notes and Version Tracking (if not exists)
ALTER TABLE "ComplianceFramework" 
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "lastModifiedBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastModifiedAt" TIMESTAMP(3);

-- 2. Create Control Mapping Table for Cross-Framework Mappings
CREATE TABLE IF NOT EXISTS "ControlMapping" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sourceControlId" TEXT NOT NULL REFERENCES "FrameworkControl"("id") ON DELETE CASCADE,
  "targetControlId" TEXT NOT NULL REFERENCES "FrameworkControl"("id") ON DELETE CASCADE,
  "mappingType" TEXT NOT NULL DEFAULT 'equivalent', -- 'equivalent', 'related', 'superset', 'subset'
  "confidence" FLOAT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlMapping_source_target_unique" UNIQUE ("sourceControlId", "targetControlId")
);

CREATE INDEX IF NOT EXISTS "ControlMapping_sourceControlId_idx" ON "ControlMapping"("sourceControlId");
CREATE INDEX IF NOT EXISTS "ControlMapping_targetControlId_idx" ON "ControlMapping"("targetControlId");

-- 3. Create Evidence Versioning Table
CREATE TABLE IF NOT EXISTS "EvidenceVersion" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "controlId" TEXT NOT NULL REFERENCES "FrameworkControl"("id") ON DELETE CASCADE,
  "versionNumber" INTEGER NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "uploadedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fileSize" BIGINT,
  "mimeType" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "EvidenceVersion_controlId_idx" ON "EvidenceVersion"("controlId");
CREATE INDEX IF NOT EXISTS "EvidenceVersion_controlId_versionNumber_idx" ON "EvidenceVersion"("controlId", "versionNumber");

-- 4. Add confidence field to FrameworkControl for Smart Upload
ALTER TABLE "FrameworkControl" 
ADD COLUMN IF NOT EXISTS "aiConfidence" FLOAT;

-- Verify tables created
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('ControlMapping', 'EvidenceVersion')
ORDER BY table_name, ordinal_position;

