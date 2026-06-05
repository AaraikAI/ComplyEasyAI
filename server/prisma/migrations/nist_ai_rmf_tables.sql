-- ============================================================================
-- NIST AI RMF 1.0 Database Schema
-- Based on NIST AI 100-1: Artificial Intelligence Risk Management Framework
-- ============================================================================

-- Table: AISystem
-- Main entity for AI systems managed under NIST AI RMF
CREATE TABLE IF NOT EXISTS "AISystem" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "systemType" TEXT NOT NULL,
  "useCase" TEXT,
  "deploymentContext" TEXT,
  "lifecycleStage" TEXT NOT NULL DEFAULT 'Plan_and_Design',
  "autonomyLevel" TEXT NOT NULL DEFAULT 'Human_in_Loop',
  "status" TEXT NOT NULL DEFAULT 'In_Development',
  "riskLevel" TEXT,
  "overallTrustworthinessScore" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AISystem_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AISystem_organizationId_idx" ON "AISystem"("organizationId");
CREATE INDEX IF NOT EXISTS "AISystem_status_idx" ON "AISystem"("status");
CREATE INDEX IF NOT EXISTS "AISystem_lifecycleStage_idx" ON "AISystem"("lifecycleStage");
CREATE INDEX IF NOT EXISTS "AISystem_riskLevel_idx" ON "AISystem"("riskLevel");

-- Table: AIRMFCoreFunction
-- The 4 core functions: GOVERN, MAP, MEASURE, MANAGE
CREATE TABLE IF NOT EXISTS "AIRMFCoreFunction" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "functionName" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Not_Started',
  "completionPercent" INTEGER NOT NULL DEFAULT 0,
  "lastAssessed" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFCoreFunction_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFCoreFunction_aiSystemId_functionName_key" UNIQUE ("aiSystemId", "functionName")
);

CREATE INDEX IF NOT EXISTS "AIRMFCoreFunction_aiSystemId_idx" ON "AIRMFCoreFunction"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFCoreFunction_functionName_idx" ON "AIRMFCoreFunction"("functionName");
CREATE INDEX IF NOT EXISTS "AIRMFCoreFunction_status_idx" ON "AIRMFCoreFunction"("status");

-- Table: AIRMFCategory
-- Categories within each core function
CREATE TABLE IF NOT EXISTS "AIRMFCategory" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "coreFunctionId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Not_Started',
  "completionPercent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFCategory_coreFunctionId_fkey"
    FOREIGN KEY ("coreFunctionId")
    REFERENCES "AIRMFCoreFunction"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFCategory_coreFunctionId_categoryId_key" UNIQUE ("coreFunctionId", "categoryId")
);

CREATE INDEX IF NOT EXISTS "AIRMFCategory_coreFunctionId_idx" ON "AIRMFCategory"("coreFunctionId");
CREATE INDEX IF NOT EXISTS "AIRMFCategory_categoryId_idx" ON "AIRMFCategory"("categoryId");
CREATE INDEX IF NOT EXISTS "AIRMFCategory_status_idx" ON "AIRMFCategory"("status");

-- Table: AIRMFSubcategory
-- Subcategories within each category
CREATE TABLE IF NOT EXISTS "AIRMFSubcategory" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "categoryId" TEXT NOT NULL,
  "subcategoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Not_Started',
  "evidence" TEXT,
  "evidenceUrl" TEXT,
  "ownerId" TEXT,
  "notes" TEXT,
  "lastReviewed" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFSubcategory_categoryId_fkey"
    FOREIGN KEY ("categoryId")
    REFERENCES "AIRMFCategory"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFSubcategory_ownerId_fkey"
    FOREIGN KEY ("ownerId")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AIRMFSubcategory_categoryId_subcategoryId_key" UNIQUE ("categoryId", "subcategoryId")
);

CREATE INDEX IF NOT EXISTS "AIRMFSubcategory_categoryId_idx" ON "AIRMFSubcategory"("categoryId");
CREATE INDEX IF NOT EXISTS "AIRMFSubcategory_subcategoryId_idx" ON "AIRMFSubcategory"("subcategoryId");
CREATE INDEX IF NOT EXISTS "AIRMFSubcategory_status_idx" ON "AIRMFSubcategory"("status");
CREATE INDEX IF NOT EXISTS "AIRMFSubcategory_ownerId_idx" ON "AIRMFSubcategory"("ownerId");

-- Table: AIRMFTrustworthinessCharacteristic
-- The 7 trustworthiness characteristics
CREATE TABLE IF NOT EXISTS "AIRMFTrustworthinessCharacteristic" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "characteristic" TEXT NOT NULL,
  "description" TEXT,
  "score" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Not_Assessed',
  "assessmentNotes" TEXT,
  "lastAssessed" TIMESTAMP(3),
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFTrustworthinessCharacteristic_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFTrustworthinessCharacteristic_aiSystemId_characteristic_key" UNIQUE ("aiSystemId", "characteristic")
);

