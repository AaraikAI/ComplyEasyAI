-- ============================================
-- ComplyEasy AI - Complete Database Schema
-- For Supabase PostgreSQL
-- ============================================
-- Generated: December 8, 2025
-- Tables: 28 | Enums: 13
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "Role" AS ENUM (
  'admin',
  'editor',
  'viewer',
  'compliance_admin',
  'security_admin'
);

CREATE TYPE "ComplianceStatus" AS ENUM (
  'Compliant',
  'At_Risk',
  'Non_Compliant',
  'In_Review'
);

CREATE TYPE "RiskSeverity" AS ENUM (
  'Critical',
  'High',
  'Medium',
  'Low'
);

CREATE TYPE "RiskStatus" AS ENUM (
  'Open',
  'In_Progress',
  'Resolved',
  'Ignored',
  'Accepted'
);

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'active',
  'past_due',
  'canceled',
  'trialing'
);

CREATE TYPE "Plan" AS ENUM (
  'Basic',
  'Pro',
  'Enterprise'
);

CREATE TYPE "AccessReviewStatus" AS ENUM (
  'Pending',
  'In_Progress',
  'Completed',
  'Overdue'
);

CREATE TYPE "VendorRiskLevel" AS ENUM (
  'Critical',
  'High',
  'Medium',
  'Low'
);

CREATE TYPE "VendorStatus" AS ENUM (
  'Active',
  'Inactive',
  'Onboarding',
  'Offboarding',
  'Suspended'
);

CREATE TYPE "QuestionnaireStatus" AS ENUM (
  'Draft',
  'In_Progress',
  'Completed',
  'Reviewed',
  'Approved'
);

CREATE TYPE "IssueStatus" AS ENUM (
  'Open',
  'In_Progress',
  'Resolved',
  'Closed',
  'Reopened'
);

CREATE TYPE "IssuePriority" AS ENUM (
  'Critical',
  'High',
  'Medium',
  'Low'
);

CREATE TYPE "MonitorStatus" AS ENUM (
  'Passing',
  'Failing',
  'Warning',
  'Unknown'
);

-- ============================================
-- TABLE 1: Organization
-- ============================================

CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "plan" "Plan" NOT NULL DEFAULT 'Basic',
  "stripeCustomerId" TEXT UNIQUE,
  "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
  "parentOrganizationId" TEXT,
  "isParent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_parentOrganizationId_fkey"
    FOREIGN KEY ("parentOrganizationId")
    REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Organization_stripeCustomerId_idx" ON "Organization"("stripeCustomerId");
CREATE INDEX "Organization_parentOrganizationId_idx" ON "Organization"("parentOrganizationId");

-- ============================================
-- TABLE 2: User
-- ============================================

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'viewer',
  "avatar" TEXT,
  "passwordHash" TEXT,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "lastLogin" TIMESTAMP(3),
  "employeeId" TEXT UNIQUE,
  "department" TEXT,
  "jobTitle" TEXT,
  "manager" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret" TEXT,
  "twoFactorVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");

-- ============================================
-- TABLE 3: TwoFactorBackupCode
-- ============================================

CREATE TABLE "TwoFactorBackupCode" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "code" TEXT NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "TwoFactorBackupCode_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TwoFactorBackupCode_userId_idx" ON "TwoFactorBackupCode"("userId");
CREATE INDEX "TwoFactorBackupCode_code_idx" ON "TwoFactorBackupCode"("code");

-- ============================================
-- TABLE 4: Personnel
-- ============================================

CREATE TABLE "Personnel" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT UNIQUE NOT NULL,
  "organizationId" TEXT NOT NULL,
  "onboardingStatus" TEXT NOT NULL DEFAULT 'Not_Started',
  "onboardingDate" TIMESTAMP(3),
  "offboardingDate" TIMESTAMP(3),
  "offboardingReason" TEXT,
  "systemAccess" JSONB,
  "dataAccess" JSONB,
  "physicalAccess" JSONB,
  "backgroundCheck" BOOLEAN NOT NULL DEFAULT false,
  "backgroundCheckDate" TIMESTAMP(3),
  "securityTraining" BOOLEAN NOT NULL DEFAULT false,
  "trainingDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Personnel_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Personnel_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Personnel_organizationId_idx" ON "Personnel"("organizationId");
