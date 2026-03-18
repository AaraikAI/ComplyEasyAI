-- Add Enterprise GRC module checklist columns to OnboardingChecklist
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "riskHeatmapViewed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "regulatoryTrackerViewed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "vendorMonitoringConfigured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "privacyPlatformViewed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "incidentManagementViewed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "controlTestingConfigured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "auditPrepStarted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OnboardingChecklist" ADD COLUMN IF NOT EXISTS "workflowAutomationConfigured" BOOLEAN NOT NULL DEFAULT false;
