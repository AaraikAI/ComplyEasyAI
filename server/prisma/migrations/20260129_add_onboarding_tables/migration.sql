-- Ensure uuid extension is enabled (required for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable: OnboardingProgress
-- Tracks per-user onboarding flow progress and milestone completions
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currentFlow" TEXT NOT NULL DEFAULT 'welcome',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "welcomeCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tierTourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "firstFrameworkCompleted" BOOLEAN NOT NULL DEFAULT false,
    "firstEvidenceCompleted" BOOLEAN NOT NULL DEFAULT false,
    "firstControlPassCompleted" BOOLEAN NOT NULL DEFAULT false,
    "inviteTeamCompleted" BOOLEAN NOT NULL DEFAULT false,
    "integrationSetupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "aiFeatureTrialCompleted" BOOLEAN NOT NULL DEFAULT false,
    "acosDigitalTwinTourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "advancedFeaturesTourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tooltipsShown" JSONB NOT NULL DEFAULT '[]',
    "skippedFlows" JSONB NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "lastActiveFlow" TEXT,
    "lastActiveStep" INTEGER,
    "showHints" BOOLEAN NOT NULL DEFAULT true,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OnboardingEvent
-- Logs onboarding analytics events (flow starts, step views, completions)
CREATE TABLE "OnboardingEvent" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "flowName" TEXT,
    "stepIndex" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OnboardingChecklist
-- Tracks organization-level setup checklist completion
CREATE TABLE "OnboardingChecklist" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "teamInvited" BOOLEAN NOT NULL DEFAULT false,
    "firstFrameworkAdded" BOOLEAN NOT NULL DEFAULT false,
    "firstEvidenceUploaded" BOOLEAN NOT NULL DEFAULT false,
    "firstControlPassed" BOOLEAN NOT NULL DEFAULT false,
    "integrationConnected" BOOLEAN NOT NULL DEFAULT false,
    "aiFeatureUsed" BOOLEAN NOT NULL DEFAULT false,
    "firstReportGenerated" BOOLEAN NOT NULL DEFAULT false,
    "acosConfigured" BOOLEAN NOT NULL DEFAULT false,
    "digitalTwinActivated" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: OnboardingProgress unique constraint (one record per user per org)
CREATE UNIQUE INDEX "OnboardingProgress_userId_organizationId_key" ON "OnboardingProgress"("userId", "organizationId");

-- CreateIndex: OnboardingProgress indexes
CREATE INDEX "OnboardingProgress_organizationId_idx" ON "OnboardingProgress"("organizationId");

-- CreateIndex: OnboardingEvent indexes
CREATE INDEX "OnboardingEvent_userId_idx" ON "OnboardingEvent"("userId");
CREATE INDEX "OnboardingEvent_organizationId_idx" ON "OnboardingEvent"("organizationId");
CREATE INDEX "OnboardingEvent_eventType_idx" ON "OnboardingEvent"("eventType");

-- CreateIndex: OnboardingChecklist unique constraint (one record per org)
CREATE UNIQUE INDEX "OnboardingChecklist_organizationId_key" ON "OnboardingChecklist"("organizationId");

-- AddForeignKey: OnboardingProgress -> User
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: OnboardingProgress -> Organization
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: OnboardingChecklist -> Organization
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