CREATE INDEX "Personnel_userId_idx" ON "Personnel"("userId");

-- ============================================
-- TABLE 5: AccessReview
-- ============================================

CREATE TABLE "AccessReview" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "personnelId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "status" "AccessReviewStatus" NOT NULL DEFAULT 'Pending',
  "dueDate" TIMESTAMP(3) NOT NULL,
  "completedDate" TIMESTAMP(3),
  "findings" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessReview_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessReview_personnelId_fkey"
    FOREIGN KEY ("personnelId")
    REFERENCES "Personnel"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "AccessReview_organizationId_idx" ON "AccessReview"("organizationId");
CREATE INDEX "AccessReview_personnelId_idx" ON "AccessReview"("personnelId");
CREATE INDEX "AccessReview_status_idx" ON "AccessReview"("status");

-- ============================================
-- TABLE 6: Vendor
-- ============================================

CREATE TABLE "Vendor" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "website" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "riskLevel" "VendorRiskLevel" NOT NULL DEFAULT 'Medium',
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "status" "VendorStatus" NOT NULL DEFAULT 'Onboarding',
  "category" TEXT,
  "serviceDescription" TEXT,
  "contractStart" TIMESTAMP(3),
  "contractEnd" TIMESTAMP(3),
  "annualSpend" DOUBLE PRECISION,
  "hasDataAccess" BOOLEAN NOT NULL DEFAULT false,
  "dataTypes" JSONB,
  "securityContact" TEXT,
  "lastSecurityReview" TIMESTAMP(3),
  "nextSecurityReview" TIMESTAMP(3),
  "soc2Report" BOOLEAN NOT NULL DEFAULT false,
  "iso27001Certified" BOOLEAN NOT NULL DEFAULT false,
  "gdprCompliant" BOOLEAN NOT NULL DEFAULT false,
  "hipaaBaa" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vendor_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Vendor_organizationId_idx" ON "Vendor"("organizationId");
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");
CREATE INDEX "Vendor_riskLevel_idx" ON "Vendor"("riskLevel");

-- ============================================
-- TABLE 7: VendorAssessment
-- ============================================

CREATE TABLE "VendorAssessment" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "vendorId" TEXT NOT NULL,
  "assessmentType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'In_Progress',
  "score" INTEGER,
  "riskLevel" "VendorRiskLevel",
  "findings" JSONB,
  "recommendations" TEXT,
  "assessedBy" TEXT,
  "assessedDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorAssessment_vendorId_fkey"
    FOREIGN KEY ("vendorId")
    REFERENCES "Vendor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VendorAssessment_vendorId_idx" ON "VendorAssessment"("vendorId");

-- ============================================
-- TABLE 8: VendorReview
-- ============================================

CREATE TABLE "VendorReview" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "vendorId" TEXT NOT NULL,
  "reviewType" TEXT NOT NULL,
  "reviewDate" TIMESTAMP(3) NOT NULL,
  "reviewer" TEXT NOT NULL,
  "findings" JSONB,
  "actionItems" JSONB,
  "nextReviewDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorReview_vendorId_fkey"
    FOREIGN KEY ("vendorId")
    REFERENCES "Vendor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VendorReview_vendorId_idx" ON "VendorReview"("vendorId");

-- ============================================
-- TABLE 9: VendorMonitor
-- ============================================

CREATE TABLE "VendorMonitor" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "vendorId" TEXT NOT NULL,
  "monitorType" TEXT NOT NULL,
  "status" "MonitorStatus" NOT NULL DEFAULT 'Unknown',
  "lastCheck" TIMESTAMP(3),
  "findings" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorMonitor_vendorId_fkey"
    FOREIGN KEY ("vendorId")
    REFERENCES "Vendor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VendorMonitor_vendorId_idx" ON "VendorMonitor"("vendorId");
CREATE INDEX "VendorMonitor_status_idx" ON "VendorMonitor"("status");

-- ============================================
-- TABLE 10: RiskAssessment
-- ============================================

CREATE TABLE "RiskAssessment" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "assessmentType" TEXT NOT NULL,
  "scope" TEXT,
  "methodology" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "startDate" TIMESTAMP(3),
  "completedDate" TIMESTAMP(3),
  "overallRiskScore" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiskAssessment_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RiskAssessment_organizationId_idx" ON "RiskAssessment"("organizationId");
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- ============================================
-- TABLE 11: ComplianceFramework
-- ============================================

