-- ============================================================================
-- ISO 27001 Guided Workflow + HIPAA Workflow Module
-- ----------------------------------------------------------------------------
-- Adds 8 tables:
--   ISO 27001: Assessment, SoA, RiskScenario, CorrectiveAction
--   HIPAA:     PHIRecord, PHIAccessGrant, BusinessAssociateAgreement,
--              HIPAABreachRiskAssessment
-- All tables are organization-scoped with ON DELETE CASCADE.
-- ============================================================================

-- ── ISO 27001 ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ISO27001Assessment" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "frameworkId" TEXT,
  "assessmentYear" INTEGER NOT NULL,
  "scope" TEXT NOT NULL,
  "scopeBoundaries" JSONB,
  "status" TEXT NOT NULL DEFAULT 'InProgress',
  "riskTreatmentPlanRef" TEXT,
  "certificationBody" TEXT,
  "stage1AuditDate" TIMESTAMP(3),
  "stage2AuditDate" TIMESTAMP(3),
  "certificationDate" TIMESTAMP(3),
  "certificateExpiresAt" TIMESTAMP(3),
  "internalAuditDate" TIMESTAMP(3),
  "managementReviewDate" TIMESTAMP(3),
  "leadAuditor" TEXT,
  "isms_owner" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ISO27001Assessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ISO27001Assessment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ISO27001Assessment_organizationId_idx" ON "ISO27001Assessment"("organizationId");
CREATE INDEX IF NOT EXISTS "ISO27001Assessment_status_idx" ON "ISO27001Assessment"("status");
CREATE INDEX IF NOT EXISTS "ISO27001Assessment_assessmentYear_idx" ON "ISO27001Assessment"("assessmentYear");

CREATE TABLE IF NOT EXISTS "ISO27001SoA" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "controlRef" TEXT NOT NULL,
  "controlTitle" TEXT NOT NULL,
  "applicability" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "implementationStatus" TEXT NOT NULL DEFAULT 'NotImplemented',
  "implementationNotes" TEXT,
  "evidenceRefs" JSONB,
  "controlOwner" TEXT,
  "lastReviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ISO27001SoA_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ISO27001SoA_assessmentId_controlRef_key" UNIQUE ("assessmentId", "controlRef"),
  CONSTRAINT "ISO27001SoA_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ISO27001SoA_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "ISO27001Assessment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ISO27001SoA_organizationId_idx" ON "ISO27001SoA"("organizationId");
CREATE INDEX IF NOT EXISTS "ISO27001SoA_assessmentId_idx" ON "ISO27001SoA"("assessmentId");
CREATE INDEX IF NOT EXISTS "ISO27001SoA_applicability_idx" ON "ISO27001SoA"("applicability");

CREATE TABLE IF NOT EXISTS "ISO27001RiskScenario" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "threat" TEXT NOT NULL,
  "vulnerability" TEXT NOT NULL,
  "affectedAsset" TEXT NOT NULL,
  "likelihood" INTEGER NOT NULL,
  "impact" INTEGER NOT NULL,
  "inherentRisk" INTEGER NOT NULL,
  "treatmentDecision" TEXT NOT NULL,
  "treatmentPlan" TEXT,
  "residualRisk" INTEGER,
  "riskOwner" TEXT,
  "controlRefs" JSONB,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "reviewDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ISO27001RiskScenario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ISO27001RiskScenario_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ISO27001RiskScenario_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "ISO27001Assessment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ISO27001RiskScenario_organizationId_idx" ON "ISO27001RiskScenario"("organizationId");
CREATE INDEX IF NOT EXISTS "ISO27001RiskScenario_assessmentId_idx" ON "ISO27001RiskScenario"("assessmentId");
CREATE INDEX IF NOT EXISTS "ISO27001RiskScenario_status_idx" ON "ISO27001RiskScenario"("status");

CREATE TABLE IF NOT EXISTS "ISO27001CorrectiveAction" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "finding" TEXT NOT NULL,
  "rootCause" TEXT,
  "containment" TEXT,
  "correctiveAction" TEXT NOT NULL,
  "preventiveAction" TEXT,
  "owner" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "evidenceRefs" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ISO27001CorrectiveAction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ISO27001CorrectiveAction_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ISO27001CorrectiveAction_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "ISO27001Assessment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ISO27001CorrectiveAction_organizationId_idx" ON "ISO27001CorrectiveAction"("organizationId");
CREATE INDEX IF NOT EXISTS "ISO27001CorrectiveAction_assessmentId_idx" ON "ISO27001CorrectiveAction"("assessmentId");
CREATE INDEX IF NOT EXISTS "ISO27001CorrectiveAction_status_idx" ON "ISO27001CorrectiveAction"("status");
CREATE INDEX IF NOT EXISTS "ISO27001CorrectiveAction_dueDate_idx" ON "ISO27001CorrectiveAction"("dueDate");

