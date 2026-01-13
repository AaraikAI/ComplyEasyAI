-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'editor', 'viewer', 'compliance_admin', 'security_admin');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('Compliant', 'At_Risk', 'Non_Compliant', 'In_Review');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('Open', 'In_Progress', 'Resolved', 'Ignored', 'Accepted');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annual');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('Foundation', 'Essentials', 'Growth', 'Visionary');

-- CreateEnum
CREATE TYPE "AccessReviewStatus" AS ENUM ('Pending', 'In_Progress', 'Completed', 'Overdue');

-- CreateEnum
CREATE TYPE "VendorRiskLevel" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('Active', 'Inactive', 'Onboarding', 'Offboarding', 'Suspended');

-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('Draft', 'In_Progress', 'Completed', 'Reviewed', 'Approved');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('Open', 'In_Progress', 'Resolved', 'Closed', 'Reopened');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('Passing', 'Failing', 'Warning', 'Unknown');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('pending', 'processing', 'delivered', 'failed', 'exhausted');

-- CreateEnum
CREATE TYPE "SubscriptionChangeType" AS ENUM ('trial_started', 'trial_ended', 'upgrade', 'downgrade', 'renewal', 'cancellation', 'reactivation', 'payment_failed', 'payment_recovered', 'addon_added', 'addon_removed');