CREATE INDEX IF NOT EXISTS "AIRMFTrustworthinessCharacteristic_aiSystemId_idx" ON "AIRMFTrustworthinessCharacteristic"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFTrustworthinessCharacteristic_characteristic_idx" ON "AIRMFTrustworthinessCharacteristic"("characteristic");
CREATE INDEX IF NOT EXISTS "AIRMFTrustworthinessCharacteristic_status_idx" ON "AIRMFTrustworthinessCharacteristic"("status");

-- Table: AIRMFLifecycleStage
-- AI lifecycle stages
CREATE TABLE IF NOT EXISTS "AIRMFLifecycleStage" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Not_Started',
  "startDate" TIMESTAMP(3),
  "completionDate" TIMESTAMP(3),
  "notes" TEXT,
  "risks" JSONB,
  "activities" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFLifecycleStage_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFLifecycleStage_aiSystemId_stage_key" UNIQUE ("aiSystemId", "stage")
);

CREATE INDEX IF NOT EXISTS "AIRMFLifecycleStage_aiSystemId_idx" ON "AIRMFLifecycleStage"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFLifecycleStage_stage_idx" ON "AIRMFLifecycleStage"("stage");
CREATE INDEX IF NOT EXISTS "AIRMFLifecycleStage_status_idx" ON "AIRMFLifecycleStage"("status");

-- Table: AIRMFActor
-- AI actors across the lifecycle
CREATE TABLE IF NOT EXISTS "AIRMFActor" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "involvementStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFActor_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFActor_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AIRMFActor_aiSystemId_idx" ON "AIRMFActor"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFActor_actorType_idx" ON "AIRMFActor"("actorType");
CREATE INDEX IF NOT EXISTS "AIRMFActor_userId_idx" ON "AIRMFActor"("userId");

-- Table: AIRMFAssessment
-- Assessments for AI systems
CREATE TABLE IF NOT EXISTS "AIRMFAssessment" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "assessmentType" TEXT NOT NULL,
  "assessedBy" TEXT NOT NULL,
  "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "overallScore" INTEGER,
  "functionScores" JSONB,
  "characteristicScores" JSONB,
  "findings" JSONB,
  "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFAssessment_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AIRMFAssessment_aiSystemId_idx" ON "AIRMFAssessment"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFAssessment_assessmentType_idx" ON "AIRMFAssessment"("assessmentType");
CREATE INDEX IF NOT EXISTS "AIRMFAssessment_assessmentDate_idx" ON "AIRMFAssessment"("assessmentDate");
CREATE INDEX IF NOT EXISTS "AIRMFAssessment_status_idx" ON "AIRMFAssessment"("status");

-- Table: AIRMFProfile
-- Profiles for different contexts
CREATE TABLE IF NOT EXISTS "AIRMFProfile" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "profileName" TEXT NOT NULL,
  "profileType" TEXT NOT NULL,
  "description" TEXT,
  "selectedFunctions" JSONB NOT NULL,
  "priorities" JSONB,
  "customizations" JSONB,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFProfile_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AIRMFProfile_aiSystemId_idx" ON "AIRMFProfile"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFProfile_profileType_idx" ON "AIRMFProfile"("profileType");
CREATE INDEX IF NOT EXISTS "AIRMFProfile_status_idx" ON "AIRMFProfile"("status");

-- Table: AIRMFRiskActivity
-- Risk management activities
CREATE TABLE IF NOT EXISTS "AIRMFRiskActivity" (
  "id" TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "aiSystemId" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "relatedFunction" TEXT,
  "relatedCategory" TEXT,
  "relatedSubcategory" TEXT,
  "description" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "mitigationPlan" TEXT,
  "ownerId" TEXT,
  "targetDate" TIMESTAMP(3),
  "completedDate" TIMESTAMP(3),
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRMFRiskActivity_aiSystemId_fkey"
    FOREIGN KEY ("aiSystemId")
    REFERENCES "AISystem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIRMFRiskActivity_ownerId_fkey"
    FOREIGN KEY ("ownerId")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AIRMFRiskActivity_aiSystemId_idx" ON "AIRMFRiskActivity"("aiSystemId");
CREATE INDEX IF NOT EXISTS "AIRMFRiskActivity_activityType_idx" ON "AIRMFRiskActivity"("activityType");
CREATE INDEX IF NOT EXISTS "AIRMFRiskActivity_relatedFunction_idx" ON "AIRMFRiskActivity"("relatedFunction");
CREATE INDEX IF NOT EXISTS "AIRMFRiskActivity_riskLevel_idx" ON "AIRMFRiskActivity"("riskLevel");
CREATE INDEX IF NOT EXISTS "AIRMFRiskActivity_status_idx" ON "AIRMFRiskActivity"("status");
CREATE INDEX IF NOT EXISTS "AIRMFRiskActivity_ownerId_idx" ON "AIRMFRiskActivity"("ownerId");

