-- ============================================================================
-- SQL Migration: Add Missing Tables to Supabase
-- Generated: 2026-02-25
-- Total Tables: 59 (excluding 4 that have legacy snake_case equivalents)
-- ============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GOVERNANCE MODULE (5 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "GovernanceBody" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "charter" TEXT,
    "meetingFrequency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "members" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceBody_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GovernanceBody_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "GovernanceBody_organizationId_idx" ON "GovernanceBody"("organizationId");

CREATE TABLE IF NOT EXISTS "GovernanceMeeting" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "governanceBodyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "agenda" JSONB,
    "minutes" TEXT,
    "attendees" JSONB,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "actionItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceMeeting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GovernanceMeeting_governanceBodyId_fkey" FOREIGN KEY ("governanceBodyId") REFERENCES "GovernanceBody"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "GovernanceMeeting_governanceBodyId_idx" ON "GovernanceMeeting"("governanceBodyId");
CREATE INDEX IF NOT EXISTS "GovernanceMeeting_date_idx" ON "GovernanceMeeting"("date");

CREATE TABLE IF NOT EXISTS "GovernanceDecision" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "governanceBodyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "decisionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "rationale" TEXT,
    "impact" TEXT,
    "votingRecord" JSONB,
    "effectiveDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceDecision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GovernanceDecision_governanceBodyId_fkey" FOREIGN KEY ("governanceBodyId") REFERENCES "GovernanceBody"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "GovernanceDecision_governanceBodyId_idx" ON "GovernanceDecision"("governanceBodyId");
CREATE INDEX IF NOT EXISTS "GovernanceDecision_status_idx" ON "GovernanceDecision"("status");

CREATE TABLE IF NOT EXISTS "EscalationPath" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "governanceBodyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerCriteria" JSONB NOT NULL,
    "levels" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EscalationPath_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EscalationPath_governanceBodyId_fkey" FOREIGN KEY ("governanceBodyId") REFERENCES "GovernanceBody"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "EscalationPath_governanceBodyId_idx" ON "EscalationPath"("governanceBodyId");

CREATE TABLE IF NOT EXISTS "DPOProfile" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "certifications" JSONB,
    "appointmentDate" TIMESTAMP(3),
    "registeredWithDPA" BOOLEAN NOT NULL DEFAULT false,
    "dpaRegistrationRef" TEXT,
    "tasks" JSONB,
    "activityLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DPOProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DPOProfile_organizationId_key" UNIQUE ("organizationId"),
    CONSTRAINT "DPOProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- ============================================================================
-- BREACH NOTIFICATION MODULE (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BreachIncident" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "breachType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'detected',
    "discoveryDate" TIMESTAMP(3) NOT NULL,
    "discoveryMethod" TEXT,
    "description" TEXT,
    "affectedRecords" INTEGER,
    "affectedDataTypes" JSONB,
    "affectedJurisdictions" JSONB,
    "rootCause" TEXT,
    "containmentActions" JSONB,
    "impactAssessment" JSONB,
    "timeline" JSONB,
    "lessonsLearned" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BreachIncident_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BreachIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BreachIncident_organizationId_idx" ON "BreachIncident"("organizationId");
CREATE INDEX IF NOT EXISTS "BreachIncident_status_idx" ON "BreachIncident"("status");
CREATE INDEX IF NOT EXISTS "BreachIncident_severity_idx" ON "BreachIncident"("severity");

CREATE TABLE IF NOT EXISTS "BreachNotification" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "breachId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "authority" TEXT,
    "templateUsed" TEXT,
    "content" TEXT,
    "sentAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "acknowledgement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BreachNotification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BreachNotification_breachId_fkey" FOREIGN KEY ("breachId") REFERENCES "BreachIncident"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BreachNotification_breachId_idx" ON "BreachNotification"("breachId");
CREATE INDEX IF NOT EXISTS "BreachNotification_status_idx" ON "BreachNotification"("status");

CREATE TABLE IF NOT EXISTS "BreachTemplate" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BreachTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BreachTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BreachTemplate_organizationId_idx" ON "BreachTemplate"("organizationId");

CREATE TABLE IF NOT EXISTS "RegulatoryContact" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notificationUrl" TEXT,
    "timelineHours" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegulatoryContact_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RegulatoryContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RegulatoryContact_organizationId_idx" ON "RegulatoryContact"("organizationId");

-- ============================================================================
-- CE MARKING MODULE (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CEProduct" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productCode" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "applicableDirectives" JSONB,
    "conformityModule" TEXT,
    "notifiedBody" JSONB,
    "technicalFile" JSONB,
    "testResults" JSONB,
    "riskAssessment" JSONB,
    "ceMarkingStatus" TEXT NOT NULL DEFAULT 'not_started',
    "docStatus" TEXT NOT NULL DEFAULT 'incomplete',
    "ceMarkedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CEProduct_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CEProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CEProduct_organizationId_idx" ON "CEProduct"("organizationId");
CREATE INDEX IF NOT EXISTS "CEProduct_ceMarkingStatus_idx" ON "CEProduct"("ceMarkingStatus");

-- ============================================================================
-- DIGITAL PRODUCT PASSPORT MODULE (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DigitalProductPassport" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "gtin" TEXT,
    "batchNumber" TEXT,
    "serialNumber" TEXT,
    "manufacturingDate" TIMESTAMP(3),
    "manufacturingLocation" TEXT,
    "materialComposition" JSONB,
    "carbonFootprint" JSONB,
    "recyclabilityScore" DOUBLE PRECISION,
    "repairabilityScore" DOUBLE PRECISION,
    "durabilityRating" TEXT,
    "energyClass" TEXT,
    "supplyChain" JSONB,
    "circularityMetrics" JSONB,
    "complianceStatus" TEXT NOT NULL DEFAULT 'draft',
    "passportVersion" INTEGER NOT NULL DEFAULT 1,
    "qrCodeData" TEXT,
    "publicUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DigitalProductPassport_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DigitalProductPassport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DigitalProductPassport_organizationId_idx" ON "DigitalProductPassport"("organizationId");
CREATE INDEX IF NOT EXISTS "DigitalProductPassport_gtin_idx" ON "DigitalProductPassport"("gtin");

-- ============================================================================
-- ESG REPORTING MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ESGMetric" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "previousValue" DOUBLE PRECISION,
    "reportingPeriod" TEXT NOT NULL,
    "esrsStandard" TEXT,
    "methodology" TEXT,
    "dataSource" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ESGMetric_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ESGMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ESGMetric_organizationId_idx" ON "ESGMetric"("organizationId");
CREATE INDEX IF NOT EXISTS "ESGMetric_category_idx" ON "ESGMetric"("category");
CREATE INDEX IF NOT EXISTS "ESGMetric_reportingPeriod_idx" ON "ESGMetric"("reportingPeriod");

CREATE TABLE IF NOT EXISTS "MaterialityAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "esrsStandard" TEXT,
    "financialImpact" DOUBLE PRECISION,
    "impactOnSociety" DOUBLE PRECISION,
    "isMaterial" BOOLEAN NOT NULL DEFAULT false,
    "stakeholders" JSONB,
    "justification" TEXT,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialityAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MaterialityAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MaterialityAssessment_organizationId_idx" ON "MaterialityAssessment"("organizationId");

-- ============================================================================
-- SBOM MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SBOMEntry" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "repositoryName" TEXT,
    "componentName" TEXT NOT NULL,
    "componentVersion" TEXT NOT NULL,
    "packageManager" TEXT,
    "license" TEXT,
    "licenseRisk" TEXT,
    "directDependency" BOOLEAN NOT NULL DEFAULT true,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "vulnerabilities" JSONB,
    "supplyChainRisk" TEXT,
    "lastScanned" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SBOMEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SBOMEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SBOMEntry_organizationId_idx" ON "SBOMEntry"("organizationId");
CREATE INDEX IF NOT EXISTS "SBOMEntry_componentName_idx" ON "SBOMEntry"("componentName");
CREATE INDEX IF NOT EXISTS "SBOMEntry_licenseRisk_idx" ON "SBOMEntry"("licenseRisk");

CREATE TABLE IF NOT EXISTS "SBOMRepository" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "branch" TEXT DEFAULT 'main',
    "format" TEXT NOT NULL DEFAULT 'cyclonedx',
    "lastScanned" TIMESTAMP(3),
    "componentCount" INTEGER NOT NULL DEFAULT 0,
    "vulnerabilityCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SBOMRepository_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SBOMRepository_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SBOMRepository_organizationId_idx" ON "SBOMRepository"("organizationId");

-- ============================================================================
-- SURVEILLANCE MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SurveillancePlan" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "planType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "scope" JSONB,
    "kpis" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveillancePlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SurveillancePlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SurveillancePlan_organizationId_idx" ON "SurveillancePlan"("organizationId");

CREATE TABLE IF NOT EXISTS "SurveillanceIncident" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "planId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reportedBy" TEXT,
    "reportedDate" TIMESTAMP(3) NOT NULL,
    "investigationStatus" TEXT NOT NULL DEFAULT 'open',
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "regulatoryNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAuthority" TEXT,
    "capaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveillanceIncident_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SurveillanceIncident_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SurveillancePlan"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SurveillanceIncident_planId_idx" ON "SurveillanceIncident"("planId");
CREATE INDEX IF NOT EXISTS "SurveillanceIncident_type_idx" ON "SurveillanceIncident"("type");
CREATE INDEX IF NOT EXISTS "SurveillanceIncident_severity_idx" ON "SurveillanceIncident"("severity");

-- ============================================================================
-- PRODUCT LIFECYCLE MODULE (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ProductRecall" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "recallType" TEXT NOT NULL,
    "recallClass" TEXT,
    "reason" TEXT NOT NULL,
    "affectedUnits" INTEGER,
    "affectedMarkets" JSONB,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "notificationDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "recoveryRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductRecall_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductRecall_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProductRecall_organizationId_idx" ON "ProductRecall"("organizationId");
CREATE INDEX IF NOT EXISTS "ProductRecall_status_idx" ON "ProductRecall"("status");

CREATE TABLE IF NOT EXISTS "ProductDecommission" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "decommissionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "plannedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "disposalMethod" TEXT,
    "environmentalImpact" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductDecommission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductDecommission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProductDecommission_organizationId_idx" ON "ProductDecommission"("organizationId");

CREATE TABLE IF NOT EXISTS "LifecycleAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "assessmentType" TEXT NOT NULL,
    "scope" TEXT,
    "methodology" TEXT,
    "results" JSONB,
    "recommendations" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "assessedBy" TEXT,
    "assessedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LifecycleAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LifecycleAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "LifecycleAssessment_organizationId_idx" ON "LifecycleAssessment"("organizationId");

CREATE TABLE IF NOT EXISTS "ProductLifecycle" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "currentStage" TEXT NOT NULL,
    "stages" JSONB NOT NULL,
    "compliance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductLifecycle_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductLifecycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProductLifecycle_organizationId_idx" ON "ProductLifecycle"("organizationId");

-- ============================================================================
-- PROCESS MAPPER MODULE (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ProcessMap" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "raciMatrix" JSONB,
    "complianceGaps" JSONB,
    "bpmnXml" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessMap_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProcessMap_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProcessMap_organizationId_idx" ON "ProcessMap"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcessMap_category_idx" ON "ProcessMap"("category");

-- ============================================================================
-- REGULATION DATA MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RegulationModuleData" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegulationModuleData_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RegulationModuleData_organizationId_module_dataType_key" UNIQUE ("organizationId", "module", "dataType"),
    CONSTRAINT "RegulationModuleData_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RegulationModuleData_organizationId_idx" ON "RegulationModuleData"("organizationId");
CREATE INDEX IF NOT EXISTS "RegulationModuleData_module_idx" ON "RegulationModuleData"("module");

CREATE TABLE IF NOT EXISTS "MetricsHistory" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricsHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MetricsHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MetricsHistory_organizationId_metricType_idx" ON "MetricsHistory"("organizationId", "metricType");

-- ============================================================================
-- DORA COMPLIANCE MODULE (5 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DORAICTRiskAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessorName" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "ictAssets" JSONB NOT NULL,
    "riskClassification" TEXT NOT NULL DEFAULT 'Medium',
    "vulnerabilities" JSONB,
    "threats" JSONB,
    "riskTreatmentPlan" JSONB,
    "residualRisk" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "nextReviewDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DORAICTRiskAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DORAICTRiskAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DORAICTRiskAssessment_organizationId_idx" ON "DORAICTRiskAssessment"("organizationId");
CREATE INDEX IF NOT EXISTS "DORAICTRiskAssessment_status_idx" ON "DORAICTRiskAssessment"("status");
CREATE INDEX IF NOT EXISTS "DORAICTRiskAssessment_riskClassification_idx" ON "DORAICTRiskAssessment"("riskClassification");

CREATE TABLE IF NOT EXISTS "DORAICTIncident" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "affectedSystems" JSONB,
    "affectedUsers" INTEGER,
    "financialImpact" DOUBLE PRECISION,
    "regulatoryNotified" BOOLEAN NOT NULL DEFAULT false,
    "notificationDate" TIMESTAMP(3),
    "notificationAuthority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "timeline" JSONB,
    "lessonsLearned" TEXT,
    "remediationActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DORAICTIncident_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DORAICTIncident_incidentId_key" UNIQUE ("incidentId"),
    CONSTRAINT "DORAICTIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DORAICTIncident_organizationId_idx" ON "DORAICTIncident"("organizationId");
CREATE INDEX IF NOT EXISTS "DORAICTIncident_status_idx" ON "DORAICTIncident"("status");
CREATE INDEX IF NOT EXISTS "DORAICTIncident_severity_idx" ON "DORAICTIncident"("severity");
CREATE INDEX IF NOT EXISTS "DORAICTIncident_detectedAt_idx" ON "DORAICTIncident"("detectedAt");

CREATE TABLE IF NOT EXISTS "DORAThirdPartyProvider" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "criticality" TEXT NOT NULL DEFAULT 'Medium',
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "serviceDescription" TEXT,
    "dataProcessed" JSONB,
    "locationOfProcessing" TEXT,
    "subcontractors" JSONB,
    "exitStrategy" TEXT,
    "lastAuditDate" TIMESTAMP(3),
    "nextAuditDate" TIMESTAMP(3),
    "complianceStatus" TEXT NOT NULL DEFAULT 'Pending',
    "riskScore" INTEGER,
    "concentrationRisk" BOOLEAN NOT NULL DEFAULT false,
    "alternativeProviders" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DORAThirdPartyProvider_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DORAThirdPartyProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DORAThirdPartyProvider_organizationId_idx" ON "DORAThirdPartyProvider"("organizationId");
CREATE INDEX IF NOT EXISTS "DORAThirdPartyProvider_criticality_idx" ON "DORAThirdPartyProvider"("criticality");
CREATE INDEX IF NOT EXISTS "DORAThirdPartyProvider_complianceStatus_idx" ON "DORAThirdPartyProvider"("complianceStatus");

CREATE TABLE IF NOT EXISTS "DORAResilienceTest" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "methodology" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "executedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "participants" JSONB,
    "scenarioDescription" TEXT,
    "findings" JSONB,
    "criticalFindings" INTEGER NOT NULL DEFAULT 0,
    "highFindings" INTEGER NOT NULL DEFAULT 0,
    "mediumFindings" INTEGER NOT NULL DEFAULT 0,
    "lowFindings" INTEGER NOT NULL DEFAULT 0,
    "remediationPlan" JSONB,
    "providerId" TEXT,
    "approvedBy" TEXT,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DORAResilienceTest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DORAResilienceTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "DORAResilienceTest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "DORAThirdPartyProvider"("id")
);
CREATE INDEX IF NOT EXISTS "DORAResilienceTest_organizationId_idx" ON "DORAResilienceTest"("organizationId");
CREATE INDEX IF NOT EXISTS "DORAResilienceTest_testType_idx" ON "DORAResilienceTest"("testType");
CREATE INDEX IF NOT EXISTS "DORAResilienceTest_status_idx" ON "DORAResilienceTest"("status");
CREATE INDEX IF NOT EXISTS "DORAResilienceTest_providerId_idx" ON "DORAResilienceTest"("providerId");

CREATE TABLE IF NOT EXISTS "DORAInformationRegister" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'Internal',
    "location" TEXT,
    "dependencies" JSONB,
    "recoveryTimeObjective" INTEGER,
    "recoveryPointObjective" INTEGER,
    "businessImpact" TEXT NOT NULL DEFAULT 'Medium',
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DORAInformationRegister_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DORAInformationRegister_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DORAInformationRegister_organizationId_idx" ON "DORAInformationRegister"("organizationId");
CREATE INDEX IF NOT EXISTS "DORAInformationRegister_assetType_idx" ON "DORAInformationRegister"("assetType");
CREATE INDEX IF NOT EXISTS "DORAInformationRegister_classification_idx" ON "DORAInformationRegister"("classification");

-- ============================================================================
-- AUDITOR COLLABORATION MODULE (5 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AuditorProfile" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firm" TEXT,
    "certification" TEXT[] DEFAULT '{}',
    "specializations" TEXT[] DEFAULT '{}',
    "yearsExperience" INTEGER,
    "engagementType" TEXT NOT NULL DEFAULT 'External',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "rating" DOUBLE PRECISION,
    "completedAudits" INTEGER NOT NULL DEFAULT 0,
    "hourlyRate" DOUBLE PRECISION,
    "contractUrl" TEXT,
    "ndaSigned" BOOLEAN NOT NULL DEFAULT false,
    "ndaSignedDate" TIMESTAMP(3),
    "lastEngagement" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditorProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditorProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditorProfile_organizationId_idx" ON "AuditorProfile"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditorProfile_status_idx" ON "AuditorProfile"("status");
CREATE INDEX IF NOT EXISTS "AuditorProfile_engagementType_idx" ON "AuditorProfile"("engagementType");

CREATE TABLE IF NOT EXISTS "AuditEngagement" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "engagementType" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "scope" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Planning',
    "objectives" JSONB,
    "deliverables" JSONB,
    "timeline" JSONB,
    "budget" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "riskAssessment" JSONB,
    "managementResponse" TEXT,
    "finalReportUrl" TEXT,
    "overallOpinion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEngagement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditEngagement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "AuditEngagement_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "AuditorProfile"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditEngagement_organizationId_idx" ON "AuditEngagement"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditEngagement_auditorId_idx" ON "AuditEngagement"("auditorId");
CREATE INDEX IF NOT EXISTS "AuditEngagement_status_idx" ON "AuditEngagement"("status");
CREATE INDEX IF NOT EXISTS "AuditEngagement_framework_idx" ON "AuditEngagement"("framework");

CREATE TABLE IF NOT EXISTS "AuditFinding" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "controlRef" TEXT,
    "evidence" JSONB,
    "recommendation" TEXT,
    "managementResponse" TEXT,
    "responsibleParty" TEXT,
    "targetRemediationDate" TIMESTAMP(3),
    "actualRemediationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Open',
    "retestResult" TEXT,
    "retestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditFinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "AuditFinding_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "AuditEngagement"("id") ON DELETE CASCADE,
    CONSTRAINT "AuditFinding_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "AuditorProfile"("id")
);
CREATE INDEX IF NOT EXISTS "AuditFinding_organizationId_idx" ON "AuditFinding"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditFinding_engagementId_idx" ON "AuditFinding"("engagementId");
CREATE INDEX IF NOT EXISTS "AuditFinding_status_idx" ON "AuditFinding"("status");
CREATE INDEX IF NOT EXISTS "AuditFinding_severity_idx" ON "AuditFinding"("severity");

CREATE TABLE IF NOT EXISTS "AuditWorkpaper" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "engagementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "workpaperType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "comments" JSONB,
    "crossReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditWorkpaper_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditWorkpaper_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "AuditEngagement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditWorkpaper_engagementId_idx" ON "AuditWorkpaper"("engagementId");
CREATE INDEX IF NOT EXISTS "AuditWorkpaper_workpaperType_idx" ON "AuditWorkpaper"("workpaperType");
CREATE INDEX IF NOT EXISTS "AuditWorkpaper_status_idx" ON "AuditWorkpaper"("status");

CREATE TABLE IF NOT EXISTS "AuditRequest" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "engagementId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Open',
    "response" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditRequest_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "AuditEngagement"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditRequest_engagementId_idx" ON "AuditRequest"("engagementId");
CREATE INDEX IF NOT EXISTS "AuditRequest_status_idx" ON "AuditRequest"("status");
CREATE INDEX IF NOT EXISTS "AuditRequest_priority_idx" ON "AuditRequest"("priority");
CREATE INDEX IF NOT EXISTS "AuditRequest_dueDate_idx" ON "AuditRequest"("dueDate");

-- ============================================================================
-- WORKFLOW BUILDER MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "GRCWorkflow" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowType" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "variables" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GRCWorkflow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GRCWorkflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "GRCWorkflow_organizationId_idx" ON "GRCWorkflow"("organizationId");
CREATE INDEX IF NOT EXISTS "GRCWorkflow_workflowType_idx" ON "GRCWorkflow"("workflowType");
CREATE INDEX IF NOT EXISTS "GRCWorkflow_status_idx" ON "GRCWorkflow"("status");

CREATE TABLE IF NOT EXISTS "WorkflowExecution" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "workflowId" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Running',
    "currentNodeId" TEXT,
    "completedNodes" JSONB,
    "nodeResults" JSONB,
    "variables" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "GRCWorkflow"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_startedAt_idx" ON "WorkflowExecution"("startedAt");

-- ============================================================================
-- MDM MODULE (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ManagedDevice" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "osVersion" TEXT,
    "serialNumber" TEXT,
    "imei" TEXT,
    "macAddress" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckIn" TIMESTAMP(3),
    "assignedUserId" TEXT,
    "assignedUserName" TEXT,
    "compliance" TEXT NOT NULL DEFAULT 'Unknown',
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "passcodeSet" BOOLEAN NOT NULL DEFAULT false,
    "jailbroken" BOOLEAN NOT NULL DEFAULT false,
    "vpnEnabled" BOOLEAN NOT NULL DEFAULT false,
    "antivirusInstalled" BOOLEAN NOT NULL DEFAULT false,
    "antivirusUpToDate" BOOLEAN NOT NULL DEFAULT false,
    "osUpToDate" BOOLEAN NOT NULL DEFAULT false,
    "firewallEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoUpdateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "screenLockTimeout" INTEGER,
    "installedApps" JSONB,
    "blockedApps" JSONB,
    "networkProfiles" JSONB,
    "location" JSONB,
    "batteryLevel" INTEGER,
    "storageUsed" DOUBLE PRECISION,
    "storageTotal" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "lastSecurityScan" TIMESTAMP(3),
    "policies" JSONB,
    "tags" TEXT[] DEFAULT '{}',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManagedDevice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ManagedDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ManagedDevice_organizationId_idx" ON "ManagedDevice"("organizationId");
CREATE INDEX IF NOT EXISTS "ManagedDevice_compliance_idx" ON "ManagedDevice"("compliance");
CREATE INDEX IF NOT EXISTS "ManagedDevice_status_idx" ON "ManagedDevice"("status");
CREATE INDEX IF NOT EXISTS "ManagedDevice_platform_idx" ON "ManagedDevice"("platform");
CREATE INDEX IF NOT EXISTS "ManagedDevice_assignedUserId_idx" ON "ManagedDevice"("assignedUserId");

CREATE TABLE IF NOT EXISTS "MDMPolicy" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "policyType" TEXT NOT NULL,
    "platform" TEXT[] DEFAULT '{}',
    "settings" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enforced" BOOLEAN NOT NULL DEFAULT true,
    "assignedGroups" JSONB,
    "assignedDeviceCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MDMPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MDMPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MDMPolicy_organizationId_idx" ON "MDMPolicy"("organizationId");
CREATE INDEX IF NOT EXISTS "MDMPolicy_policyType_idx" ON "MDMPolicy"("policyType");
CREATE INDEX IF NOT EXISTS "MDMPolicy_status_idx" ON "MDMPolicy"("status");

CREATE TABLE IF NOT EXISTS "DeviceAction" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "deviceId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "result" JSONB,
    "error" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceAction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DeviceAction_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "ManagedDevice"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DeviceAction_deviceId_idx" ON "DeviceAction"("deviceId");
CREATE INDEX IF NOT EXISTS "DeviceAction_actionType_idx" ON "DeviceAction"("actionType");
CREATE INDEX IF NOT EXISTS "DeviceAction_status_idx" ON "DeviceAction"("status");

CREATE TABLE IF NOT EXISTS "DeviceComplianceCheck" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "deviceId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "details" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceComplianceCheck_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DeviceComplianceCheck_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "ManagedDevice"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DeviceComplianceCheck_deviceId_idx" ON "DeviceComplianceCheck"("deviceId");
CREATE INDEX IF NOT EXISTS "DeviceComplianceCheck_checkType_idx" ON "DeviceComplianceCheck"("checkType");
CREATE INDEX IF NOT EXISTS "DeviceComplianceCheck_checkedAt_idx" ON "DeviceComplianceCheck"("checkedAt");

-- ============================================================================
-- SOX COMPLIANCE MODULE (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SOXControl" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "controlNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assertion" TEXT[] DEFAULT '{}',
    "processArea" TEXT NOT NULL,
    "controlType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "automationType" TEXT NOT NULL DEFAULT 'Manual',
    "owner" TEXT NOT NULL,
    "reviewer" TEXT,
    "materialityThreshold" DOUBLE PRECISION,
    "keyControl" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NotTested',
    "lastTestDate" TIMESTAMP(3),
    "nextTestDate" TIMESTAMP(3),
    "deficiencyType" TEXT,
    "evidence" JSONB,
    "walkthrough" JSONB,
    "riskOfMaterialMisstatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SOXControl_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SOXControl_organizationId_controlNumber_key" UNIQUE ("organizationId", "controlNumber"),
    CONSTRAINT "SOXControl_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOXControl_organizationId_idx" ON "SOXControl"("organizationId");
CREATE INDEX IF NOT EXISTS "SOXControl_category_idx" ON "SOXControl"("category");
CREATE INDEX IF NOT EXISTS "SOXControl_processArea_idx" ON "SOXControl"("processArea");
CREATE INDEX IF NOT EXISTS "SOXControl_status_idx" ON "SOXControl"("status");
CREATE INDEX IF NOT EXISTS "SOXControl_keyControl_idx" ON "SOXControl"("keyControl");

CREATE TABLE IF NOT EXISTS "SOXTestResult" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "controlId" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tester" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "sampleSize" INTEGER,
    "exceptionsFound" INTEGER NOT NULL DEFAULT 0,
    "testProcedure" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "evidence" JSONB,
    "deficiencyLevel" TEXT,
    "compensatingControls" JSONB,
    "managementResponse" TEXT,
    "remediationDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "reviewedBy" TEXT,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SOXTestResult_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SOXTestResult_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "SOXControl"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOXTestResult_controlId_idx" ON "SOXTestResult"("controlId");
CREATE INDEX IF NOT EXISTS "SOXTestResult_testDate_idx" ON "SOXTestResult"("testDate");
CREATE INDEX IF NOT EXISTS "SOXTestResult_conclusion_idx" ON "SOXTestResult"("conclusion");

CREATE TABLE IF NOT EXISTS "SOXAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "assessmentYear" INTEGER NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'InProgress',
    "overallConclusion" TEXT,
    "scopedProcesses" JSONB,
    "materialAccounts" JSONB,
    "significantLocations" JSONB,
    "riskAssessment" JSONB,
    "managementCertification" JSONB,
    "auditorAttestation" JSONB,
    "filingDeadline" TIMESTAMP(3),
    "filedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SOXAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SOXAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SOXAssessment_organizationId_idx" ON "SOXAssessment"("organizationId");
CREATE INDEX IF NOT EXISTS "SOXAssessment_assessmentYear_idx" ON "SOXAssessment"("assessmentYear");
CREATE INDEX IF NOT EXISTS "SOXAssessment_status_idx" ON "SOXAssessment"("status");

-- ============================================================================
-- SOD ANALYSIS MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SoDRule" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "function1" TEXT NOT NULL,
    "function2" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'High',
    "system" TEXT,
    "mitigatingControl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SoDRule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoDRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SoDRule_organizationId_idx" ON "SoDRule"("organizationId");
CREATE INDEX IF NOT EXISTS "SoDRule_ruleType_idx" ON "SoDRule"("ruleType");
CREATE INDEX IF NOT EXISTS "SoDRule_riskLevel_idx" ON "SoDRule"("riskLevel");

CREATE TABLE IF NOT EXISTS "SoDViolation" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "conflictingRoles" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "riskLevel" TEXT NOT NULL,
    "mitigationAction" TEXT,
    "mitigatedBy" TEXT,
    "mitigatedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "acceptanceReason" TEXT,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SoDViolation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SoDViolation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "SoDViolation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "SoDRule"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SoDViolation_organizationId_idx" ON "SoDViolation"("organizationId");
CREATE INDEX IF NOT EXISTS "SoDViolation_ruleId_idx" ON "SoDViolation"("ruleId");
CREATE INDEX IF NOT EXISTS "SoDViolation_status_idx" ON "SoDViolation"("status");
CREATE INDEX IF NOT EXISTS "SoDViolation_userId_idx" ON "SoDViolation"("userId");

-- ============================================================================
-- PRIVACY MANAGEMENT MODULE (6 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DSARRequest" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "dataSubjectName" TEXT NOT NULL,
    "dataSubjectEmail" TEXT NOT NULL,
    "dataSubjectPhone" TEXT,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "identityVerifiedAt" TIMESTAMP(3),
    "identityVerifiedBy" TEXT,
    "verificationMethod" TEXT,
    "regulation" TEXT NOT NULL DEFAULT 'GDPR',
    "jurisdiction" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Received',
    "assignedTo" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "dataCategories" JSONB,
    "systemsSearched" JSONB,
    "dataFound" JSONB,
    "responseMethod" TEXT,
    "responseDetails" TEXT,
    "responseAttachments" JSONB,
    "extensionApplied" BOOLEAN NOT NULL DEFAULT false,
    "extensionReason" TEXT,
    "extensionDueDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "auditTrail" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DSARRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DSARRequest_requestNumber_key" UNIQUE ("requestNumber"),
    CONSTRAINT "DSARRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DSARRequest_organizationId_idx" ON "DSARRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "DSARRequest_requestType_idx" ON "DSARRequest"("requestType");
CREATE INDEX IF NOT EXISTS "DSARRequest_status_idx" ON "DSARRequest"("status");
CREATE INDEX IF NOT EXISTS "DSARRequest_dataSubjectEmail_idx" ON "DSARRequest"("dataSubjectEmail");
CREATE INDEX IF NOT EXISTS "DSARRequest_dueDate_idx" ON "DSARRequest"("dueDate");
CREATE INDEX IF NOT EXISTS "DSARRequest_requestNumber_idx" ON "DSARRequest"("requestNumber");

CREATE TABLE IF NOT EXISTS "ConsentRecord" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "dataSubjectId" TEXT NOT NULL,
    "dataSubjectEmail" TEXT,
    "consentType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "consentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentExpiry" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalMethod" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "policyVersion" TEXT,
    "proofOfConsent" JSONB,
    "granularity" JSONB,
    "doubleOptIn" BOOLEAN NOT NULL DEFAULT false,
    "doubleOptInDate" TIMESTAMP(3),
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConsentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ConsentRecord_organizationId_idx" ON "ConsentRecord"("organizationId");
CREATE INDEX IF NOT EXISTS "ConsentRecord_dataSubjectId_idx" ON "ConsentRecord"("dataSubjectId");
CREATE INDEX IF NOT EXISTS "ConsentRecord_consentType_idx" ON "ConsentRecord"("consentType");
CREATE INDEX IF NOT EXISTS "ConsentRecord_consentGiven_idx" ON "ConsentRecord"("consentGiven");
CREATE INDEX IF NOT EXISTS "ConsentRecord_dataSubjectEmail_idx" ON "ConsentRecord"("dataSubjectEmail");

CREATE TABLE IF NOT EXISTS "ConsentPreference" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "dataSubjectId" TEXT NOT NULL,
    "dataSubjectEmail" TEXT,
    "preferences" JSONB NOT NULL,
    "marketingOptOut" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptOutDate" TIMESTAMP(3),
    "communicationChannels" JSONB,
    "doNotSell" BOOLEAN NOT NULL DEFAULT false,
    "doNotShare" BOOLEAN NOT NULL DEFAULT false,
    "limitUse" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentPreference_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConsentPreference_organizationId_dataSubjectId_key" UNIQUE ("organizationId", "dataSubjectId"),
    CONSTRAINT "ConsentPreference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ConsentPreference_organizationId_idx" ON "ConsentPreference"("organizationId");
CREATE INDEX IF NOT EXISTS "ConsentPreference_dataSubjectId_idx" ON "ConsentPreference"("dataSubjectId");
CREATE INDEX IF NOT EXISTS "ConsentPreference_marketingOptOut_idx" ON "ConsentPreference"("marketingOptOut");

CREATE TABLE IF NOT EXISTS "DataDeletionRequest" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "dataCategories" JSONB,
    "systemsAffected" JSONB,
    "deletionLog" JSONB,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "retentionOverride" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "verificationRequired" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DataDeletionRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_organizationId_idx" ON "DataDeletionRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_requestType_idx" ON "DataDeletionRequest"("requestType");
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_status_idx" ON "DataDeletionRequest"("status");
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_requestedByEmail_idx" ON "DataDeletionRequest"("requestedByEmail");

CREATE TABLE IF NOT EXISTS "ProcessingRestriction" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "dataSubjectId" TEXT NOT NULL,
    "dataSubjectEmail" TEXT,
    "restrictionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "affectedSystems" JSONB,
    "affectedProcesses" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "liftedBy" TEXT,
    "liftedAt" TIMESTAMP(3),
    "liftReason" TEXT,
    "notifiedParties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessingRestriction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProcessingRestriction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProcessingRestriction_organizationId_idx" ON "ProcessingRestriction"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcessingRestriction_dataSubjectId_idx" ON "ProcessingRestriction"("dataSubjectId");
CREATE INDEX IF NOT EXISTS "ProcessingRestriction_status_idx" ON "ProcessingRestriction"("status");
CREATE INDEX IF NOT EXISTS "ProcessingRestriction_restrictionType_idx" ON "ProcessingRestriction"("restrictionType");

CREATE TABLE IF NOT EXISTS "RetentionPolicy" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataCategory" TEXT NOT NULL,
    "retentionPeriod" INTEGER NOT NULL,
    "legalBasis" TEXT,
    "regulation" TEXT,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "autoDeleteWarningDays" INTEGER NOT NULL DEFAULT 30,
    "reviewFrequency" TEXT NOT NULL DEFAULT 'Annual',
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "appliedToSystems" JSONB,
    "exceptions" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RetentionPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RetentionPolicy_organizationId_idx" ON "RetentionPolicy"("organizationId");
CREATE INDEX IF NOT EXISTS "RetentionPolicy_dataCategory_idx" ON "RetentionPolicy"("dataCategory");
CREATE INDEX IF NOT EXISTS "RetentionPolicy_status_idx" ON "RetentionPolicy"("status");

CREATE TABLE IF NOT EXISTS "RetentionEnforcement" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "policyId" TEXT NOT NULL,
    "executionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsEvaluated" INTEGER NOT NULL DEFAULT 0,
    "recordsDeleted" INTEGER NOT NULL DEFAULT 0,
    "recordsArchived" INTEGER NOT NULL DEFAULT 0,
    "recordsExempted" INTEGER NOT NULL DEFAULT 0,
    "exemptionReasons" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "error" TEXT,
    "executedBy" TEXT NOT NULL,
    "auditLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RetentionEnforcement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RetentionEnforcement_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "RetentionPolicy"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RetentionEnforcement_policyId_idx" ON "RetentionEnforcement"("policyId");
CREATE INDEX IF NOT EXISTS "RetentionEnforcement_executionDate_idx" ON "RetentionEnforcement"("executionDate");
CREATE INDEX IF NOT EXISTS "RetentionEnforcement_status_idx" ON "RetentionEnforcement"("status");

-- ============================================================================
-- DATA TRANSFER MODULE (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SCCTemplate" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '2021',
    "moduleSelected" TEXT[] DEFAULT '{}',
    "dataExporter" JSONB NOT NULL,
    "dataImporter" JSONB NOT NULL,
    "transferDescription" JSONB NOT NULL,
    "technicalMeasures" JSONB,
    "organizationalMeasures" JSONB,
    "supervisoryAuthority" TEXT,
    "governingLaw" TEXT,
    "annexes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "executedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "signedByExporter" TEXT,
    "signedByImporter" TEXT,
    "tiaCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SCCTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SCCTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SCCTemplate_organizationId_idx" ON "SCCTemplate"("organizationId");
CREATE INDEX IF NOT EXISTS "SCCTemplate_templateType_idx" ON "SCCTemplate"("templateType");
CREATE INDEX IF NOT EXISTS "SCCTemplate_status_idx" ON "SCCTemplate"("status");

CREATE TABLE IF NOT EXISTS "TIAAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "sccTemplateId" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "adequacyDecision" BOOLEAN NOT NULL DEFAULT false,
    "legalFramework" JSONB,
    "governmentAccess" JSONB,
    "dataSurveillance" JSONB,
    "effectiveRemedies" JSONB,
    "supplementaryMeasures" JSONB,
    "overallRisk" TEXT NOT NULL DEFAULT 'Medium',
    "conclusion" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TIAAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TIAAssessment_sccTemplateId_key" UNIQUE ("sccTemplateId"),
    CONSTRAINT "TIAAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
    CONSTRAINT "TIAAssessment_sccTemplateId_fkey" FOREIGN KEY ("sccTemplateId") REFERENCES "SCCTemplate"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "TIAAssessment_organizationId_idx" ON "TIAAssessment"("organizationId");
CREATE INDEX IF NOT EXISTS "TIAAssessment_destinationCountry_idx" ON "TIAAssessment"("destinationCountry");
CREATE INDEX IF NOT EXISTS "TIAAssessment_overallRisk_idx" ON "TIAAssessment"("overallRisk");

CREATE TABLE IF NOT EXISTS "BCRProgram" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bcrType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "leadDPA" TEXT,
    "concernedDPAs" JSONB,
    "groupEntities" JSONB NOT NULL,
    "dataCategories" JSONB,
    "transferPurposes" JSONB,
    "bindingCommitments" JSONB,
    "dataProtectionPrinciples" JSONB,
    "rightsOfDataSubjects" JSONB,
    "securityMeasures" JSONB,
    "complianceAuditPlan" JSONB,
    "trainingProgram" JSONB,
    "complaintMechanism" JSONB,
    "cooperationWithDPAs" JSONB,
    "approvalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "lastAuditDate" TIMESTAMP(3),
    "nextAuditDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BCRProgram_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BCRProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BCRProgram_organizationId_idx" ON "BCRProgram"("organizationId");
CREATE INDEX IF NOT EXISTS "BCRProgram_bcrType_idx" ON "BCRProgram"("bcrType");
CREATE INDEX IF NOT EXISTS "BCRProgram_status_idx" ON "BCRProgram"("status");

-- ============================================================================
-- AI TRANSPARENCY MODULE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AITransparencyNotice" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aiSystemName" TEXT NOT NULL,
    "systemDescription" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "dataUsed" JSONB NOT NULL,
    "decisionTypes" TEXT[] DEFAULT '{}',
    "humanOversight" TEXT NOT NULL,
    "logicExplanation" TEXT NOT NULL,
    "significance" TEXT NOT NULL,
    "rightToObjection" BOOLEAN NOT NULL DEFAULT true,
    "rightToHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "contactInfo" TEXT,
    "publishedUrl" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "effectiveDate" TIMESTAMP(3),
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AITransparencyNotice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AITransparencyNotice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AITransparencyNotice_organizationId_idx" ON "AITransparencyNotice"("organizationId");
CREATE INDEX IF NOT EXISTS "AITransparencyNotice_status_idx" ON "AITransparencyNotice"("status");

CREATE TABLE IF NOT EXISTS "JITPrivacyNotice" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerContext" TEXT NOT NULL,
    "noticeContent" TEXT NOT NULL,
    "shortNotice" TEXT,
    "dataCollected" JSONB NOT NULL,
    "purposes" TEXT[] DEFAULT '{}',
    "legalBasis" TEXT NOT NULL,
    "retentionPeriod" TEXT,
    "thirdPartyRecipients" JSONB,
    "dataSubjectRights" JSONB,
    "contactInfo" TEXT,
    "displayType" TEXT NOT NULL DEFAULT 'Banner',
    "position" TEXT NOT NULL DEFAULT 'Bottom',
    "requiresAction" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "language" TEXT NOT NULL DEFAULT 'en',
    "translations" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "acceptances" INTEGER NOT NULL DEFAULT 0,
    "dismissals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JITPrivacyNotice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JITPrivacyNotice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "JITPrivacyNotice_organizationId_idx" ON "JITPrivacyNotice"("organizationId");
CREATE INDEX IF NOT EXISTS "JITPrivacyNotice_triggerContext_idx" ON "JITPrivacyNotice"("triggerContext");
CREATE INDEX IF NOT EXISTS "JITPrivacyNotice_status_idx" ON "JITPrivacyNotice"("status");

-- ============================================================================
-- AZURE SYNC MODULE (6 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AzureResource" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "azureResourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "resourceGroup" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "tags" JSONB,
    "provisioningState" TEXT,
    "sku" JSONB,
    "kind" TEXT,
    "managedBy" TEXT,
    "properties" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AzureResource_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AzureResource_organizationId_azureResourceId_key" UNIQUE ("organizationId", "azureResourceId"),
    CONSTRAINT "AzureResource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AzureResource_organizationId_idx" ON "AzureResource"("organizationId");
CREATE INDEX IF NOT EXISTS "AzureResource_resourceType_idx" ON "AzureResource"("resourceType");
CREATE INDEX IF NOT EXISTS "AzureResource_subscriptionId_idx" ON "AzureResource"("subscriptionId");

CREATE TABLE IF NOT EXISTS "AzureSecurityFinding" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "azureFindingId" TEXT NOT NULL,
    "resourceId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "remediationSteps" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "firstDetected" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3),
    "properties" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AzureSecurityFinding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AzureSecurityFinding_organizationId_azureFindingId_key" UNIQUE ("organizationId", "azureFindingId"),
    CONSTRAINT "AzureSecurityFinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AzureSecurityFinding_organizationId_idx" ON "AzureSecurityFinding"("organizationId");
CREATE INDEX IF NOT EXISTS "AzureSecurityFinding_severity_idx" ON "AzureSecurityFinding"("severity");
CREATE INDEX IF NOT EXISTS "AzureSecurityFinding_status_idx" ON "AzureSecurityFinding"("status");

CREATE TABLE IF NOT EXISTS "AzureSecurityAlert" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "azureAlertId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "compromisedEntity" TEXT,
    "intent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "timeGenerated" TIMESTAMP(3),
    "processingEndTime" TIMESTAMP(3),
    "remediation" TEXT,
    "properties" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AzureSecurityAlert_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AzureSecurityAlert_organizationId_azureAlertId_key" UNIQUE ("organizationId", "azureAlertId"),
    CONSTRAINT "AzureSecurityAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AzureSecurityAlert_organizationId_idx" ON "AzureSecurityAlert"("organizationId");
CREATE INDEX IF NOT EXISTS "AzureSecurityAlert_severity_idx" ON "AzureSecurityAlert"("severity");
CREATE INDEX IF NOT EXISTS "AzureSecurityAlert_status_idx" ON "AzureSecurityAlert"("status");

CREATE TABLE IF NOT EXISTS "AzurePolicyCompliance" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "policyAssignmentId" TEXT NOT NULL,
    "policyDefinitionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT,
    "complianceState" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "resourceLocation" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "properties" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AzurePolicyCompliance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AzurePolicyCompliance_organizationId_policyAssignmentId_resoukey" UNIQUE ("organizationId", "policyAssignmentId", "resourceId"),
    CONSTRAINT "AzurePolicyCompliance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AzurePolicyCompliance_organizationId_idx" ON "AzurePolicyCompliance"("organizationId");
CREATE INDEX IF NOT EXISTS "AzurePolicyCompliance_complianceState_idx" ON "AzurePolicyCompliance"("complianceState");
CREATE INDEX IF NOT EXISTS "AzurePolicyCompliance_subscriptionId_idx" ON "AzurePolicyCompliance"("subscriptionId");

CREATE TABLE IF NOT EXISTS "AzureUser" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "azureUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "userPrincipalName" TEXT NOT NULL,
    "mail" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "accountEnabled" BOOLEAN NOT NULL DEFAULT true,
    "userType" TEXT,
    "createdDateTime" TIMESTAMP(3),
    "lastSignInDateTime" TIMESTAMP(3),
    "assignedLicenses" JSONB,
    "memberOf" JSONB,
    "properties" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AzureUser_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AzureUser_organizationId_azureUserId_key" UNIQUE ("organizationId", "azureUserId"),
    CONSTRAINT "AzureUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AzureUser_organizationId_idx" ON "AzureUser"("organizationId");
CREATE INDEX IF NOT EXISTS "AzureUser_accountEnabled_idx" ON "AzureUser"("accountEnabled");
CREATE INDEX IF NOT EXISTS "AzureUser_userPrincipalName_idx" ON "AzureUser"("userPrincipalName");

CREATE TABLE IF NOT EXISTS "AzureSyncJob" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "resourcesSynced" INTEGER NOT NULL DEFAULT 0,
    "findingsSynced" INTEGER NOT NULL DEFAULT 0,
    "alertsSynced" INTEGER NOT NULL DEFAULT 0,
    "usersSynced" INTEGER NOT NULL DEFAULT 0,
    "policiesSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AzureSyncJob_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AzureSyncJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AzureSyncJob_organizationId_idx" ON "AzureSyncJob"("organizationId");
CREATE INDEX IF NOT EXISTS "AzureSyncJob_status_idx" ON "AzureSyncJob"("status");
CREATE INDEX IF NOT EXISTS "AzureSyncJob_startedAt_idx" ON "AzureSyncJob"("startedAt");

-- ============================================================================
-- END OF MIGRATION
-- Total tables created: 59
-- ============================================================================
