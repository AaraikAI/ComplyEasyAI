-- ============================================================================
-- Comprehensive Supabase Database Updates
-- Run in Supabase SQL Editor
-- ============================================================================
-- This script includes all necessary updates for new features
-- Date: 2026-01-10
-- ============================================================================

-- ============================================================================
-- 1. ENSURE ALL EXISTING TABLES HAVE REQUIRED FIELDS
-- ============================================================================

-- Add missing fields to ComplianceFramework (if not exists)
ALTER TABLE "ComplianceFramework" 
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "lastModifiedBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastModifiedAt" TIMESTAMP(3);

-- Add missing fields to FrameworkControl (if not exists)
ALTER TABLE "FrameworkControl"
ADD COLUMN IF NOT EXISTS "ownerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Add missing fields to RiskItem (if not exists)
ALTER TABLE "RiskItem"
ADD COLUMN IF NOT EXISTS "likelihood" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS "impact" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS "riskScore" INTEGER,
ADD COLUMN IF NOT EXISTS "mitigationPlan" TEXT,
ADD COLUMN IF NOT EXISTS "remediationOwner" TEXT,
ADD COLUMN IF NOT EXISTS "targetDate" TIMESTAMP(3);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "FrameworkControl_ownerId_idx" ON "FrameworkControl"("ownerId");
CREATE INDEX IF NOT EXISTS "FrameworkControl_category_idx" ON "FrameworkControl"("category");
CREATE INDEX IF NOT EXISTS "RiskItem_targetDate_idx" ON "RiskItem"("targetDate");
CREATE INDEX IF NOT EXISTS "RiskItem_riskScore_idx" ON "RiskItem"("riskScore");

-- ============================================================================
-- 2. CREATE EVIDENCE VERSIONING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "EvidenceVersion" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "controlId" TEXT NOT NULL REFERENCES "FrameworkControl"("id") ON DELETE CASCADE,
  "versionNumber" INTEGER NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "s3Key" TEXT,
  "uploadedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fileSize" BIGINT,
  "mimeType" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT
);

CREATE INDEX IF NOT EXISTS "EvidenceVersion_controlId_idx" ON "EvidenceVersion"("controlId");
CREATE INDEX IF NOT EXISTS "EvidenceVersion_uploadedBy_idx" ON "EvidenceVersion"("uploadedBy");

-- ============================================================================
-- 3. CREATE CONTROL MAPPING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ControlMapping" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sourceControlId" TEXT NOT NULL REFERENCES "FrameworkControl"("id") ON DELETE CASCADE,
  "targetControlId" TEXT NOT NULL REFERENCES "FrameworkControl"("id") ON DELETE CASCADE,
  "mappingType" TEXT NOT NULL DEFAULT 'equivalent',
  "confidence" FLOAT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlMapping_source_target_unique" UNIQUE ("sourceControlId", "targetControlId")
);

CREATE INDEX IF NOT EXISTS "ControlMapping_sourceControlId_idx" ON "ControlMapping"("sourceControlId");
CREATE INDEX IF NOT EXISTS "ControlMapping_targetControlId_idx" ON "ControlMapping"("targetControlId");

-- ============================================================================
-- 4. CREATE AI SUGGESTION TABLE (if not exists)
-- ============================================================================

CREATE TYPE IF NOT EXISTS "AISuggestionStatus" AS ENUM (
  'pending',
  'accepted',
  'rejected'
);

CREATE TABLE IF NOT EXISTS "AISuggestion" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "frameworkId" TEXT NOT NULL REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE,
  "controlId" TEXT REFERENCES "FrameworkControl"("id") ON DELETE SET NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "s3Key" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "description" TEXT,
  "confidence" FLOAT NOT NULL,
  "status" "AISuggestionStatus" NOT NULL DEFAULT 'pending',
  "feedback" TEXT,
  "suggestedBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AISuggestion_frameworkId_idx" ON "AISuggestion"("frameworkId");
CREATE INDEX IF NOT EXISTS "AISuggestion_controlId_idx" ON "AISuggestion"("controlId");
CREATE INDEX IF NOT EXISTS "AISuggestion_suggestedBy_idx" ON "AISuggestion"("suggestedBy");
CREATE INDEX IF NOT EXISTS "AISuggestion_organizationId_idx" ON "AISuggestion"("organizationId");
CREATE INDEX IF NOT EXISTS "AISuggestion_status_idx" ON "AISuggestion"("status");

