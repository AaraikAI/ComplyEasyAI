-- ============================================================================
-- NIST Cybersecurity Framework (CSF) v2.0 Guided Workflow Module
-- ----------------------------------------------------------------------------
-- Adds 4 tables:
--   NistCsfProfile                — Current and Target Profiles per
--                                    NIST CSF 2.0 §3 (Profile = alignment of
--                                    Subcategories with org mission/risk).
--   NistCsfSubcategoryAssessment  — Per-Subcategory Implementation Tier
--                                    scoring (Tier 1 Partial → Tier 4 Adaptive)
--                                    + informative references (ISO 27001,
--                                    NIST SP 800-53 Rev 5, CIS).
--   NistCsfGapAnalysis            — Persisted Current-vs-Target delta per
--                                    Function (Govern, Identify, Protect,
--                                    Detect, Respond, Recover).
--   NistCsfActionItem             — Concrete remediation tasks tied to a
--                                    Subcategory gap.
--
-- All tables are organization-scoped with ON DELETE CASCADE.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "NistCsfProfile" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "profileType" TEXT NOT NULL,                 -- Current, Target
  "profileYear" INTEGER NOT NULL,
  "businessContext" JSONB,                     -- mission, sector, geographies, scope
  "missionObjectives" TEXT,
  "riskTolerance" TEXT NOT NULL DEFAULT 'Moderate', -- Low, Moderate, High
  "regulatoryDrivers" JSONB,                   -- ['HIPAA','PCI-DSS','SOX']
  "targetCompletionDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Draft',      -- Draft, Active, Archived
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NistCsfProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NistCsfProfile_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "NistCsfProfile_organizationId_idx" ON "NistCsfProfile"("organizationId");
CREATE INDEX IF NOT EXISTS "NistCsfProfile_profileType_idx" ON "NistCsfProfile"("profileType");
CREATE INDEX IF NOT EXISTS "NistCsfProfile_status_idx" ON "NistCsfProfile"("status");
CREATE INDEX IF NOT EXISTS "NistCsfProfile_profileYear_idx" ON "NistCsfProfile"("profileYear");

CREATE TABLE IF NOT EXISTS "NistCsfSubcategoryAssessment" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "function" TEXT NOT NULL,                    -- Govern, Identify, Protect, Detect, Respond, Recover
  "category" TEXT NOT NULL,                    -- e.g. GV.OC, ID.AM
  "subcategoryRef" TEXT NOT NULL,              -- e.g. GV.OC-01
  "subcategoryTitle" TEXT NOT NULL,
  "currentTier" INTEGER,                       -- 1..4 nullable until assessed
  "targetTier" INTEGER,                        -- 1..4
  "priority" TEXT NOT NULL DEFAULT 'Moderate', -- Low, Moderate, High, Critical
  "implementationStatus" TEXT NOT NULL DEFAULT 'NotImplemented', -- NotImplemented, PartiallyImplemented, Implemented, Optimized
  "informativeReferences" JSONB,               -- { iso27001: [...], nist80053: [...], cis: [...] }
  "evidenceRefs" JSONB,
  "notes" TEXT,
  "lastAssessedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NistCsfSubcategoryAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NistCsfSubcategoryAssessment_profileId_subcategoryRef_key" UNIQUE ("profileId", "subcategoryRef"),
  CONSTRAINT "NistCsfSubcategoryAssessment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "NistCsfSubcategoryAssessment_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "NistCsfProfile"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "NistCsfSubcategoryAssessment_organizationId_idx" ON "NistCsfSubcategoryAssessment"("organizationId");
CREATE INDEX IF NOT EXISTS "NistCsfSubcategoryAssessment_profileId_idx" ON "NistCsfSubcategoryAssessment"("profileId");
CREATE INDEX IF NOT EXISTS "NistCsfSubcategoryAssessment_function_idx" ON "NistCsfSubcategoryAssessment"("function");
CREATE INDEX IF NOT EXISTS "NistCsfSubcategoryAssessment_category_idx" ON "NistCsfSubcategoryAssessment"("category");
CREATE INDEX IF NOT EXISTS "NistCsfSubcategoryAssessment_priority_idx" ON "NistCsfSubcategoryAssessment"("priority");

CREATE TABLE IF NOT EXISTS "NistCsfGapAnalysis" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,                   -- the Target profile this gap analysis was generated against
  "currentProfileId" TEXT NOT NULL,
  "targetProfileId" TEXT NOT NULL,
  "function" TEXT NOT NULL,                    -- one of the six Functions, or "Total"
  "gapCount" INTEGER NOT NULL DEFAULT 0,
  "criticalGapCount" INTEGER NOT NULL DEFAULT 0,
  "summary" JSONB,                             -- { currentAvgTier, targetAvgTier, deltaTier, subcategories: [...] }
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NistCsfGapAnalysis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NistCsfGapAnalysis_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "NistCsfGapAnalysis_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "NistCsfProfile"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "NistCsfGapAnalysis_organizationId_idx" ON "NistCsfGapAnalysis"("organizationId");
CREATE INDEX IF NOT EXISTS "NistCsfGapAnalysis_profileId_idx" ON "NistCsfGapAnalysis"("profileId");
CREATE INDEX IF NOT EXISTS "NistCsfGapAnalysis_currentProfileId_idx" ON "NistCsfGapAnalysis"("currentProfileId");
CREATE INDEX IF NOT EXISTS "NistCsfGapAnalysis_targetProfileId_idx" ON "NistCsfGapAnalysis"("targetProfileId");
CREATE INDEX IF NOT EXISTS "NistCsfGapAnalysis_function_idx" ON "NistCsfGapAnalysis"("function");
CREATE INDEX IF NOT EXISTS "NistCsfGapAnalysis_generatedAt_idx" ON "NistCsfGapAnalysis"("generatedAt");

CREATE TABLE IF NOT EXISTS "NistCsfActionItem" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "subcategoryAssessmentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'Moderate', -- Low, Moderate, High, Critical
  "assignedTo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Open',       -- Open, InProgress, Blocked, Completed, Cancelled
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "dependencies" JSONB,                        -- array of action item ids
  "estimatedEffort" TEXT,                      -- '1 quarter', '2 sprints', etc.
  "estimatedCost" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NistCsfActionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NistCsfActionItem_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "NistCsfActionItem_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "NistCsfProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "NistCsfActionItem_subcategoryAssessmentId_fkey"
    FOREIGN KEY ("subcategoryAssessmentId") REFERENCES "NistCsfSubcategoryAssessment"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "NistCsfActionItem_organizationId_idx" ON "NistCsfActionItem"("organizationId");
CREATE INDEX IF NOT EXISTS "NistCsfActionItem_profileId_idx" ON "NistCsfActionItem"("profileId");
CREATE INDEX IF NOT EXISTS "NistCsfActionItem_subcategoryAssessmentId_idx" ON "NistCsfActionItem"("subcategoryAssessmentId");
CREATE INDEX IF NOT EXISTS "NistCsfActionItem_status_idx" ON "NistCsfActionItem"("status");
CREATE INDEX IF NOT EXISTS "NistCsfActionItem_priority_idx" ON "NistCsfActionItem"("priority");
CREATE INDEX IF NOT EXISTS "NistCsfActionItem_dueDate_idx" ON "NistCsfActionItem"("dueDate");
