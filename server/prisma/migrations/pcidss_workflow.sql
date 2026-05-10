-- ============================================================================
-- PCI-DSS v4.0 Workflow Module
-- ----------------------------------------------------------------------------
-- Adds 7 tables:
--   PCIScope, PCIRequirement, PCIEvidence, QSAFinding,
--   CompensatingControlWorksheet, PCIROC, PCIAOC
-- All tables are organization-scoped with ON DELETE CASCADE.
-- ============================================================================

-- ── PCI Scope (CDE inventory + SAQ determination) ──────────────────────────

CREATE TABLE IF NOT EXISTS "PCIScope" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scopeStatement" TEXT NOT NULL,
  "saqType" TEXT NOT NULL,
  "segmentationDescription" TEXT,
  "cdeBoundaries" JSONB,
  "connectedSystemsCount" INTEGER NOT NULL DEFAULT 0,
  "networkDiagramRef" TEXT,
  "dataFlowDiagramRef" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "assessmentYear" INTEGER NOT NULL,
  "qsaCompany" TEXT,
  "qsaContactName" TEXT,
  "qsaContactEmail" TEXT,
  "leadAssessor" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PCIScope_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PCIScope_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PCIScope_organizationId_idx" ON "PCIScope"("organizationId");
CREATE INDEX IF NOT EXISTS "PCIScope_status_idx" ON "PCIScope"("status");
CREATE INDEX IF NOT EXISTS "PCIScope_saqType_idx" ON "PCIScope"("saqType");
CREATE INDEX IF NOT EXISTS "PCIScope_assessmentYear_idx" ON "PCIScope"("assessmentYear");

-- ── PCI Requirements (per-control implementation tracking) ─────────────────

CREATE TABLE IF NOT EXISTS "PCIRequirement" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "requirementRef" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "controlOwner" TEXT,
  "implementationStatus" TEXT NOT NULL DEFAULT 'NotImplemented',
  "applicability" TEXT NOT NULL DEFAULT 'Applicable',
  "notApplicableJustification" TEXT,
  "compensatingControlRef" TEXT,
  "lastTestedAt" TIMESTAMP(3),
  "testingMethod" TEXT,
  "testingNotes" TEXT,
  "evidenceRefs" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PCIRequirement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PCIRequirement_scopeId_requirementRef_key" UNIQUE ("scopeId", "requirementRef"),
  CONSTRAINT "PCIRequirement_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "PCIRequirement_scopeId_fkey"
    FOREIGN KEY ("scopeId") REFERENCES "PCIScope"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PCIRequirement_organizationId_idx" ON "PCIRequirement"("organizationId");
CREATE INDEX IF NOT EXISTS "PCIRequirement_scopeId_idx" ON "PCIRequirement"("scopeId");
CREATE INDEX IF NOT EXISTS "PCIRequirement_implementationStatus_idx" ON "PCIRequirement"("implementationStatus");
CREATE INDEX IF NOT EXISTS "PCIRequirement_applicability_idx" ON "PCIRequirement"("applicability");

-- ── PCI Evidence (PCI-scoped) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PCIEvidence" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "fileSha256" TEXT,
  "collectedBy" TEXT NOT NULL,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "retentionUntil" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Collected',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "qsaApproval" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PCIEvidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PCIEvidence_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "PCIEvidence_scopeId_fkey"
    FOREIGN KEY ("scopeId") REFERENCES "PCIScope"("id") ON DELETE CASCADE,
  CONSTRAINT "PCIEvidence_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "PCIRequirement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PCIEvidence_organizationId_idx" ON "PCIEvidence"("organizationId");
CREATE INDEX IF NOT EXISTS "PCIEvidence_scopeId_idx" ON "PCIEvidence"("scopeId");
CREATE INDEX IF NOT EXISTS "PCIEvidence_requirementId_idx" ON "PCIEvidence"("requirementId");
CREATE INDEX IF NOT EXISTS "PCIEvidence_status_idx" ON "PCIEvidence"("status");
CREATE INDEX IF NOT EXISTS "PCIEvidence_evidenceType_idx" ON "PCIEvidence"("evidenceType");
CREATE INDEX IF NOT EXISTS "PCIEvidence_qsaApproval_idx" ON "PCIEvidence"("qsaApproval");