-- ============================================================================
-- 5. CREATE PHISHING TRAINING GENERATOR TABLE
-- ============================================================================

CREATE TYPE IF NOT EXISTS "PhishingType" AS ENUM (
  'Email',
  'Spear',
  'Smishing'
);

CREATE TYPE IF NOT EXISTS "PhishingDifficulty" AS ENUM (
  'Easy',
  'Medium',
  'Hard'
);

CREATE TABLE IF NOT EXISTS "PhishingTraining" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "type" "PhishingType" NOT NULL DEFAULT 'Email',
  "difficulty" "PhishingDifficulty" NOT NULL DEFAULT 'Medium',
  "title" TEXT NOT NULL,
  "scenario" TEXT NOT NULL,
  "emailContent" TEXT,
  "smsContent" TEXT,
  "targetContext" TEXT,
  "questions" JSONB,
  "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PhishingTraining_organizationId_idx" ON "PhishingTraining"("organizationId");
CREATE INDEX IF NOT EXISTS "PhishingTraining_type_idx" ON "PhishingTraining"("type");
CREATE INDEX IF NOT EXISTS "PhishingTraining_difficulty_idx" ON "PhishingTraining"("difficulty");

-- ============================================================================
-- 6. CREATE GAP ANALYSIS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "GapAnalysis" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "frameworkId" TEXT REFERENCES "ComplianceFramework"("id") ON DELETE SET NULL,
  "frameworkName" TEXT NOT NULL,
  "currentState" TEXT,
  "gaps" JSONB NOT NULL,
  "prioritizedGaps" JSONB,
  "remediationSuggestions" JSONB,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "GapAnalysis_organizationId_idx" ON "GapAnalysis"("organizationId");
CREATE INDEX IF NOT EXISTS "GapAnalysis_frameworkId_idx" ON "GapAnalysis"("frameworkId");

-- ============================================================================
-- 7. CREATE RFP RESPONDER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RFPResponse" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "rfpTitle" TEXT NOT NULL,
  "companyContext" JSONB,
  "questions" JSONB NOT NULL,
  "responses" JSONB NOT NULL,
  "confidenceScores" JSONB,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "RFPResponse_organizationId_idx" ON "RFPResponse"("organizationId");

-- ============================================================================
-- 8. CREATE DATA MAPPER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DataMap" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "dataFlows" JSONB NOT NULL,
  "piiIdentified" JSONB,
  "crossBorderTransfers" JSONB,
  "retentionPeriods" JSONB,
  "visualDiagram" TEXT,
  "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "DataMap_organizationId_idx" ON "DataMap"("organizationId");

-- ============================================================================
-- 9. CREATE BCP GENERATOR TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BCPPlan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "rto" INTEGER, -- Recovery Time Objective in hours
  "rpo" INTEGER, -- Recovery Point Objective in hours
  "planContent" TEXT NOT NULL,
  "contactTree" JSONB,
  "procedures" JSONB,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BCPPlan_organizationId_idx" ON "BCPPlan"("organizationId");

-- ============================================================================
-- 10. CREATE CHATBOT CONVERSATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ChatConversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "messages" JSONB NOT NULL,
  "fileContext" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ChatConversation_organizationId_idx" ON "ChatConversation"("organizationId");
CREATE INDEX IF NOT EXISTS "ChatConversation_userId_idx" ON "ChatConversation"("userId");

-- ============================================================================
-- 11. ENSURE ENUM VALUES EXIST
-- ============================================================================

-- Add missing SubscriptionStatus enum values (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM (
      'active',
      'past_due',
      'canceled',
      'trialing',
      'incomplete',
      'incomplete_expired',
      'unpaid'
    );
  ELSE
    -- Add missing enum values if type exists
    ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'incomplete';
    ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'incomplete_expired';
    ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'unpaid';
  END IF;
END $$;

-- Add missing Plan enum values (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
    CREATE TYPE "Plan" AS ENUM (
      'Foundation',
      'Essentials',
      'Growth',
      'Visionary',
      'Basic',
      'Pro',
      'Enterprise'
    );
  ELSE
    -- Add missing enum values if type exists
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'Foundation';
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'Essentials';
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'Growth';
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'Visionary';
  END IF;
END $$;

-- Create BillingCycle enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingCycle') THEN
    CREATE TYPE "BillingCycle" AS ENUM (
      'monthly',
      'annual'
    );
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE 'All database updates completed successfully!';
END $$;

