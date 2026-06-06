-- Enhancement Modules Migration
-- Adds 25+ new tables for visionary GRC platform features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Incident Management ───────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentSeverity') THEN CREATE TYPE "IncidentSeverity" AS ENUM ('SEV1', 'SEV2', 'SEV3', 'SEV4'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentStatus') THEN CREATE TYPE "IncidentStatus" AS ENUM ('DETECTED', 'TRIAGED', 'CONTAINED', 'ERADICATED', 'RECOVERED', 'CLOSED', 'POST_MORTEM'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentCategory') THEN CREATE TYPE "IncidentCategory" AS ENUM ('DATA_BREACH', 'MALWARE', 'PHISHING', 'UNAUTHORIZED_ACCESS', 'DDOS', 'INSIDER_THREAT', 'SYSTEM_FAILURE', 'POLICY_VIOLATION', 'PHYSICAL_SECURITY', 'OTHER'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "Incident" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "IncidentSeverity" NOT NULL,
  "status" "IncidentStatus" NOT NULL DEFAULT 'DETECTED',
  "category" "IncidentCategory" NOT NULL,
  "reportedBy" TEXT NOT NULL,
  "assignedTo" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "containedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "rootCause" TEXT,
  "impact" TEXT,
  "lessonsLearned" TEXT,
  "affectedSystems" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "affectedControls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Incident_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Incident_organizationId_idx" ON "Incident"("organizationId");
CREATE INDEX IF NOT EXISTS "Incident_severity_idx" ON "Incident"("severity");
CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status");

CREATE TABLE IF NOT EXISTS "IncidentTimelineEntry" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "incidentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentTimelineEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IncidentTimelineEntry_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IncidentTimelineEntry_incidentId_idx" ON "IncidentTimelineEntry"("incidentId");

CREATE TABLE IF NOT EXISTS "IncidentTask" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "incidentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "assignee" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "IncidentTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IncidentTask_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IncidentTask_incidentId_idx" ON "IncidentTask"("incidentId");

-- ── IT Asset Management ───────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetType') THEN CREATE TYPE "AssetType" AS ENUM ('HARDWARE', 'SOFTWARE', 'DATA', 'NETWORK', 'CLOUD_SERVICE', 'PEOPLE', 'FACILITY'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DataClassification') THEN CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetStatus') THEN CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DECOMMISSIONED', 'IN_MAINTENANCE', 'PLANNED'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "Asset" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AssetType" NOT NULL,
  "category" TEXT,
  "owner" TEXT NOT NULL,
  "department" TEXT,
  "location" TEXT,
  "classification" "DataClassification" NOT NULL DEFAULT 'INTERNAL',
  "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "ipAddress" TEXT,
  "hostname" TEXT,
  "serialNumber" TEXT,
  "vendor" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "endOfLife" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Asset_organizationId_idx" ON "Asset"("organizationId");
CREATE INDEX IF NOT EXISTS "Asset_type_idx" ON "Asset"("type");
CREATE INDEX IF NOT EXISTS "Asset_classification_idx" ON "Asset"("classification");