CREATE TABLE "ComplianceFramework" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "status" "ComplianceStatus" NOT NULL DEFAULT 'In_Review',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "nextAuditDate" TIMESTAMP(3) NOT NULL,
  "region" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "ComplianceFramework_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ComplianceFramework_organizationId_idx" ON "ComplianceFramework"("organizationId");
CREATE INDEX "ComplianceFramework_status_idx" ON "ComplianceFramework"("status");

-- ============================================
-- TABLE 12: FrameworkControl
-- ============================================

CREATE TABLE "FrameworkControl" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "evidence" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "frameworkId" TEXT NOT NULL,
  "mappedControls" JSONB,
  CONSTRAINT "FrameworkControl_frameworkId_fkey"
    FOREIGN KEY ("frameworkId")
    REFERENCES "ComplianceFramework"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FrameworkControl_frameworkId_idx" ON "FrameworkControl"("frameworkId");

-- ============================================
-- TABLE 13: RiskItem
-- ============================================

CREATE TABLE "RiskItem" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "severity" "RiskSeverity" NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "RiskStatus" NOT NULL DEFAULT 'Open',
  "likelihood" INTEGER NOT NULL DEFAULT 3,
  "impact" INTEGER NOT NULL DEFAULT 3,
  "riskScore" INTEGER,
  "aiPriorityScore" INTEGER,
  "aiRationale" TEXT,
  "mitigationPlan" TEXT,
  "remediationOwner" TEXT,
  "targetDate" TIMESTAMP(3),
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  "assignedToId" TEXT,
  "assessmentId" TEXT,
  CONSTRAINT "RiskItem_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RiskItem_assignedToId_fkey"
    FOREIGN KEY ("assignedToId")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "RiskItem_assessmentId_fkey"
    FOREIGN KEY ("assessmentId")
    REFERENCES "RiskAssessment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "RiskItem_organizationId_idx" ON "RiskItem"("organizationId");
CREATE INDEX "RiskItem_status_idx" ON "RiskItem"("status");
CREATE INDEX "RiskItem_severity_idx" ON "RiskItem"("severity");
CREATE INDEX "RiskItem_assignedToId_idx" ON "RiskItem"("assignedToId");
CREATE INDEX "RiskItem_assessmentId_idx" ON "RiskItem"("assessmentId");

-- ============================================
-- TABLE 14: Questionnaire
-- ============================================

CREATE TABLE "Questionnaire" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "questionnaireType" TEXT NOT NULL,
  "status" "QuestionnaireStatus" NOT NULL DEFAULT 'Draft',
  "requestedBy" TEXT,
  "requestDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
  "aiConfidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Questionnaire_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Questionnaire_organizationId_idx" ON "Questionnaire"("organizationId");
CREATE INDEX "Questionnaire_status_idx" ON "Questionnaire"("status");

-- ============================================
-- TABLE 15: QuestionnaireQuestion
-- ============================================

CREATE TABLE "QuestionnaireQuestion" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "questionnaireId" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "questionType" TEXT NOT NULL,
  "category" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "options" JSONB,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionnaireQuestion_questionnaireId_fkey"
    FOREIGN KEY ("questionnaireId")
    REFERENCES "Questionnaire"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuestionnaireQuestion_questionnaireId_idx" ON "QuestionnaireQuestion"("questionnaireId");

-- ============================================
-- TABLE 16: QuestionnaireResponse
-- ============================================

CREATE TABLE "QuestionnaireResponse" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "questionnaireId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "responseText" TEXT,
  "responseData" JSONB,
  "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
  "aiConfidence" DOUBLE PRECISION,
  "reviewedByHuman" BOOLEAN NOT NULL DEFAULT false,
  "attachments" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionnaireResponse_questionnaireId_fkey"
    FOREIGN KEY ("questionnaireId")
    REFERENCES "Questionnaire"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuestionnaireResponse_questionnaireId_idx" ON "QuestionnaireResponse"("questionnaireId");
CREATE INDEX "QuestionnaireResponse_questionId_idx" ON "QuestionnaireResponse"("questionId");

-- ============================================
-- TABLE 17: Policy
-- ============================================