-- ── HIPAA ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PHIRecord" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "systemName" TEXT NOT NULL,
  "dataLocation" TEXT NOT NULL,
  "custodian" TEXT NOT NULL,
  "recordCount" INTEGER,
  "classification" TEXT NOT NULL DEFAULT 'PHI',
  "dataElements" JSONB NOT NULL,
  "encryptionAtRest" BOOLEAN NOT NULL DEFAULT FALSE,
  "encryptionInTransit" BOOLEAN NOT NULL DEFAULT FALSE,
  "retentionDays" INTEGER,
  "legalBasis" TEXT,
  "riskLevel" TEXT NOT NULL DEFAULT 'Medium',
  "segmentationId" TEXT,
  "lastReviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PHIRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PHIRecord_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PHIRecord_organizationId_idx" ON "PHIRecord"("organizationId");
CREATE INDEX IF NOT EXISTS "PHIRecord_classification_idx" ON "PHIRecord"("classification");
CREATE INDEX IF NOT EXISTS "PHIRecord_riskLevel_idx" ON "PHIRecord"("riskLevel");

CREATE TABLE IF NOT EXISTS "PHIAccessGrant" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "phiRecordId" TEXT NOT NULL,
  "grantedToUserId" TEXT,
  "grantedToParty" TEXT,
  "accessLevel" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "scopeFilters" JSONB,
  "approvedBy" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PHIAccessGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PHIAccessGrant_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "PHIAccessGrant_phiRecordId_fkey"
    FOREIGN KEY ("phiRecordId") REFERENCES "PHIRecord"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PHIAccessGrant_organizationId_idx" ON "PHIAccessGrant"("organizationId");
CREATE INDEX IF NOT EXISTS "PHIAccessGrant_phiRecordId_idx" ON "PHIAccessGrant"("phiRecordId");
CREATE INDEX IF NOT EXISTS "PHIAccessGrant_grantedToUserId_idx" ON "PHIAccessGrant"("grantedToUserId");
CREATE INDEX IF NOT EXISTS "PHIAccessGrant_expiresAt_idx" ON "PHIAccessGrant"("expiresAt");

CREATE TABLE IF NOT EXISTS "BusinessAssociateAgreement" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "businessAssociate" TEXT NOT NULL,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "servicesProvided" TEXT NOT NULL,
  "phiCategoriesShared" JSONB NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Active',
  "documentUrl" TEXT,
  "subContractorsAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "breachNotificationDays" INTEGER NOT NULL DEFAULT 60,
  "lastReviewedAt" TIMESTAMP(3),
  "riskTier" TEXT NOT NULL DEFAULT 'Standard',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessAssociateAgreement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessAssociateAgreement_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BusinessAssociateAgreement_organizationId_idx" ON "BusinessAssociateAgreement"("organizationId");
CREATE INDEX IF NOT EXISTS "BusinessAssociateAgreement_status_idx" ON "BusinessAssociateAgreement"("status");
CREATE INDEX IF NOT EXISTS "BusinessAssociateAgreement_expiresAt_idx" ON "BusinessAssociateAgreement"("expiresAt");

CREATE TABLE IF NOT EXISTS "HIPAABreachRiskAssessment" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "breachIncidentId" TEXT,
  "natureExtentScore" INTEGER NOT NULL,
  "recipientScore" INTEGER NOT NULL,
  "acquisitionScore" INTEGER NOT NULL,
  "mitigationScore" INTEGER NOT NULL,
  "natureExtentNotes" TEXT,
  "recipientNotes" TEXT,
  "acquisitionNotes" TEXT,
  "mitigationNotes" TEXT,
  "presumptionRebutted" BOOLEAN NOT NULL DEFAULT FALSE,
  "conclusion" TEXT NOT NULL,
  "affectedIndividuals" INTEGER NOT NULL DEFAULT 0,
  "affectedStates" JSONB,
  "discoveryDate" TIMESTAMP(3) NOT NULL,
  "individualNoticeDueAt" TIMESTAMP(3),
  "hhsNoticeDueAt" TIMESTAMP(3),
  "mediaNoticeDueAt" TIMESTAMP(3),
  "individualNoticedAt" TIMESTAMP(3),
  "hhsNoticedAt" TIMESTAMP(3),
  "mediaNoticedAt" TIMESTAMP(3),
  "preparedBy" TEXT NOT NULL,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HIPAABreachRiskAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HIPAABreachRiskAssessment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "HIPAABreachRiskAssessment_organizationId_idx" ON "HIPAABreachRiskAssessment"("organizationId");
CREATE INDEX IF NOT EXISTS "HIPAABreachRiskAssessment_conclusion_idx" ON "HIPAABreachRiskAssessment"("conclusion");
CREATE INDEX IF NOT EXISTS "HIPAABreachRiskAssessment_discoveryDate_idx" ON "HIPAABreachRiskAssessment"("discoveryDate");
CREATE INDEX IF NOT EXISTS "HIPAABreachRiskAssessment_individualNoticeDueAt_idx" ON "HIPAABreachRiskAssessment"("individualNoticeDueAt");