-- ── Compliance Calendar ───────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeadlineType') THEN CREATE TYPE "DeadlineType" AS ENUM ('AUDIT_DATE', 'CERTIFICATION_RENEWAL', 'POLICY_REVIEW', 'RISK_REASSESSMENT', 'REGULATORY_FILING', 'TRAINING_DUE', 'EVIDENCE_REFRESH', 'VENDOR_REVIEW', 'BOARD_REPORT', 'INCIDENT_REPORT_DEADLINE', 'DSAR_RESPONSE', 'BREACH_NOTIFICATION', 'CUSTOM'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeadlineStatus') THEN CREATE TYPE "DeadlineStatus" AS ENUM ('UPCOMING', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'CANCELLED'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "ComplianceDeadline" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "DeadlineType" NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "frameworkId" TEXT,
  "controlId" TEXT,
  "assignedTo" TEXT,
  "status" "DeadlineStatus" NOT NULL DEFAULT 'UPCOMING',
  "reminderDays" INTEGER[] DEFAULT ARRAY[30, 14, 7, 1]::INTEGER[],
  "recurrence" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplianceDeadline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceDeadline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComplianceDeadline_organizationId_idx" ON "ComplianceDeadline"("organizationId");
CREATE INDEX IF NOT EXISTS "ComplianceDeadline_dueDate_idx" ON "ComplianceDeadline"("dueDate");
CREATE INDEX IF NOT EXISTS "ComplianceDeadline_status_idx" ON "ComplianceDeadline"("status");

-- ── GRC Maturity Assessment ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MaturityAssessment" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "overallLevel" INTEGER NOT NULL DEFAULT 1,
  "recommendations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaturityAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaturityAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MaturityAssessment_organizationId_idx" ON "MaturityAssessment"("organizationId");

CREATE TABLE IF NOT EXISTS "MaturityDomain" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "assessmentId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "currentLevel" INTEGER NOT NULL DEFAULT 1,
  "targetLevel" INTEGER NOT NULL DEFAULT 3,
  "gaps" JSONB,
  CONSTRAINT "MaturityDomain_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaturityDomain_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "MaturityAssessment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MaturityDomain_assessmentId_idx" ON "MaturityDomain"("assessmentId");

-- ── Business Impact Analysis ──────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Criticality') THEN CREATE TYPE "Criticality" AS ENUM ('MISSION_CRITICAL', 'BUSINESS_CRITICAL', 'IMPORTANT', 'STANDARD', 'LOW_PRIORITY'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DependencyType') THEN CREATE TYPE "DependencyType" AS ENUM ('INTERNAL_PROCESS', 'VENDOR_SERVICE', 'TECHNOLOGY', 'PERSONNEL', 'FACILITY'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "BusinessProcess" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "owner" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "criticality" "Criticality" NOT NULL DEFAULT 'STANDARD',
  "rto" INTEGER NOT NULL DEFAULT 24,
  "rpo" INTEGER NOT NULL DEFAULT 24,
  "mtpd" INTEGER NOT NULL DEFAULT 72,
  "impactAnalysis" JSONB,
  "assets" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessProcess_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessProcess_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BusinessProcess_organizationId_idx" ON "BusinessProcess"("organizationId");

CREATE TABLE IF NOT EXISTS "ProcessDependency" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "processId" TEXT NOT NULL,
  "dependsOn" TEXT NOT NULL,
  "type" "DependencyType" NOT NULL,
  "isCritical" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ProcessDependency_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProcessDependency_processId_fkey" FOREIGN KEY ("processId") REFERENCES "BusinessProcess"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProcessDependency_processId_idx" ON "ProcessDependency"("processId");

-- ── Control Effectiveness ─────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EffectivenessRating') THEN CREATE TYPE "EffectivenessRating" AS ENUM ('EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE', 'NOT_TESTED'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "ControlEffectivenessRecord" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "controlId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rating" "EffectivenessRating" NOT NULL,
  "testMethod" TEXT NOT NULL,
  "findings" TEXT,
  "assessedBy" TEXT NOT NULL,
  "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlEffectivenessRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ControlEffectivenessRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ControlEffectivenessRecord_organizationId_idx" ON "ControlEffectivenessRecord"("organizationId");
CREATE INDEX IF NOT EXISTS "ControlEffectivenessRecord_controlId_idx" ON "ControlEffectivenessRecord"("controlId");

-- ── Compliance Cost ───────────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostCategory') THEN CREATE TYPE "CostCategory" AS ENUM ('TOOL_LICENSE', 'CONSULTANT', 'AUDIT_FEE', 'TRAINING', 'PERSONNEL', 'REMEDIATION', 'INSURANCE', 'CERTIFICATION', 'LEGAL', 'OTHER'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "ComplianceCost" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "category" "CostCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "frameworkId" TEXT,
  "controlId" TEXT,
  "vendorId" TEXT,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplianceCost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceCost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComplianceCost_organizationId_idx" ON "ComplianceCost"("organizationId");
CREATE INDEX IF NOT EXISTS "ComplianceCost_category_idx" ON "ComplianceCost"("category");

-- ── Exception Management ──────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExceptionStatus') THEN CREATE TYPE "ExceptionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'RENEWED'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "ComplianceException" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "riskAcceptance" TEXT NOT NULL,
  "compensatingControls" TEXT,
  "requestedBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "status" "ExceptionStatus" NOT NULL DEFAULT 'REQUESTED',
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "reviewDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplianceException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceException_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComplianceException_organizationId_idx" ON "ComplianceException"("organizationId");
CREATE INDEX IF NOT EXISTS "ComplianceException_status_idx" ON "ComplianceException"("status");
CREATE INDEX IF NOT EXISTS "ComplianceException_expiryDate_idx" ON "ComplianceException"("expiryDate");

-- ── Certification Lifecycle ───────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CertStatus') THEN CREATE TYPE "CertStatus" AS ENUM ('CERT_ACTIVE', 'EXPIRING_SOON', 'CERT_EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CertAuditType') THEN CREATE TYPE "CertAuditType" AS ENUM ('INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "Certification" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "frameworkId" TEXT,
  "name" TEXT NOT NULL,
  "certBody" TEXT NOT NULL,
  "certNumber" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "status" "CertStatus" NOT NULL DEFAULT 'CERT_ACTIVE',
  "scope" TEXT,
  "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Certification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Certification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Certification_organizationId_idx" ON "Certification"("organizationId");
CREATE INDEX IF NOT EXISTS "Certification_expiryDate_idx" ON "Certification"("expiryDate");

CREATE TABLE IF NOT EXISTS "CertAudit" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "certificationId" TEXT NOT NULL,
  "type" "CertAuditType" NOT NULL,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "completedDate" TIMESTAMP(3),
  "auditorName" TEXT,
  "findings" JSONB,
  "result" TEXT,
  CONSTRAINT "CertAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CertAudit_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CertAudit_certificationId_idx" ON "CertAudit"("certificationId");

-- ── Regulatory Change Detection ───────────────────────────────────
-- RegulatoryChangeDetection is an intentionally GLOBAL, cross-tenant shared
-- regulatory feed: it has no organizationId, no Organization FK, and no
-- org_isolation RLS policy by design. The regulationName / title / summary /
-- sourceUrl / impactAnalysis columns describe published regulations and must
-- never contain tenant-private data — they are visible to all tenants. The
-- per-tenant interpretation lives in the org-scoped child table
-- RegulatoryChangeImpact (organizationId + Organization FK + RLS). If a future
-- requirement makes any RegulatoryChangeDetection row tenant-private, add an
-- organizationId column, an Organization FK, and an org_isolation RLS policy
-- instead of leaving it global.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegChangeType') THEN CREATE TYPE "RegChangeType" AS ENUM ('NEW_REGULATION', 'AMENDMENT', 'GUIDANCE', 'ENFORCEMENT', 'REPEAL'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegChangeStatus') THEN CREATE TYPE "RegChangeStatus" AS ENUM ('NEW', 'REVIEWING', 'IN_PROGRESS', 'REG_RESOLVED', 'DISMISSED'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "RegulatoryChangeDetection" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "regulationName" TEXT NOT NULL,
  "changeType" "RegChangeType" NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "impactAnalysis" JSONB,
  "status" "RegChangeStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatoryChangeDetection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RegulatoryChangeDetection_regulationName_idx" ON "RegulatoryChangeDetection"("regulationName");
CREATE INDEX IF NOT EXISTS "RegulatoryChangeDetection_status_idx" ON "RegulatoryChangeDetection"("status");

CREATE TABLE IF NOT EXISTS "RegulatoryChangeImpact" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "regulatoryChangeId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "impactLevel" TEXT NOT NULL,
  "requiredAction" TEXT NOT NULL,
  "status" "RegChangeStatus" NOT NULL DEFAULT 'NEW',
  CONSTRAINT "RegulatoryChangeImpact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RegulatoryChangeImpact_regulatoryChangeId_fkey" FOREIGN KEY ("regulatoryChangeId") REFERENCES "RegulatoryChangeDetection"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RegulatoryChangeImpact_regulatoryChangeId_idx" ON "RegulatoryChangeImpact"("regulatoryChangeId");

-- ── Evidence Collection Rules ─────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EvidenceSourceType') THEN CREATE TYPE "EvidenceSourceType" AS ENUM ('AWS_CONFIG', 'AZURE_POLICY', 'GITHUB_ACTIONS', 'JIRA_TICKETS', 'SLACK_MESSAGES', 'GOOGLE_DRIVE', 'CLOUDTRAIL_LOGS', 'VULNERABILITY_SCAN', 'PENETRATION_TEST', 'ACCESS_REVIEW', 'TRAINING_RECORDS', 'MANUAL_UPLOAD'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "EvidenceCollectionRule" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "integrationId" TEXT,
  "sourceType" "EvidenceSourceType" NOT NULL,
  "query" JSONB,
  "schedule" TEXT,
  "lastCollectedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EvidenceCollectionRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EvidenceCollectionRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "EvidenceCollectionRule_organizationId_idx" ON "EvidenceCollectionRule"("organizationId");

-- ── Control Testing ───────────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ControlTestType') THEN CREATE TYPE "ControlTestType" AS ENUM ('ACCESS_REVIEW_TEST', 'CONFIGURATION_CHECK', 'VULNERABILITY_SCAN_TEST', 'POLICY_REVIEW_TEST', 'LOG_REVIEW', 'ENCRYPTION_CHECK', 'BACKUP_VERIFICATION', 'INCIDENT_RESPONSE_TEST', 'CHANGE_MANAGEMENT_REVIEW', 'NETWORK_SEGMENTATION_CHECK'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TestResultStatus') THEN CREATE TYPE "TestResultStatus" AS ENUM ('PASS', 'FAIL', 'PARTIAL', 'ERROR', 'SKIPPED'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "ControlTest" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "testType" "ControlTestType" NOT NULL,
  "testConfig" JSONB,
  "schedule" TEXT,
  "lastRunAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ControlTest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ControlTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ControlTest_organizationId_idx" ON "ControlTest"("organizationId");

CREATE TABLE IF NOT EXISTS "ControlTestResult" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "testId" TEXT NOT NULL,
  "status" "TestResultStatus" NOT NULL,
  "details" JSONB,
  "evidence" TEXT,
  "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlTestResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ControlTestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ControlTest"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ControlTestResult_testId_idx" ON "ControlTestResult"("testId");

-- ── SSO Configuration ─────────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SSOProvider') THEN CREATE TYPE "SSOProvider" AS ENUM ('SAML', 'OIDC', 'AZURE_AD', 'OKTA', 'GOOGLE_WORKSPACE', 'ONELOGIN', 'PING_IDENTITY'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "SSOConfiguration" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "provider" "SSOProvider" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "entityId" TEXT,
  "ssoUrl" TEXT,
  -- encrypted-at-rest: persisted via encryptField() in the SSO service layer before insert
  "certificate" TEXT,
  "metadataUrl" TEXT,
  "attributeMapping" JSONB,
  "defaultRole" TEXT NOT NULL DEFAULT 'viewer',
  "autoProvision" BOOLEAN NOT NULL DEFAULT true,
  "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SSOConfiguration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SSOConfiguration_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "SSOConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- ── SCIM Configuration ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SCIMConfiguration" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  -- encrypted-at-rest: persisted via encryptField() in the SCIM service layer before insert
  "bearerToken" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SCIMConfiguration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SCIMConfiguration_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "SCIMConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- ── Advanced RBAC ─────────────────────────────────────────────────
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PermissionScope') THEN CREATE TYPE "PermissionScope" AS ENUM ('OWN', 'TEAM', 'DEPARTMENT', 'ORG'); END IF; END $$;

CREATE TABLE IF NOT EXISTS "CustomRole" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomRole_organizationId_name_key" UNIQUE ("organizationId", "name"),
  CONSTRAINT "CustomRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "roleId" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "scope" "PermissionScope" NOT NULL DEFAULT 'OWN',
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RolePermission_roleId_resource_action_key" UNIQUE ("roleId", "resource", "action"),
  CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RolePermission_roleId_idx" ON "RolePermission"("roleId");

CREATE TABLE IF NOT EXISTS "UserRole" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserRole_userId_roleId_key" UNIQUE ("userId", "roleId"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX IF NOT EXISTS "UserRole_roleId_idx" ON "UserRole"("roleId");

-- ── Branding / White-Labeling ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BrandingConfig" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "logoUrl" TEXT,
  "faviconUrl" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
  "secondaryColor" TEXT NOT NULL DEFAULT '#1E40AF',
  "accentColor" TEXT NOT NULL DEFAULT '#10B981',
  "companyName" TEXT,
  "customDomain" TEXT,
  "customCSS" TEXT,
  "emailTemplate" JSONB,
  "loginPageHtml" TEXT,
  "footerText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BrandingConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BrandingConfig_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "BrandingConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- ── Custom Dashboards ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CustomDashboard" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isShared" BOOLEAN NOT NULL DEFAULT false,
  "layout" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomDashboard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomDashboard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CustomDashboard_organizationId_idx" ON "CustomDashboard"("organizationId");

CREATE TABLE IF NOT EXISTS "DashboardWidget" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "dashboardId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "config" JSONB,
  "position" JSONB,
  CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DashboardWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "CustomDashboard"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DashboardWidget_dashboardId_idx" ON "DashboardWidget"("dashboardId");

-- ── Report Builder ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReportTemplate" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sections" JSONB,
  "filters" JSONB,
  "schedule" TEXT,
  "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "format" TEXT NOT NULL DEFAULT 'PDF',
  "lastGeneratedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReportTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ReportTemplate_organizationId_idx" ON "ReportTemplate"("organizationId");

-- ── CI/CD Gates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CICDGatePolicy" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "rules" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CICDGatePolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CICDGatePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CICDGatePolicy_organizationId_idx" ON "CICDGatePolicy"("organizationId");

CREATE TABLE IF NOT EXISTS "CICDGateResult" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "policyId" TEXT NOT NULL,
  "repository" TEXT NOT NULL,
  "branch" TEXT NOT NULL,
  "commitHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "details" JSONB,
  "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CICDGateResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CICDGateResult_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "CICDGatePolicy"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CICDGateResult_policyId_idx" ON "CICDGateResult"("policyId");

-- ── Search Index ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SearchIndex" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SearchIndex_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SearchIndex_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SearchIndex_organizationId_resourceType_idx" ON "SearchIndex"("organizationId", "resourceType");

-- ── Vendor Monitoring ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "VendorMonitoringCheck" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "checkType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "details" JSONB,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorMonitoringCheck_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VendorMonitoringCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "VendorMonitoringCheck_organizationId_idx" ON "VendorMonitoringCheck"("organizationId");
CREATE INDEX IF NOT EXISTS "VendorMonitoringCheck_vendorId_idx" ON "VendorMonitoringCheck"("vendorId");

-- Add full-text search support
ALTER TABLE "SearchIndex" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
CREATE INDEX IF NOT EXISTS "SearchIndex_search_vector_idx" ON "SearchIndex" USING gin("search_vector");

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION search_index_update_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS search_index_vector_update ON "SearchIndex";
CREATE TRIGGER search_index_vector_update
  BEFORE INSERT OR UPDATE ON "SearchIndex"
  FOR EACH ROW EXECUTE FUNCTION search_index_update_trigger();