-- ── QSA Findings ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "QSAFinding" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "requirementId" TEXT,
  "findingType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "qsaName" TEXT NOT NULL,
  "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "remediationOwner" TEXT,
  "remediationDueDate" TIMESTAMP(3),
  "remediationCompletedAt" TIMESTAMP(3),
  "remediationEvidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QSAFinding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QSAFinding_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "QSAFinding_scopeId_fkey"
    FOREIGN KEY ("scopeId") REFERENCES "PCIScope"("id") ON DELETE CASCADE,
  CONSTRAINT "QSAFinding_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "PCIRequirement"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "QSAFinding_organizationId_idx" ON "QSAFinding"("organizationId");
CREATE INDEX IF NOT EXISTS "QSAFinding_scopeId_idx" ON "QSAFinding"("scopeId");
CREATE INDEX IF NOT EXISTS "QSAFinding_requirementId_idx" ON "QSAFinding"("requirementId");
CREATE INDEX IF NOT EXISTS "QSAFinding_severity_idx" ON "QSAFinding"("severity");
CREATE INDEX IF NOT EXISTS "QSAFinding_status_idx" ON "QSAFinding"("status");
CREATE INDEX IF NOT EXISTS "QSAFinding_remediationDueDate_idx" ON "QSAFinding"("remediationDueDate");

-- ── Compensating Control Worksheet (Appendix B) ────────────────────────────

CREATE TABLE IF NOT EXISTS "CompensatingControlWorksheet" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "originalRequirement" TEXT NOT NULL,
  "constraint" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "identifiedRisk" TEXT NOT NULL,
  "definitionOfCompensatingControl" TEXT NOT NULL,
  "validationOfControl" TEXT NOT NULL,
  "maintenance" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompensatingControlWorksheet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompensatingControlWorksheet_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "CompensatingControlWorksheet_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "PCIRequirement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CompensatingControlWorksheet_organizationId_idx" ON "CompensatingControlWorksheet"("organizationId");
CREATE INDEX IF NOT EXISTS "CompensatingControlWorksheet_requirementId_idx" ON "CompensatingControlWorksheet"("requirementId");
CREATE INDEX IF NOT EXISTS "CompensatingControlWorksheet_status_idx" ON "CompensatingControlWorksheet"("status");

-- ── ROC (Report on Compliance) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PCIROC" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "coveragePeriodStart" TIMESTAMP(3) NOT NULL,
  "coveragePeriodEnd" TIMESTAMP(3) NOT NULL,
  "qsaCompany" TEXT NOT NULL,
  "leadAssessor" TEXT NOT NULL,
  "executiveSummary" TEXT,
  "scopeDescription" TEXT,
  "networkSegmentation" TEXT,
  "samplingMethodology" TEXT,
  "findingsCount" INTEGER NOT NULL DEFAULT 0,
  "finalizedAt" TIMESTAMP(3),
  "documentUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PCIROC_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PCIROC_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "PCIROC_scopeId_fkey"
    FOREIGN KEY ("scopeId") REFERENCES "PCIScope"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PCIROC_organizationId_idx" ON "PCIROC"("organizationId");
CREATE INDEX IF NOT EXISTS "PCIROC_scopeId_idx" ON "PCIROC"("scopeId");
CREATE INDEX IF NOT EXISTS "PCIROC_status_idx" ON "PCIROC"("status");

-- ── AOC (Attestation of Compliance) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PCIAOC" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "rocId" TEXT NOT NULL,
  "attestationType" TEXT NOT NULL,
  "merchantLevel" INTEGER,
  "serviceProviderLevel" INTEGER,
  "assessmentEndDate" TIMESTAMP(3) NOT NULL,
  "signedByMerchantOfficer" TEXT NOT NULL,
  "signedByQSA" TEXT NOT NULL,
  "documentUrl" TEXT,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PCIAOC_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PCIAOC_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "PCIAOC_rocId_fkey"
    FOREIGN KEY ("rocId") REFERENCES "PCIROC"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PCIAOC_organizationId_idx" ON "PCIAOC"("organizationId");
CREATE INDEX IF NOT EXISTS "PCIAOC_rocId_idx" ON "PCIAOC"("rocId");
CREATE INDEX IF NOT EXISTS "PCIAOC_attestationType_idx" ON "PCIAOC"("attestationType");
CREATE INDEX IF NOT EXISTS "PCIAOC_assessmentEndDate_idx" ON "PCIAOC"("assessmentEndDate");