-- CreateEnum
CREATE TYPE "DemoRequestStatus" AS ENUM ('pending', 'contacted', 'scheduled', 'completed', 'qualified', 'proposal_sent', 'negotiation', 'converted', 'disqualified', 'no_response');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'Foundation',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'annual',
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionStartedAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "activeAddOns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageMetrics" JSONB,
    "parentOrganizationId" TEXT,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'viewer',
    "avatar" TEXT,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "employeeId" TEXT,
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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorBackupCode" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "userId" TEXT NOT NULL,
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

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReview" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "AccessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "VendorAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorReview" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "vendorId" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewer" TEXT NOT NULL,
    "findings" JSONB,
    "actionItems" JSONB,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMonitor" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "vendorId" TEXT NOT NULL,
    "monitorType" TEXT NOT NULL,
    "status" "MonitorStatus" NOT NULL DEFAULT 'Unknown',
    "lastCheck" TIMESTAMP(3),
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFramework" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "name" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'In_Review',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "nextAuditDate" TIMESTAMP(3) NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ComplianceFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkControl" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frameworkId" TEXT NOT NULL,
    "mappedControls" JSONB,

    CONSTRAINT "FrameworkControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskItem" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "RiskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireQuestion" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "questionnaireId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "category" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireResponse" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "QuestionnaireResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustCertificate" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "TrustCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomReport" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "CustomReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContinuousMonitor" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "ContinuousMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorResult" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "monitorId" TEXT NOT NULL,
    "status" "MonitorStatus" NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "failedTests" INTEGER NOT NULL DEFAULT 0,
    "findings" JSONB,
    "evidence" JSONB,
    "autoRemediated" BOOLEAN NOT NULL DEFAULT false,
    "remediationActions" JSONB,

    CONSTRAINT "MonitorResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueComment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "issueId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "hash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
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

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceGoal" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT,
    "goalType" TEXT NOT NULL,
    "frameworks" TEXT[],
    "riskTolerance" TEXT NOT NULL,
    "horizon" INTEGER NOT NULL,
    "autoActionPolicy" TEXT NOT NULL,
    "targetScore" INTEGER,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlLoop" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "observeAgent" TEXT NOT NULL,
    "actAgent" TEXT NOT NULL,
    "verifyAgent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cycleCount" INTEGER NOT NULL DEFAULT 0,
    "triggerType" TEXT DEFAULT 'manual',
    "triggerConfig" JSONB,
    "timeoutSeconds" INTEGER DEFAULT 300,
    "parentLoopId" TEXT,
    "configuration" JSONB,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlLoop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlLoopHistory" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "loopId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "executionPhase" TEXT NOT NULL,
    "phaseResult" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlLoopHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDebt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "controlId" TEXT,
    "debtType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedRemediationHours" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3),
    "accumulatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeImpact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "affectedControls" TEXT[],
    "affectedFrameworks" TEXT[],
    "downstreamDependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "impactScore" INTEGER NOT NULL,
    "riskIncrease" DOUBLE PRECISION NOT NULL,
    "estimatedComplianceChange" DOUBLE PRECISION NOT NULL,
    "severity" TEXT,
    "estimatedResolutionDays" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "forecastedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgenticAction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "blastRadius" JSONB NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rollbackData" JSONB,
    "executedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgenticAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceAnalysis" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deepfakeScore" DOUBLE PRECISION NOT NULL,
    "cryptographicHash" TEXT NOT NULL,
    "physicalAttestation" JSONB,
    "humanLiveness" JSONB,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "regulationName" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "changeType" TEXT NOT NULL,
    "affectedFrameworks" TEXT[],
    "extractedRequirements" TEXT[],
    "autoGeneratedControls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "regulationText" TEXT,
    "source" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskPrediction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "riskId" TEXT,
    "riskType" TEXT NOT NULL,
    "predictedProbability" DOUBLE PRECISION NOT NULL,
    "predictedSeverity" TEXT NOT NULL,
    "predictedDate" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" TEXT[],
    "timeHorizonMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTrajectory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "currentScore" INTEGER NOT NULL,
    "predictedScores" JSONB NOT NULL,
    "trend" TEXT NOT NULL,
    "timeHorizonMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceTrajectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationResult" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "baselineScore" INTEGER NOT NULL,
    "simulatedScore" INTEGER NOT NULL,
    "scoreChange" INTEGER NOT NULL,
    "affectedControls" INTEGER NOT NULL,
    "affectedFrameworks" INTEGER NOT NULL,
    "riskChanges" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedTeamResult" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "attackPath" TEXT[],
    "vulnerabilitiesFound" JSONB NOT NULL,
    "remediationRecommendations" TEXT[],
    "executionTime" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedTeamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwarmInsight" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "applicableFrameworks" TEXT[],
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IoTDevice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "complianceStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sensorData" JSONB,
    "mqttTopic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IoTDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdgeComplianceCheck" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT DEFAULT 'medium',
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdgeComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptionResult" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "language" TEXT NOT NULL,
    "duration" INTEGER,
    "segments" JSONB,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTrust" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZeroTrustPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZeroTrustPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkSegment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cidr" TEXT,
    "resources" JSONB NOT NULL,
    "trustLevel" TEXT NOT NULL DEFAULT 'medium',
    "policies" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "dataSize" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyRotationPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "rotationIntervalDays" INTEGER NOT NULL DEFAULT 90,
    "lastRotation" TIMESTAMP(3),
    "nextRotation" TIMESTAMP(3) NOT NULL,
    "autoRotate" BOOLEAN NOT NULL DEFAULT false,
    "notifyDaysBefore" INTEGER NOT NULL DEFAULT 7,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyRotationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompliancePolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "rego" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'high',
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompliancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VRTrainingScenario" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "objectives" TEXT[],
    "scenarioData" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VRTrainingScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VRTrainingSession" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentScene" TEXT,
    "completedTasks" TEXT[],
    "score" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VRTrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VRSessionPerformance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fps" DOUBLE PRECISION NOT NULL,
    "renderTime" DOUBLE PRECISION NOT NULL,
    "latency" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VRSessionPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeuroSymbolicReasoning" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "neuralPrediction" JSONB NOT NULL,
    "symbolicRules" JSONB NOT NULL,
    "finalDecision" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeuroSymbolicReasoning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleInference" (
    "id" TEXT NOT NULL,
    "reasoningId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inferredRule" JSONB NOT NULL,
    "supportingEvidence" JSONB NOT NULL,
    "validationStatus" TEXT NOT NULL,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleInference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedSwarmPeer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "peerName" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "aggregatedMetrics" JSONB,

    CONSTRAINT "FederatedSwarmPeer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedSwarmAggregation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "aggregationType" TEXT NOT NULL,
    "aggregatedData" JSONB NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederatedSwarmAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channels" TEXT[],
    "templateId" TEXT,
    "metadata" JSONB,
    "link" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "slack" BOOLEAN NOT NULL DEFAULT true,
    "websocket" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "categories" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "headers" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "retryPolicy" JSONB,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "previousPlan" "Plan",
    "newPlan" "Plan" NOT NULL,
    "previousStatus" "SubscriptionStatus",
    "newStatus" "SubscriptionStatus" NOT NULL,
    "changeType" "SubscriptionChangeType" NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT,
    "stripeEventId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTracking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL DEFAULT -1,
    "resetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT,
    "phone" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "interestedTier" TEXT,
    "currentChallenge" TEXT,
    "howDidYouHear" TEXT,
    "message" TEXT,
    "status" "DemoRequestStatus" NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "welcomeEmailSentAt" TIMESTAMP(3),
    "followUpEmailSentAt" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "convertedToUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Organization_stripeCustomerId_idx" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Organization_parentOrganizationId_idx" ON "Organization"("parentOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "TwoFactorBackupCode_userId_idx" ON "TwoFactorBackupCode"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorBackupCode_code_idx" ON "TwoFactorBackupCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_userId_key" ON "Personnel"("userId");