CREATE TABLE "Policy" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "policyNumber" TEXT,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "category" TEXT NOT NULL,
  "framework" TEXT,
  "content" TEXT NOT NULL,
  "summary" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "owner" TEXT,
  "approver" TEXT,
  "approvalDate" TIMESTAMP(3),
  "effectiveDate" TIMESTAMP(3),
  "reviewDate" TIMESTAMP(3),
  "nextReviewDate" TIMESTAMP(3),
  "tags" JSONB,
  "relatedPolicies" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Policy_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Policy_organizationId_idx" ON "Policy"("organizationId");
CREATE INDEX "Policy_status_idx" ON "Policy"("status");
CREATE INDEX "Policy_framework_idx" ON "Policy"("framework");

-- ============================================
-- TABLE 18: TrustCertificate
-- ============================================

CREATE TABLE "TrustCertificate" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "certificateType" TEXT NOT NULL,
  "certificateNumber" TEXT,
  "issuer" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Valid',
  "documentUrl" TEXT,
  "publiclyVisible" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustCertificate_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TrustCertificate_organizationId_idx" ON "TrustCertificate"("organizationId");
CREATE INDEX "TrustCertificate_status_idx" ON "TrustCertificate"("status");

-- ============================================
-- TABLE 19: CustomReport
-- ============================================

CREATE TABLE "CustomReport" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "reportType" TEXT NOT NULL,
  "template" JSONB NOT NULL,
  "filters" JSONB,
  "schedule" JSONB,
  "lastGenerated" TIMESTAMP(3),
  "nextGeneration" TIMESTAMP(3),
  "recipients" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomReport_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CustomReport_organizationId_idx" ON "CustomReport"("organizationId");
CREATE INDEX "CustomReport_reportType_idx" ON "CustomReport"("reportType");

-- ============================================
-- TABLE 20: ContinuousMonitor
-- ============================================

CREATE TABLE "ContinuousMonitor" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "monitorType" TEXT NOT NULL,
  "integrationId" TEXT,
  "configuration" JSONB NOT NULL,
  "testScript" TEXT,
  "status" "MonitorStatus" NOT NULL DEFAULT 'Unknown',
  "lastRun" TIMESTAMP(3),
  "nextRun" TIMESTAMP(3),
  "frequency" TEXT NOT NULL DEFAULT 'Daily',
  "findings" JSONB,
  "alerts" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContinuousMonitor_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContinuousMonitor_organizationId_idx" ON "ContinuousMonitor"("organizationId");
CREATE INDEX "ContinuousMonitor_status_idx" ON "ContinuousMonitor"("status");
CREATE INDEX "ContinuousMonitor_monitorType_idx" ON "ContinuousMonitor"("monitorType");

-- ============================================
-- TABLE 21: MonitorResult
-- ============================================

CREATE TABLE "MonitorResult" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "monitorId" TEXT NOT NULL,
  "status" "MonitorStatus" NOT NULL,
  "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "passedTests" INTEGER NOT NULL DEFAULT 0,
  "failedTests" INTEGER NOT NULL DEFAULT 0,
  "findings" JSONB,
  "evidence" JSONB,
  "autoRemediated" BOOLEAN NOT NULL DEFAULT false,
  "remediationActions" JSONB,
  CONSTRAINT "MonitorResult_monitorId_fkey"
    FOREIGN KEY ("monitorId")
    REFERENCES "ContinuousMonitor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MonitorResult_monitorId_idx" ON "MonitorResult"("monitorId");
CREATE INDEX "MonitorResult_status_idx" ON "MonitorResult"("status");

-- ============================================
-- TABLE 22: Issue
-- ============================================

CREATE TABLE "Issue" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "issueType" TEXT NOT NULL,
  "category" TEXT,
  "priority" "IssuePriority" NOT NULL DEFAULT 'Medium',
  "status" "IssueStatus" NOT NULL DEFAULT 'Open',
  "assignedToId" TEXT,
  "createdById" TEXT NOT NULL,
  "slaTarget" TIMESTAMP(3),
  "slaStatus" TEXT,
  "remediationPlan" TEXT,
  "remediationSteps" JSONB,
  "dueDate" TIMESTAMP(3),
  "resolvedDate" TIMESTAMP(3),
  "closedDate" TIMESTAMP(3),
  "tags" JSONB,
  "attachments" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Issue_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Issue_assignedToId_fkey"
    FOREIGN KEY ("assignedToId")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Issue_createdById_fkey"
    FOREIGN KEY ("createdById")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Issue_organizationId_idx" ON "Issue"("organizationId");
