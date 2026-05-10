-- ============================================================================
-- SOC 2 Guided Workflow Module
-- ----------------------------------------------------------------------------
-- Adds 6 tables supporting both Type I (point-in-time design) and Type II
-- (operating effectiveness over a period) audit lifecycles per the AICPA
-- Trust Services Criteria (TSC 2017 with 2022 points of focus):
--   SOC2Engagement, SOC2Control, SOC2EvidenceSample, SOC2Exception,
--   SOC2CUEC, SOC2ManagementAssertion
-- All tables are organization-scoped with ON DELETE CASCADE.
-- ============================================================================

-- ── SOC2 Engagement ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SOC2Engagement" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "engagementYear" INTEGER NOT NULL,
  "engagementType" TEXT NOT NULL,
  "trustServicesIncluded" JSONB NOT NULL,
  "auditPeriodStart" TIMESTAMP(3),
  "auditPeriodEnd" TIMESTAMP(3),
  "asOfDate" TIMESTAMP(3),
  "cpaFirm" TEXT,
  "leadAuditor" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Planning',
  "reportType" TEXT,
  "reportIssuedAt" TIMESTAMP(3),
  "reportUrl" TEXT,
  "scopeBoundaries" JSONB,
  "subserviceOrganizations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOC2Engagement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOC2Engagement_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOC2Engagement_organizationId_idx" ON "SOC2Engagement"("organizationId");
CREATE INDEX IF NOT EXISTS "SOC2Engagement_status_idx" ON "SOC2Engagement"("status");
CREATE INDEX IF NOT EXISTS "SOC2Engagement_engagementYear_idx" ON "SOC2Engagement"("engagementYear");
CREATE INDEX IF NOT EXISTS "SOC2Engagement_engagementType_idx" ON "SOC2Engagement"("engagementType");

-- ── SOC2 Control ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SOC2Control" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "criteriaCategory" TEXT NOT NULL,
  "criteriaRef" TEXT NOT NULL,
  "criteriaTitle" TEXT NOT NULL,
  "controlActivity" TEXT NOT NULL,
  "controlObjective" TEXT,
  "controlOwner" TEXT,
  "controlFrequency" TEXT NOT NULL DEFAULT 'Continuous',
  "controlType" TEXT NOT NULL DEFAULT 'Preventive',
  "automationLevel" TEXT NOT NULL DEFAULT 'Manual',
  "riskRating" TEXT NOT NULL DEFAULT 'Medium',
  "implementationStatus" TEXT NOT NULL DEFAULT 'NotImplemented',
  "lastTestedAt" TIMESTAMP(3),
  "nextTestDate" TIMESTAMP(3),
  "designStatus" TEXT NOT NULL DEFAULT 'NotTested',
  "operatingStatus" TEXT NOT NULL DEFAULT 'NotTested',
  "evidenceRefs" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOC2Control_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOC2Control_engagementId_criteriaRef_key" UNIQUE ("engagementId", "criteriaRef"),
  CONSTRAINT "SOC2Control_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2Control_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "SOC2Engagement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOC2Control_organizationId_idx" ON "SOC2Control"("organizationId");
CREATE INDEX IF NOT EXISTS "SOC2Control_engagementId_idx" ON "SOC2Control"("engagementId");
CREATE INDEX IF NOT EXISTS "SOC2Control_criteriaCategory_idx" ON "SOC2Control"("criteriaCategory");
CREATE INDEX IF NOT EXISTS "SOC2Control_implementationStatus_idx" ON "SOC2Control"("implementationStatus");
CREATE INDEX IF NOT EXISTS "SOC2Control_nextTestDate_idx" ON "SOC2Control"("nextTestDate");