-- CreateIndex
CREATE INDEX "Personnel_organizationId_idx" ON "Personnel"("organizationId");

-- CreateIndex
CREATE INDEX "Personnel_userId_idx" ON "Personnel"("userId");

-- CreateIndex
CREATE INDEX "AccessReview_organizationId_idx" ON "AccessReview"("organizationId");

-- CreateIndex
CREATE INDEX "AccessReview_personnelId_idx" ON "AccessReview"("personnelId");

-- CreateIndex
CREATE INDEX "AccessReview_status_idx" ON "AccessReview"("status");

-- CreateIndex
CREATE INDEX "Vendor_organizationId_idx" ON "Vendor"("organizationId");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_riskLevel_idx" ON "Vendor"("riskLevel");

-- CreateIndex
CREATE INDEX "VendorAssessment_vendorId_idx" ON "VendorAssessment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorReview_vendorId_idx" ON "VendorReview"("vendorId");

-- CreateIndex
CREATE INDEX "VendorMonitor_vendorId_idx" ON "VendorMonitor"("vendorId");

-- CreateIndex
CREATE INDEX "VendorMonitor_status_idx" ON "VendorMonitor"("status");

-- CreateIndex
CREATE INDEX "RiskAssessment_organizationId_idx" ON "RiskAssessment"("organizationId");

-- CreateIndex
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- CreateIndex
CREATE INDEX "ComplianceFramework_organizationId_idx" ON "ComplianceFramework"("organizationId");

-- CreateIndex
CREATE INDEX "ComplianceFramework_status_idx" ON "ComplianceFramework"("status");

-- CreateIndex
CREATE INDEX "FrameworkControl_frameworkId_idx" ON "FrameworkControl"("frameworkId");

-- CreateIndex
CREATE INDEX "RiskItem_organizationId_idx" ON "RiskItem"("organizationId");

-- CreateIndex
CREATE INDEX "RiskItem_status_idx" ON "RiskItem"("status");

-- CreateIndex
CREATE INDEX "RiskItem_severity_idx" ON "RiskItem"("severity");

-- CreateIndex
CREATE INDEX "RiskItem_assignedToId_idx" ON "RiskItem"("assignedToId");

-- CreateIndex
CREATE INDEX "RiskItem_assessmentId_idx" ON "RiskItem"("assessmentId");

-- CreateIndex
CREATE INDEX "Questionnaire_organizationId_idx" ON "Questionnaire"("organizationId");

-- CreateIndex
CREATE INDEX "Questionnaire_status_idx" ON "Questionnaire"("status");