CREATE INDEX "Issue_status_idx" ON "Issue"("status");
CREATE INDEX "Issue_priority_idx" ON "Issue"("priority");
CREATE INDEX "Issue_assignedToId_idx" ON "Issue"("assignedToId");

-- ============================================
-- TABLE 23: IssueComment
-- ============================================

CREATE TABLE "IssueComment" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "issueId" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IssueComment_issueId_fkey"
    FOREIGN KEY ("issueId")
    REFERENCES "Issue"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "IssueComment_issueId_idx" ON "IssueComment"("issueId");

-- ============================================
-- TABLE 24: AuditLog
-- ============================================

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "action" TEXT NOT NULL,
  "details" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "hash" TEXT UNIQUE NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT true,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  CONSTRAINT "AuditLog_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- ============================================
-- TABLE 25: Integration
-- ============================================

CREATE TABLE "Integration" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "connected" BOOLEAN NOT NULL DEFAULT false,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP(3),
  "lastSync" TIMESTAMP(3),
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "Integration_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE("organizationId", "provider")
);

CREATE INDEX "Integration_organizationId_idx" ON "Integration"("organizationId");

-- ============================================
-- TABLE 26: MagicLink
-- ============================================

CREATE TABLE "MagicLink" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "email" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MagicLink_email_idx" ON "MagicLink"("email");
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");
CREATE INDEX "MagicLink_expiresAt_idx" ON "MagicLink"("expiresAt");

-- ============================================
-- TABLE 27: FileUpload
-- ============================================

CREATE TABLE "FileUpload" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "s3Key" TEXT UNIQUE NOT NULL,
  "s3Bucket" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "FileUpload_organizationId_idx" ON "FileUpload"("organizationId");
CREATE INDEX "FileUpload_uploadedBy_idx" ON "FileUpload"("uploadedBy");
CREATE INDEX "FileUpload_s3Key_idx" ON "FileUpload"("s3Key");

-- ============================================
-- TABLE 28: StripeEvent
-- ============================================

CREATE TABLE "StripeEvent" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "eventId" TEXT UNIQUE NOT NULL,
  "type" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "StripeEvent_eventId_idx" ON "StripeEvent"("eventId");
CREATE INDEX "StripeEvent_type_idx" ON "StripeEvent"("type");
CREATE INDEX "StripeEvent_processed_idx" ON "StripeEvent"("processed");

-- ============================================
-- AUTO-UPDATE TRIGGERS FOR updatedAt
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updatedAt column
CREATE TRIGGER update_organization_updated_at BEFORE UPDATE ON "Organization"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON "Personnel"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_review_updated_at BEFORE UPDATE ON "AccessReview"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_updated_at BEFORE UPDATE ON "Vendor"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_assessment_updated_at BEFORE UPDATE ON "VendorAssessment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_monitor_updated_at BEFORE UPDATE ON "VendorMonitor"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_assessment_updated_at BEFORE UPDATE ON "RiskAssessment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_framework_updated_at BEFORE UPDATE ON "ComplianceFramework"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_control_updated_at BEFORE UPDATE ON "FrameworkControl"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_item_updated_at BEFORE UPDATE ON "RiskItem"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_updated_at BEFORE UPDATE ON "Questionnaire"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_response_updated_at BEFORE UPDATE ON "QuestionnaireResponse"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_updated_at BEFORE UPDATE ON "Policy"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_certificate_updated_at BEFORE UPDATE ON "TrustCertificate"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_report_updated_at BEFORE UPDATE ON "CustomReport"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_continuous_monitor_updated_at BEFORE UPDATE ON "ContinuousMonitor"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_updated_at BEFORE UPDATE ON "Issue"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_updated_at BEFORE UPDATE ON "Integration"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEMA CREATION COMPLETE
-- ============================================
-- Total Tables: 28
-- Total Enums: 13
-- Total Indexes: 60+
-- Total Triggers: 18
-- ============================================

-- To verify schema creation:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT typname FROM pg_type WHERE typtype = 'e';