-- ── SOC2 Evidence Sample ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SOC2EvidenceSample" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "samplingPeriodStart" TIMESTAMP(3) NOT NULL,
  "samplingPeriodEnd" TIMESTAMP(3) NOT NULL,
  "populationSize" INTEGER NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "samplingMethod" TEXT NOT NULL DEFAULT 'Random',
  "evidenceType" TEXT NOT NULL,
  "evidenceUrl" TEXT,
  "evidenceSha256" TEXT,
  "exceptionsFound" INTEGER NOT NULL DEFAULT 0,
  "collectedBy" TEXT,
  "collectedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOC2EvidenceSample_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOC2EvidenceSample_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2EvidenceSample_controlId_fkey"
    FOREIGN KEY ("controlId") REFERENCES "SOC2Control"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOC2EvidenceSample_organizationId_idx" ON "SOC2EvidenceSample"("organizationId");
CREATE INDEX IF NOT EXISTS "SOC2EvidenceSample_controlId_idx" ON "SOC2EvidenceSample"("controlId");
CREATE INDEX IF NOT EXISTS "SOC2EvidenceSample_status_idx" ON "SOC2EvidenceSample"("status");
CREATE INDEX IF NOT EXISTS "SOC2EvidenceSample_samplingPeriodEnd_idx" ON "SOC2EvidenceSample"("samplingPeriodEnd");

-- ── SOC2 Exception ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SOC2Exception" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "sampleId" TEXT,
  "exceptionType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "identifiedBy" TEXT NOT NULL,
  "populationImpact" TEXT,
  "rootCause" TEXT,
  "remediation" TEXT,
  "remediationOwner" TEXT,
  "remediationDueDate" TIMESTAMP(3),
  "remediationCompletedAt" TIMESTAMP(3),
  "managementResponse" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOC2Exception_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOC2Exception_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2Exception_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "SOC2Engagement"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2Exception_controlId_fkey"
    FOREIGN KEY ("controlId") REFERENCES "SOC2Control"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2Exception_sampleId_fkey"
    FOREIGN KEY ("sampleId") REFERENCES "SOC2EvidenceSample"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "SOC2Exception_organizationId_idx" ON "SOC2Exception"("organizationId");
CREATE INDEX IF NOT EXISTS "SOC2Exception_engagementId_idx" ON "SOC2Exception"("engagementId");
CREATE INDEX IF NOT EXISTS "SOC2Exception_controlId_idx" ON "SOC2Exception"("controlId");
CREATE INDEX IF NOT EXISTS "SOC2Exception_status_idx" ON "SOC2Exception"("status");
CREATE INDEX IF NOT EXISTS "SOC2Exception_exceptionType_idx" ON "SOC2Exception"("exceptionType");

-- ── SOC2 Complementary User Entity Controls (CUECs) ────────────────────────

CREATE TABLE IF NOT EXISTS "SOC2CUEC" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "criteriaCategory" TEXT NOT NULL,
  "controlDescription" TEXT NOT NULL,
  "userResponsibility" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOC2CUEC_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOC2CUEC_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2CUEC_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "SOC2Engagement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOC2CUEC_organizationId_idx" ON "SOC2CUEC"("organizationId");
CREATE INDEX IF NOT EXISTS "SOC2CUEC_engagementId_idx" ON "SOC2CUEC"("engagementId");
CREATE INDEX IF NOT EXISTS "SOC2CUEC_criteriaCategory_idx" ON "SOC2CUEC"("criteriaCategory");

-- ── SOC2 Management Assertion ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SOC2ManagementAssertion" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "assertionType" TEXT NOT NULL,
  "assertionText" TEXT NOT NULL,
  "signedByOfficerName" TEXT NOT NULL,
  "signedByOfficerTitle" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL,
  "documentUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SOC2ManagementAssertion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SOC2ManagementAssertion_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "SOC2ManagementAssertion_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "SOC2Engagement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOC2ManagementAssertion_organizationId_idx" ON "SOC2ManagementAssertion"("organizationId");
CREATE INDEX IF NOT EXISTS "SOC2ManagementAssertion_engagementId_idx" ON "SOC2ManagementAssertion"("engagementId");
CREATE INDEX IF NOT EXISTS "SOC2ManagementAssertion_assertionType_idx" ON "SOC2ManagementAssertion"("assertionType");