-- CreateIndex
CREATE INDEX "QuestionnaireQuestion_questionnaireId_idx" ON "QuestionnaireQuestion"("questionnaireId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_questionnaireId_idx" ON "QuestionnaireResponse"("questionnaireId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_questionId_idx" ON "QuestionnaireResponse"("questionId");

-- CreateIndex
CREATE INDEX "Policy_organizationId_idx" ON "Policy"("organizationId");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_framework_idx" ON "Policy"("framework");

-- CreateIndex
CREATE INDEX "TrustCertificate_organizationId_idx" ON "TrustCertificate"("organizationId");

-- CreateIndex
CREATE INDEX "TrustCertificate_status_idx" ON "TrustCertificate"("status");

-- CreateIndex
CREATE INDEX "CustomReport_organizationId_idx" ON "CustomReport"("organizationId");

-- CreateIndex
CREATE INDEX "CustomReport_reportType_idx" ON "CustomReport"("reportType");

-- CreateIndex
CREATE INDEX "ContinuousMonitor_organizationId_idx" ON "ContinuousMonitor"("organizationId");

-- CreateIndex
CREATE INDEX "ContinuousMonitor_status_idx" ON "ContinuousMonitor"("status");

-- CreateIndex
CREATE INDEX "ContinuousMonitor_monitorType_idx" ON "ContinuousMonitor"("monitorType");

-- CreateIndex
CREATE INDEX "MonitorResult_monitorId_idx" ON "MonitorResult"("monitorId");

-- CreateIndex
CREATE INDEX "MonitorResult_status_idx" ON "MonitorResult"("status");

-- CreateIndex
CREATE INDEX "Issue_organizationId_idx" ON "Issue"("organizationId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_priority_idx" ON "Issue"("priority");

-- CreateIndex
CREATE INDEX "Issue_assignedToId_idx" ON "Issue"("assignedToId");

-- CreateIndex
CREATE INDEX "IssueComment_issueId_idx" ON "IssueComment"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_hash_key" ON "AuditLog"("hash");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Integration_organizationId_idx" ON "Integration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_organizationId_provider_key" ON "Integration"("organizationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_email_idx" ON "MagicLink"("email");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_expiresAt_idx" ON "MagicLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_s3Key_key" ON "FileUpload"("s3Key");

-- CreateIndex
CREATE INDEX "FileUpload_organizationId_idx" ON "FileUpload"("organizationId");

-- CreateIndex
CREATE INDEX "FileUpload_uploadedBy_idx" ON "FileUpload"("uploadedBy");

-- CreateIndex
CREATE INDEX "FileUpload_s3Key_idx" ON "FileUpload"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_eventId_key" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeEvent_eventId_idx" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeEvent_type_idx" ON "StripeEvent"("type");

-- CreateIndex
CREATE INDEX "StripeEvent_processed_idx" ON "StripeEvent"("processed");

-- CreateIndex
CREATE INDEX "ComplianceGoal_organizationId_idx" ON "ComplianceGoal"("organizationId");

-- CreateIndex
CREATE INDEX "ComplianceGoal_status_idx" ON "ComplianceGoal"("status");

-- CreateIndex
CREATE INDEX "ControlLoop_organizationId_idx" ON "ControlLoop"("organizationId");

-- CreateIndex
CREATE INDEX "ControlLoop_controlId_idx" ON "ControlLoop"("controlId");

-- CreateIndex
CREATE INDEX "ControlLoop_status_idx" ON "ControlLoop"("status");

-- CreateIndex
CREATE INDEX "ControlLoop_triggerType_idx" ON "ControlLoop"("triggerType");

-- CreateIndex
CREATE INDEX "ControlLoop_parentLoopId_idx" ON "ControlLoop"("parentLoopId");

-- CreateIndex
CREATE INDEX "ControlLoopHistory_loopId_idx" ON "ControlLoopHistory"("loopId");

-- CreateIndex
CREATE INDEX "ControlLoopHistory_organizationId_idx" ON "ControlLoopHistory"("organizationId");

-- CreateIndex
CREATE INDEX "ControlLoopHistory_timestamp_idx" ON "ControlLoopHistory"("timestamp");

-- CreateIndex
CREATE INDEX "ComplianceDebt_organizationId_idx" ON "ComplianceDebt"("organizationId");

-- CreateIndex
CREATE INDEX "ComplianceDebt_frameworkId_idx" ON "ComplianceDebt"("frameworkId");

-- CreateIndex
CREATE INDEX "ComplianceDebt_severity_idx" ON "ComplianceDebt"("severity");

-- CreateIndex
CREATE INDEX "ComplianceDebt_controlId_idx" ON "ComplianceDebt"("controlId");

-- CreateIndex
CREATE INDEX "ComplianceDebt_deadline_idx" ON "ComplianceDebt"("deadline");

-- CreateIndex
CREATE INDEX "ChangeImpact_organizationId_idx" ON "ChangeImpact"("organizationId");

-- CreateIndex
CREATE INDEX "ChangeImpact_changeType_idx" ON "ChangeImpact"("changeType");

-- CreateIndex
CREATE INDEX "ChangeImpact_severity_idx" ON "ChangeImpact"("severity");

-- CreateIndex
CREATE INDEX "ChangeImpact_resolvedAt_idx" ON "ChangeImpact"("resolvedAt");

-- CreateIndex
CREATE INDEX "AgenticAction_organizationId_idx" ON "AgenticAction"("organizationId");

-- CreateIndex
CREATE INDEX "AgenticAction_status_idx" ON "AgenticAction"("status");

-- CreateIndex
CREATE INDEX "AgenticAction_actionType_idx" ON "AgenticAction"("actionType");

-- CreateIndex
CREATE INDEX "EvidenceAnalysis_evidenceId_idx" ON "EvidenceAnalysis"("evidenceId");

-- CreateIndex
CREATE INDEX "EvidenceAnalysis_organizationId_idx" ON "EvidenceAnalysis"("organizationId");

-- CreateIndex
CREATE INDEX "EvidenceAnalysis_verificationStatus_idx" ON "EvidenceAnalysis"("verificationStatus");

-- CreateIndex
CREATE INDEX "RegulatoryChange_organizationId_idx" ON "RegulatoryChange"("organizationId");

-- CreateIndex
CREATE INDEX "RegulatoryChange_jurisdiction_idx" ON "RegulatoryChange"("jurisdiction");

-- CreateIndex
CREATE INDEX "RegulatoryChange_status_idx" ON "RegulatoryChange"("status");

-- CreateIndex
CREATE INDEX "RiskPrediction_organizationId_idx" ON "RiskPrediction"("organizationId");

-- CreateIndex
CREATE INDEX "RiskPrediction_predictedDate_idx" ON "RiskPrediction"("predictedDate");

-- CreateIndex
CREATE INDEX "RiskPrediction_predictedSeverity_idx" ON "RiskPrediction"("predictedSeverity");

-- CreateIndex
CREATE INDEX "ComplianceTrajectory_organizationId_idx" ON "ComplianceTrajectory"("organizationId");

-- CreateIndex
CREATE INDEX "ComplianceTrajectory_frameworkId_idx" ON "ComplianceTrajectory"("frameworkId");

-- CreateIndex
CREATE INDEX "SimulationScenario_organizationId_idx" ON "SimulationScenario"("organizationId");

-- CreateIndex
CREATE INDEX "SimulationScenario_scenarioType_idx" ON "SimulationScenario"("scenarioType");

-- CreateIndex
CREATE INDEX "SimulationResult_scenarioId_idx" ON "SimulationResult"("scenarioId");

-- CreateIndex
CREATE INDEX "SimulationResult_organizationId_idx" ON "SimulationResult"("organizationId");

-- CreateIndex
CREATE INDEX "RedTeamResult_organizationId_idx" ON "RedTeamResult"("organizationId");

-- CreateIndex
CREATE INDEX "RedTeamResult_createdAt_idx" ON "RedTeamResult"("createdAt");

-- CreateIndex
CREATE INDEX "SwarmInsight_organizationId_idx" ON "SwarmInsight"("organizationId");

-- CreateIndex
CREATE INDEX "SwarmInsight_insightType_idx" ON "SwarmInsight"("insightType");

-- CreateIndex
CREATE INDEX "IoTDevice_organizationId_idx" ON "IoTDevice"("organizationId");

-- CreateIndex
CREATE INDEX "IoTDevice_complianceStatus_idx" ON "IoTDevice"("complianceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "IoTDevice_deviceId_organizationId_key" ON "IoTDevice"("deviceId", "organizationId");

-- CreateIndex
CREATE INDEX "EdgeComplianceCheck_deviceId_idx" ON "EdgeComplianceCheck"("deviceId");

-- CreateIndex
CREATE INDEX "EdgeComplianceCheck_organizationId_idx" ON "EdgeComplianceCheck"("organizationId");

-- CreateIndex
CREATE INDEX "EdgeComplianceCheck_timestamp_idx" ON "EdgeComplianceCheck"("timestamp");

-- CreateIndex
CREATE INDEX "TranscriptionResult_organizationId_idx" ON "TranscriptionResult"("organizationId");

-- CreateIndex
CREATE INDEX "TranscriptionResult_evidenceId_idx" ON "TranscriptionResult"("evidenceId");

-- CreateIndex
CREATE INDEX "TranscriptionResult_sourceType_idx" ON "TranscriptionResult"("sourceType");

-- CreateIndex
CREATE INDEX "DeviceTrust_organizationId_idx" ON "DeviceTrust"("organizationId");

-- CreateIndex
CREATE INDEX "DeviceTrust_deviceId_idx" ON "DeviceTrust"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTrust_isTrusted_idx" ON "DeviceTrust"("isTrusted");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTrust_deviceId_organizationId_key" ON "DeviceTrust"("deviceId", "organizationId");

-- CreateIndex
CREATE INDEX "ZeroTrustPolicy_organizationId_idx" ON "ZeroTrustPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "ZeroTrustPolicy_enabled_idx" ON "ZeroTrustPolicy"("enabled");

-- CreateIndex
CREATE INDEX "NetworkSegment_organizationId_idx" ON "NetworkSegment"("organizationId");

-- CreateIndex
CREATE INDEX "NetworkSegment_trustLevel_idx" ON "NetworkSegment"("trustLevel");

-- CreateIndex
CREATE INDEX "KeyUsage_organizationId_idx" ON "KeyUsage"("organizationId");

-- CreateIndex
CREATE INDEX "KeyUsage_keyId_idx" ON "KeyUsage"("keyId");

-- CreateIndex
CREATE INDEX "KeyUsage_provider_idx" ON "KeyUsage"("provider");

-- CreateIndex
CREATE INDEX "KeyUsage_timestamp_idx" ON "KeyUsage"("timestamp");

-- CreateIndex
CREATE INDEX "KeyUsage_operation_idx" ON "KeyUsage"("operation");

-- CreateIndex
CREATE INDEX "KeyRotationPolicy_organizationId_idx" ON "KeyRotationPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "KeyRotationPolicy_nextRotation_idx" ON "KeyRotationPolicy"("nextRotation");

-- CreateIndex
CREATE INDEX "KeyRotationPolicy_enabled_idx" ON "KeyRotationPolicy"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "KeyRotationPolicy_keyId_organizationId_key" ON "KeyRotationPolicy"("keyId", "organizationId");

-- CreateIndex
CREATE INDEX "CompliancePolicy_organizationId_idx" ON "CompliancePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "CompliancePolicy_framework_idx" ON "CompliancePolicy"("framework");

-- CreateIndex
CREATE INDEX "CompliancePolicy_severity_idx" ON "CompliancePolicy"("severity");

-- CreateIndex
CREATE INDEX "CompliancePolicy_enabled_idx" ON "CompliancePolicy"("enabled");

-- CreateIndex
CREATE INDEX "CompliancePolicy_version_idx" ON "CompliancePolicy"("version");

-- CreateIndex
CREATE INDEX "VRTrainingScenario_organizationId_idx" ON "VRTrainingScenario"("organizationId");

-- CreateIndex
CREATE INDEX "VRTrainingScenario_framework_idx" ON "VRTrainingScenario"("framework");

-- CreateIndex
CREATE UNIQUE INDEX "VRTrainingSession_sessionId_key" ON "VRTrainingSession"("sessionId");

-- CreateIndex
CREATE INDEX "VRTrainingSession_scenarioId_idx" ON "VRTrainingSession"("scenarioId");

-- CreateIndex
CREATE INDEX "VRTrainingSession_organizationId_idx" ON "VRTrainingSession"("organizationId");

-- CreateIndex
CREATE INDEX "VRTrainingSession_userId_idx" ON "VRTrainingSession"("userId");

-- CreateIndex
CREATE INDEX "VRTrainingSession_sessionId_idx" ON "VRTrainingSession"("sessionId");

-- CreateIndex
CREATE INDEX "VRSessionPerformance_sessionId_idx" ON "VRSessionPerformance"("sessionId");

-- CreateIndex
CREATE INDEX "VRSessionPerformance_timestamp_idx" ON "VRSessionPerformance"("timestamp");

-- CreateIndex
CREATE INDEX "NeuroSymbolicReasoning_organizationId_idx" ON "NeuroSymbolicReasoning"("organizationId");

-- CreateIndex
CREATE INDEX "NeuroSymbolicReasoning_createdAt_idx" ON "NeuroSymbolicReasoning"("createdAt");

-- CreateIndex
CREATE INDEX "RuleInference_reasoningId_idx" ON "RuleInference"("reasoningId");

-- CreateIndex
CREATE INDEX "RuleInference_organizationId_idx" ON "RuleInference"("organizationId");

-- CreateIndex
CREATE INDEX "RuleInference_validationStatus_idx" ON "RuleInference"("validationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "FederatedSwarmPeer_peerId_key" ON "FederatedSwarmPeer"("peerId");

-- CreateIndex
CREATE INDEX "FederatedSwarmPeer_organizationId_idx" ON "FederatedSwarmPeer"("organizationId");

-- CreateIndex
CREATE INDEX "FederatedSwarmPeer_peerId_idx" ON "FederatedSwarmPeer"("peerId");

-- CreateIndex
CREATE INDEX "FederatedSwarmPeer_status_idx" ON "FederatedSwarmPeer"("status");

-- CreateIndex
CREATE INDEX "FederatedSwarmAggregation_organizationId_idx" ON "FederatedSwarmAggregation"("organizationId");

-- CreateIndex
CREATE INDEX "FederatedSwarmAggregation_aggregationType_idx" ON "FederatedSwarmAggregation"("aggregationType");

-- CreateIndex
CREATE INDEX "FederatedSwarmAggregation_timestamp_idx" ON "FederatedSwarmAggregation"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Webhook_organizationId_idx" ON "Webhook"("organizationId");

-- CreateIndex
CREATE INDEX "Webhook_enabled_idx" ON "Webhook"("enabled");

-- CreateIndex
CREATE INDEX "Webhook_events_idx" ON "Webhook"("events");

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_organizationId_name_key" ON "Webhook"("organizationId", "name");

-- CreateIndex
CREATE INDEX "WebhookEvent_webhookId_idx" ON "WebhookEvent"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookEvent_organizationId_idx" ON "WebhookEvent"("organizationId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_nextAttemptAt_idx" ON "WebhookEvent"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_organizationId_idx" ON "SubscriptionHistory"("organizationId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_changeType_idx" ON "SubscriptionHistory"("changeType");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_createdAt_idx" ON "SubscriptionHistory"("createdAt");

-- CreateIndex
CREATE INDEX "UsageTracking_organizationId_idx" ON "UsageTracking"("organizationId");

-- CreateIndex
CREATE INDEX "UsageTracking_metricType_idx" ON "UsageTracking"("metricType");

-- CreateIndex
CREATE INDEX "UsageTracking_period_idx" ON "UsageTracking"("period");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTracking_organizationId_metricType_period_key" ON "UsageTracking"("organizationId", "metricType", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_organizationId_idx" ON "ApiKey"("organizationId");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_organizationId_name_key" ON "ApiKey"("organizationId", "name");

-- CreateIndex
CREATE INDEX "DemoRequest_email_idx" ON "DemoRequest"("email");

-- CreateIndex
CREATE INDEX "DemoRequest_status_idx" ON "DemoRequest"("status");

-- CreateIndex
CREATE INDEX "DemoRequest_company_idx" ON "DemoRequest"("company");

-- CreateIndex
CREATE INDEX "DemoRequest_interestedTier_idx" ON "DemoRequest"("interestedTier");

-- CreateIndex
CREATE INDEX "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");

-- CreateIndex
CREATE INDEX "DemoRequest_scheduledAt_idx" ON "DemoRequest"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorBackupCode" ADD CONSTRAINT "TwoFactorBackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReview" ADD CONSTRAINT "AccessReview_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReview" ADD CONSTRAINT "AccessReview_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReview" ADD CONSTRAINT "AccessReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssessment" ADD CONSTRAINT "VendorAssessment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReview" ADD CONSTRAINT "VendorReview_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMonitor" ADD CONSTRAINT "VendorMonitor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceFramework" ADD CONSTRAINT "ComplianceFramework_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkControl" ADD CONSTRAINT "FrameworkControl_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskItem" ADD CONSTRAINT "RiskItem_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "RiskAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskItem" ADD CONSTRAINT "RiskItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskItem" ADD CONSTRAINT "RiskItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCertificate" ADD CONSTRAINT "TrustCertificate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomReport" ADD CONSTRAINT "CustomReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContinuousMonitor" ADD CONSTRAINT "ContinuousMonitor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorResult" ADD CONSTRAINT "MonitorResult_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "ContinuousMonitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceGoal" ADD CONSTRAINT "ComplianceGoal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlLoop" ADD CONSTRAINT "ControlLoop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlLoop" ADD CONSTRAINT "ControlLoop_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "FrameworkControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlLoopHistory" ADD CONSTRAINT "ControlLoopHistory_loopId_fkey" FOREIGN KEY ("loopId") REFERENCES "ControlLoop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlLoopHistory" ADD CONSTRAINT "ControlLoopHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDebt" ADD CONSTRAINT "ComplianceDebt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDebt" ADD CONSTRAINT "ComplianceDebt_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDebt" ADD CONSTRAINT "ComplianceDebt_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "FrameworkControl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeImpact" ADD CONSTRAINT "ChangeImpact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgenticAction" ADD CONSTRAINT "AgenticAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAnalysis" ADD CONSTRAINT "EvidenceAnalysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryChange" ADD CONSTRAINT "RegulatoryChange_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskPrediction" ADD CONSTRAINT "RiskPrediction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskPrediction" ADD CONSTRAINT "RiskPrediction_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTrajectory" ADD CONSTRAINT "ComplianceTrajectory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTrajectory" ADD CONSTRAINT "ComplianceTrajectory_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResult" ADD CONSTRAINT "SimulationResult_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResult" ADD CONSTRAINT "SimulationResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedTeamResult" ADD CONSTRAINT "RedTeamResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwarmInsight" ADD CONSTRAINT "SwarmInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IoTDevice" ADD CONSTRAINT "IoTDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdgeComplianceCheck" ADD CONSTRAINT "EdgeComplianceCheck_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IoTDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdgeComplianceCheck" ADD CONSTRAINT "EdgeComplianceCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionResult" ADD CONSTRAINT "TranscriptionResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTrust" ADD CONSTRAINT "DeviceTrust_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZeroTrustPolicy" ADD CONSTRAINT "ZeroTrustPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkSegment" ADD CONSTRAINT "NetworkSegment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyUsage" ADD CONSTRAINT "KeyUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyRotationPolicy" ADD CONSTRAINT "KeyRotationPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePolicy" ADD CONSTRAINT "CompliancePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePolicy" ADD CONSTRAINT "CompliancePolicy_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "CompliancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VRTrainingScenario" ADD CONSTRAINT "VRTrainingScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VRTrainingSession" ADD CONSTRAINT "VRTrainingSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "VRTrainingScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VRTrainingSession" ADD CONSTRAINT "VRTrainingSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VRSessionPerformance" ADD CONSTRAINT "VRSessionPerformance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VRTrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeuroSymbolicReasoning" ADD CONSTRAINT "NeuroSymbolicReasoning_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleInference" ADD CONSTRAINT "RuleInference_reasoningId_fkey" FOREIGN KEY ("reasoningId") REFERENCES "NeuroSymbolicReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleInference" ADD CONSTRAINT "RuleInference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FederatedSwarmPeer" ADD CONSTRAINT "FederatedSwarmPeer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FederatedSwarmAggregation" ADD CONSTRAINT "FederatedSwarmAggregation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

