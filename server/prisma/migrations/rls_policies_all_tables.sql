-- =====================================================================
-- ComplyEasyAI — Organization-Based Row-Level Security (RLS)
-- =====================================================================
-- Finding A1/A2 remediation: make DB-layer tenant isolation REAL and
-- reproducible from source.
--
-- This file is SELF-CONTAINED and IDEMPOTENT. It:
--   1. (Re)defines the org-context accessor function used by every policy.
--   2. ENABLEs RLS on every tenant-scoped table (those with an
--      "organizationId" column, derived from prisma/schema.prisma).
--   3. (Re)creates a single "org_isolation" policy per table that scopes
--      all commands (SELECT/INSERT/UPDATE/DELETE) to the caller's org.
--      Each policy carries BOTH a USING predicate (read / existing-row
--      targeting for SELECT/UPDATE/DELETE) and a WITH CHECK predicate
--      (write-side enforcement on the INSERT row and the UPDATE post-image),
--      so a tenant connection cannot insert or relocate a row into another
--      org's "organizationId".
--
-- Org context is supplied at runtime by the application via the GUC
-- "app.current_org", set with set_config('app.current_org', $org, true)
-- inside the per-request transaction (see server/src/config/orgContext.ts
-- and server/src/config/database.ts). The Supabase/PostgREST JWT-claims
-- path is intentionally NOT used here — the Express/Prisma backend never
-- sets request.jwt.claims.
--
-- SAFETY: This script is ADDITIVE-SAFE. It does NOT issue FORCE ROW LEVEL
-- SECURITY. While the application DB role still has BYPASSRLS (or owns the
-- tables), these policies are inert and cannot break existing reads/writes.
-- The breaking lockdown (FORCE + least-privilege role swap) is applied
-- separately by migration 20260604_enforce_rls/migration.sql — see
-- RLS_DEPLOY_RUNBOOK.md for the ordered, non-breaking deploy sequence.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Org-context accessor: reads the per-transaction GUC set by the app.
-- The second arg (true) to current_setting makes a missing GUC return
-- NULL instead of erroring. When NULL (e.g. unauthenticated/public
-- request or a connection without context), the policy predicate
-- "organizationId = NULL" yields UNKNOWN -> no rows match, which is the
-- safe default once FORCE RLS is in effect.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS text
LANGUAGE sql
STABLE
AS $func$
  SELECT current_setting('app.current_org', true)
$func$;

-- AISuggestion
ALTER TABLE "AISuggestion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AISuggestion";
CREATE POLICY org_isolation ON "AISuggestion"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AISystem
ALTER TABLE "AISystem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AISystem";
CREATE POLICY org_isolation ON "AISystem"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AITransparencyNotice
ALTER TABLE "AITransparencyNotice" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AITransparencyNotice";
CREATE POLICY org_isolation ON "AITransparencyNotice"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AccessReview
ALTER TABLE "AccessReview" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AccessReview";
CREATE POLICY org_isolation ON "AccessReview"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AgenticAction
ALTER TABLE "AgenticAction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AgenticAction";
CREATE POLICY org_isolation ON "AgenticAction"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ApiKey
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ApiKey";
CREATE POLICY org_isolation ON "ApiKey"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Asset
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Asset";
CREATE POLICY org_isolation ON "Asset"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AuditEngagement
ALTER TABLE "AuditEngagement" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AuditEngagement";
CREATE POLICY org_isolation ON "AuditEngagement"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AuditFinding
ALTER TABLE "AuditFinding" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AuditFinding";
CREATE POLICY org_isolation ON "AuditFinding"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AuditLog";
CREATE POLICY org_isolation ON "AuditLog"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AuditorProfile
ALTER TABLE "AuditorProfile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AuditorProfile";
CREATE POLICY org_isolation ON "AuditorProfile"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AzurePolicyCompliance
ALTER TABLE "AzurePolicyCompliance" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AzurePolicyCompliance";
CREATE POLICY org_isolation ON "AzurePolicyCompliance"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AzureResource
ALTER TABLE "AzureResource" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AzureResource";
CREATE POLICY org_isolation ON "AzureResource"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AzureSecurityAlert
ALTER TABLE "AzureSecurityAlert" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AzureSecurityAlert";
CREATE POLICY org_isolation ON "AzureSecurityAlert"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AzureSecurityFinding
ALTER TABLE "AzureSecurityFinding" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AzureSecurityFinding";
CREATE POLICY org_isolation ON "AzureSecurityFinding"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AzureSyncJob
ALTER TABLE "AzureSyncJob" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AzureSyncJob";
CREATE POLICY org_isolation ON "AzureSyncJob"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- AzureUser
ALTER TABLE "AzureUser" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "AzureUser";
CREATE POLICY org_isolation ON "AzureUser"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BCPPlan
ALTER TABLE "BCPPlan" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BCPPlan";
CREATE POLICY org_isolation ON "BCPPlan"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BCRProgram
ALTER TABLE "BCRProgram" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BCRProgram";
CREATE POLICY org_isolation ON "BCRProgram"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BrandingConfig
ALTER TABLE "BrandingConfig" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BrandingConfig";
CREATE POLICY org_isolation ON "BrandingConfig"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BreachIncident
ALTER TABLE "BreachIncident" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BreachIncident";
CREATE POLICY org_isolation ON "BreachIncident"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BreachTemplate
ALTER TABLE "BreachTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BreachTemplate";
CREATE POLICY org_isolation ON "BreachTemplate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BusinessAssociateAgreement
ALTER TABLE "BusinessAssociateAgreement" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BusinessAssociateAgreement";
CREATE POLICY org_isolation ON "BusinessAssociateAgreement"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- BusinessProcess
ALTER TABLE "BusinessProcess" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "BusinessProcess";
CREATE POLICY org_isolation ON "BusinessProcess"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CEProduct
ALTER TABLE "CEProduct" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CEProduct";
CREATE POLICY org_isolation ON "CEProduct"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CICDGatePolicy
ALTER TABLE "CICDGatePolicy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CICDGatePolicy";
CREATE POLICY org_isolation ON "CICDGatePolicy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CICDGateResult
ALTER TABLE "CICDGateResult" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CICDGateResult";
CREATE POLICY org_isolation ON "CICDGateResult"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Certification
ALTER TABLE "Certification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Certification";
CREATE POLICY org_isolation ON "Certification"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ChangeImpact
ALTER TABLE "ChangeImpact" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ChangeImpact";
CREATE POLICY org_isolation ON "ChangeImpact"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ChatConversation
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ChatConversation";
CREATE POLICY org_isolation ON "ChatConversation"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CompensatingControlWorksheet
ALTER TABLE "CompensatingControlWorksheet" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CompensatingControlWorksheet";
CREATE POLICY org_isolation ON "CompensatingControlWorksheet"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceCost
ALTER TABLE "ComplianceCost" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceCost";
CREATE POLICY org_isolation ON "ComplianceCost"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceDeadline
ALTER TABLE "ComplianceDeadline" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceDeadline";
CREATE POLICY org_isolation ON "ComplianceDeadline"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceDebt
ALTER TABLE "ComplianceDebt" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceDebt";
CREATE POLICY org_isolation ON "ComplianceDebt"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceException
ALTER TABLE "ComplianceException" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceException";
CREATE POLICY org_isolation ON "ComplianceException"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceFramework
ALTER TABLE "ComplianceFramework" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceFramework";
CREATE POLICY org_isolation ON "ComplianceFramework"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceGoal
ALTER TABLE "ComplianceGoal" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceGoal";
CREATE POLICY org_isolation ON "ComplianceGoal"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CompliancePolicy
ALTER TABLE "CompliancePolicy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CompliancePolicy";
CREATE POLICY org_isolation ON "CompliancePolicy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ComplianceTrajectory
ALTER TABLE "ComplianceTrajectory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ComplianceTrajectory";
CREATE POLICY org_isolation ON "ComplianceTrajectory"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ConsentPreference
ALTER TABLE "ConsentPreference" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ConsentPreference";
CREATE POLICY org_isolation ON "ConsentPreference"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ConsentRecord
ALTER TABLE "ConsentRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ConsentRecord";
CREATE POLICY org_isolation ON "ConsentRecord"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ContinuousMonitor
ALTER TABLE "ContinuousMonitor" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ContinuousMonitor";
CREATE POLICY org_isolation ON "ContinuousMonitor"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ControlEffectivenessRecord
ALTER TABLE "ControlEffectivenessRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ControlEffectivenessRecord";
CREATE POLICY org_isolation ON "ControlEffectivenessRecord"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ControlLoop
ALTER TABLE "ControlLoop" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ControlLoop";
CREATE POLICY org_isolation ON "ControlLoop"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ControlLoopHistory
ALTER TABLE "ControlLoopHistory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ControlLoopHistory";
CREATE POLICY org_isolation ON "ControlLoopHistory"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ControlTest
ALTER TABLE "ControlTest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ControlTest";
CREATE POLICY org_isolation ON "ControlTest"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CustomDashboard
ALTER TABLE "CustomDashboard" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CustomDashboard";
CREATE POLICY org_isolation ON "CustomDashboard"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CustomReport
ALTER TABLE "CustomReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CustomReport";
CREATE POLICY org_isolation ON "CustomReport"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- CustomRole
ALTER TABLE "CustomRole" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "CustomRole";
CREATE POLICY org_isolation ON "CustomRole"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DMAComplianceReport
ALTER TABLE "DMAComplianceReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DMAComplianceReport";
CREATE POLICY org_isolation ON "DMAComplianceReport"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DMAGatekeeper
ALTER TABLE "DMAGatekeeper" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DMAGatekeeper";
CREATE POLICY org_isolation ON "DMAGatekeeper"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DMAObligationTracking
ALTER TABLE "DMAObligationTracking" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DMAObligationTracking";
CREATE POLICY org_isolation ON "DMAObligationTracking"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DORAICTIncident
ALTER TABLE "DORAICTIncident" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DORAICTIncident";
CREATE POLICY org_isolation ON "DORAICTIncident"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DORAICTRiskAssessment
ALTER TABLE "DORAICTRiskAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DORAICTRiskAssessment";
CREATE POLICY org_isolation ON "DORAICTRiskAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DORAInformationRegister
ALTER TABLE "DORAInformationRegister" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DORAInformationRegister";
CREATE POLICY org_isolation ON "DORAInformationRegister"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DORAResilienceTest
ALTER TABLE "DORAResilienceTest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DORAResilienceTest";
CREATE POLICY org_isolation ON "DORAResilienceTest"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DORAThirdPartyProvider
ALTER TABLE "DORAThirdPartyProvider" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DORAThirdPartyProvider";
CREATE POLICY org_isolation ON "DORAThirdPartyProvider"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DPOProfile
ALTER TABLE "DPOProfile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DPOProfile";
CREATE POLICY org_isolation ON "DPOProfile"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSAAdRepository
ALTER TABLE "DSAAdRepository" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSAAdRepository";
CREATE POLICY org_isolation ON "DSAAdRepository"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSAContentModeration
ALTER TABLE "DSAContentModeration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSAContentModeration";
CREATE POLICY org_isolation ON "DSAContentModeration"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSAIllegalContentReport
ALTER TABLE "DSAIllegalContentReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSAIllegalContentReport";
CREATE POLICY org_isolation ON "DSAIllegalContentReport"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSANonPersonalizedFeed
ALTER TABLE "DSANonPersonalizedFeed" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSANonPersonalizedFeed";
CREATE POLICY org_isolation ON "DSANonPersonalizedFeed"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSAPlatform
ALTER TABLE "DSAPlatform" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSAPlatform";
CREATE POLICY org_isolation ON "DSAPlatform"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSARRequest
ALTER TABLE "DSARRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSARRequest";
CREATE POLICY org_isolation ON "DSARRequest"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSARiskAssessment
ALTER TABLE "DSARiskAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSARiskAssessment";
CREATE POLICY org_isolation ON "DSARiskAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DSATransparencyReport
ALTER TABLE "DSATransparencyReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DSATransparencyReport";
CREATE POLICY org_isolation ON "DSATransparencyReport"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DashboardWidget
ALTER TABLE "DashboardWidget" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DashboardWidget";
CREATE POLICY org_isolation ON "DashboardWidget"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DataDeletionRequest
ALTER TABLE "DataDeletionRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DataDeletionRequest";
CREATE POLICY org_isolation ON "DataDeletionRequest"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DataMap
ALTER TABLE "DataMap" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DataMap";
CREATE POLICY org_isolation ON "DataMap"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DataProtectionImpactAssessment
ALTER TABLE "DataProtectionImpactAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DataProtectionImpactAssessment";
CREATE POLICY org_isolation ON "DataProtectionImpactAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DeviceTrust
ALTER TABLE "DeviceTrust" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DeviceTrust";
CREATE POLICY org_isolation ON "DeviceTrust"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- DigitalProductPassport
ALTER TABLE "DigitalProductPassport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "DigitalProductPassport";
CREATE POLICY org_isolation ON "DigitalProductPassport"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ESGMetric
ALTER TABLE "ESGMetric" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ESGMetric";
CREATE POLICY org_isolation ON "ESGMetric"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EUAIActRiskAssessment
ALTER TABLE "EUAIActRiskAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EUAIActRiskAssessment";
CREATE POLICY org_isolation ON "EUAIActRiskAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EUAIActSystem
ALTER TABLE "EUAIActSystem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EUAIActSystem";
CREATE POLICY org_isolation ON "EUAIActSystem"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EUAIActTransparencyReport
ALTER TABLE "EUAIActTransparencyReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EUAIActTransparencyReport";
CREATE POLICY org_isolation ON "EUAIActTransparencyReport"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EdgeComplianceCheck
ALTER TABLE "EdgeComplianceCheck" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EdgeComplianceCheck";
CREATE POLICY org_isolation ON "EdgeComplianceCheck"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EvidenceAnalysis
ALTER TABLE "EvidenceAnalysis" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EvidenceAnalysis";
CREATE POLICY org_isolation ON "EvidenceAnalysis"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EvidenceAttestation
ALTER TABLE "EvidenceAttestation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EvidenceAttestation";
CREATE POLICY org_isolation ON "EvidenceAttestation"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- EvidenceCollectionRule
ALTER TABLE "EvidenceCollectionRule" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "EvidenceCollectionRule";
CREATE POLICY org_isolation ON "EvidenceCollectionRule"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- FeatureSubscription
ALTER TABLE "FeatureSubscription" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "FeatureSubscription";
CREATE POLICY org_isolation ON "FeatureSubscription"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- FederatedSwarmAggregation
ALTER TABLE "FederatedSwarmAggregation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "FederatedSwarmAggregation";
CREATE POLICY org_isolation ON "FederatedSwarmAggregation"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- FederatedSwarmPeer
ALTER TABLE "FederatedSwarmPeer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "FederatedSwarmPeer";
CREATE POLICY org_isolation ON "FederatedSwarmPeer"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- FileUpload
ALTER TABLE "FileUpload" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "FileUpload";
CREATE POLICY org_isolation ON "FileUpload"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- GNNModel
ALTER TABLE "GNNModel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "GNNModel";
CREATE POLICY org_isolation ON "GNNModel"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- GRCWorkflow
ALTER TABLE "GRCWorkflow" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "GRCWorkflow";
CREATE POLICY org_isolation ON "GRCWorkflow"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- GapAnalysis
ALTER TABLE "GapAnalysis" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "GapAnalysis";
CREATE POLICY org_isolation ON "GapAnalysis"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- GovernanceBody
ALTER TABLE "GovernanceBody" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "GovernanceBody";
CREATE POLICY org_isolation ON "GovernanceBody"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- GrcIncident
ALTER TABLE "GrcIncident" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "GrcIncident";
CREATE POLICY org_isolation ON "GrcIncident"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- HIPAABreachRiskAssessment
ALTER TABLE "HIPAABreachRiskAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "HIPAABreachRiskAssessment";
CREATE POLICY org_isolation ON "HIPAABreachRiskAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ISO27001Assessment
ALTER TABLE "ISO27001Assessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ISO27001Assessment";
CREATE POLICY org_isolation ON "ISO27001Assessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ISO27001CorrectiveAction
ALTER TABLE "ISO27001CorrectiveAction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ISO27001CorrectiveAction";
CREATE POLICY org_isolation ON "ISO27001CorrectiveAction"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ISO27001RiskScenario
ALTER TABLE "ISO27001RiskScenario" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ISO27001RiskScenario";
CREATE POLICY org_isolation ON "ISO27001RiskScenario"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ISO27001SoA
ALTER TABLE "ISO27001SoA" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ISO27001SoA";
CREATE POLICY org_isolation ON "ISO27001SoA"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Integration
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Integration";
CREATE POLICY org_isolation ON "Integration"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- IoTDevice
ALTER TABLE "IoTDevice" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "IoTDevice";
CREATE POLICY org_isolation ON "IoTDevice"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Issue
ALTER TABLE "Issue" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Issue";
CREATE POLICY org_isolation ON "Issue"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- JITAccessRequest
ALTER TABLE "JITAccessRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "JITAccessRequest";
CREATE POLICY org_isolation ON "JITAccessRequest"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- JITPrivacyNotice
ALTER TABLE "JITPrivacyNotice" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "JITPrivacyNotice";
CREATE POLICY org_isolation ON "JITPrivacyNotice"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- JITSession
ALTER TABLE "JITSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "JITSession";
CREATE POLICY org_isolation ON "JITSession"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- KeyRotationPolicy
ALTER TABLE "KeyRotationPolicy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "KeyRotationPolicy";
CREATE POLICY org_isolation ON "KeyRotationPolicy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- KeyUsage
ALTER TABLE "KeyUsage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "KeyUsage";
CREATE POLICY org_isolation ON "KeyUsage"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- KnowledgeGraphEntity
ALTER TABLE "KnowledgeGraphEntity" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "KnowledgeGraphEntity";
CREATE POLICY org_isolation ON "KnowledgeGraphEntity"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- KnowledgeGraphRelationship
ALTER TABLE "KnowledgeGraphRelationship" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "KnowledgeGraphRelationship";
CREATE POLICY org_isolation ON "KnowledgeGraphRelationship"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- LDAPRoleMapping
ALTER TABLE "LDAPRoleMapping" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "LDAPRoleMapping";
CREATE POLICY org_isolation ON "LDAPRoleMapping"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- LifecycleAssessment
ALTER TABLE "LifecycleAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "LifecycleAssessment";
CREATE POLICY org_isolation ON "LifecycleAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- LivenessChallenge
ALTER TABLE "LivenessChallenge" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "LivenessChallenge";
CREATE POLICY org_isolation ON "LivenessChallenge"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- MDMPolicy
ALTER TABLE "MDMPolicy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "MDMPolicy";
CREATE POLICY org_isolation ON "MDMPolicy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ManagedDevice
ALTER TABLE "ManagedDevice" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ManagedDevice";
CREATE POLICY org_isolation ON "ManagedDevice"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- MaterialityAssessment
ALTER TABLE "MaterialityAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "MaterialityAssessment";
CREATE POLICY org_isolation ON "MaterialityAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- MaturityAssessment
ALTER TABLE "MaturityAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "MaturityAssessment";
CREATE POLICY org_isolation ON "MaturityAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- MetricsHistory
ALTER TABLE "MetricsHistory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "MetricsHistory";
CREATE POLICY org_isolation ON "MetricsHistory"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NPSInvitation
ALTER TABLE "NPSInvitation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NPSInvitation";
CREATE POLICY org_isolation ON "NPSInvitation"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NPSResponse
ALTER TABLE "NPSResponse" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NPSResponse";
CREATE POLICY org_isolation ON "NPSResponse"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NetworkSegment
ALTER TABLE "NetworkSegment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NetworkSegment";
CREATE POLICY org_isolation ON "NetworkSegment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NeuroSymbolicReasoning
ALTER TABLE "NeuroSymbolicReasoning" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NeuroSymbolicReasoning";
CREATE POLICY org_isolation ON "NeuroSymbolicReasoning"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NistCsfActionItem
ALTER TABLE "NistCsfActionItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NistCsfActionItem";
CREATE POLICY org_isolation ON "NistCsfActionItem"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NistCsfGapAnalysis
ALTER TABLE "NistCsfGapAnalysis" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NistCsfGapAnalysis";
CREATE POLICY org_isolation ON "NistCsfGapAnalysis"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NistCsfProfile
ALTER TABLE "NistCsfProfile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NistCsfProfile";
CREATE POLICY org_isolation ON "NistCsfProfile"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- NistCsfSubcategoryAssessment
ALTER TABLE "NistCsfSubcategoryAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "NistCsfSubcategoryAssessment";
CREATE POLICY org_isolation ON "NistCsfSubcategoryAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Notification
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Notification";
CREATE POLICY org_isolation ON "Notification"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- OnboardingChecklist
ALTER TABLE "OnboardingChecklist" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "OnboardingChecklist";
CREATE POLICY org_isolation ON "OnboardingChecklist"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- OnboardingEvent
ALTER TABLE "OnboardingEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "OnboardingEvent";
CREATE POLICY org_isolation ON "OnboardingEvent"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- OnboardingProgress
ALTER TABLE "OnboardingProgress" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "OnboardingProgress";
CREATE POLICY org_isolation ON "OnboardingProgress"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PCIAOC
ALTER TABLE "PCIAOC" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PCIAOC";
CREATE POLICY org_isolation ON "PCIAOC"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PCIEvidence
ALTER TABLE "PCIEvidence" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PCIEvidence";
CREATE POLICY org_isolation ON "PCIEvidence"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PCIROC
ALTER TABLE "PCIROC" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PCIROC";
CREATE POLICY org_isolation ON "PCIROC"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PCIRequirement
ALTER TABLE "PCIRequirement" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PCIRequirement";
CREATE POLICY org_isolation ON "PCIRequirement"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PCIScope
ALTER TABLE "PCIScope" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PCIScope";
CREATE POLICY org_isolation ON "PCIScope"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PHIAccessGrant
ALTER TABLE "PHIAccessGrant" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PHIAccessGrant";
CREATE POLICY org_isolation ON "PHIAccessGrant"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PHIRecord
ALTER TABLE "PHIRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PHIRecord";
CREATE POLICY org_isolation ON "PHIRecord"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Personnel
ALTER TABLE "Personnel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Personnel";
CREATE POLICY org_isolation ON "Personnel"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PhishingTraining
ALTER TABLE "PhishingTraining" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PhishingTraining";
CREATE POLICY org_isolation ON "PhishingTraining"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Policy
ALTER TABLE "Policy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Policy";
CREATE POLICY org_isolation ON "Policy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PolicyTemplate
ALTER TABLE "PolicyTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PolicyTemplate";
CREATE POLICY org_isolation ON "PolicyTemplate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- PrivacyBudgetLedger
ALTER TABLE "PrivacyBudgetLedger" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "PrivacyBudgetLedger";
CREATE POLICY org_isolation ON "PrivacyBudgetLedger"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ProcessMap
ALTER TABLE "ProcessMap" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ProcessMap";
CREATE POLICY org_isolation ON "ProcessMap"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ProcessingActivityRecord
ALTER TABLE "ProcessingActivityRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ProcessingActivityRecord";
CREATE POLICY org_isolation ON "ProcessingActivityRecord"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ProcessingRestriction
ALTER TABLE "ProcessingRestriction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ProcessingRestriction";
CREATE POLICY org_isolation ON "ProcessingRestriction"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ProductDecommission
ALTER TABLE "ProductDecommission" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ProductDecommission";
CREATE POLICY org_isolation ON "ProductDecommission"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ProductLifecycle
ALTER TABLE "ProductLifecycle" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ProductLifecycle";
CREATE POLICY org_isolation ON "ProductLifecycle"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ProductRecall
ALTER TABLE "ProductRecall" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ProductRecall";
CREATE POLICY org_isolation ON "ProductRecall"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- QSAFinding
ALTER TABLE "QSAFinding" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "QSAFinding";
CREATE POLICY org_isolation ON "QSAFinding"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Questionnaire
ALTER TABLE "Questionnaire" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Questionnaire";
CREATE POLICY org_isolation ON "Questionnaire"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- QuestionnaireTemplate
ALTER TABLE "QuestionnaireTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "QuestionnaireTemplate";
CREATE POLICY org_isolation ON "QuestionnaireTemplate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RFPResponse
ALTER TABLE "RFPResponse" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RFPResponse";
CREATE POLICY org_isolation ON "RFPResponse"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RedTeamResult
ALTER TABLE "RedTeamResult" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RedTeamResult";
CREATE POLICY org_isolation ON "RedTeamResult"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RegulationModuleData
ALTER TABLE "RegulationModuleData" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RegulationModuleData";
CREATE POLICY org_isolation ON "RegulationModuleData"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RegulatoryChange
ALTER TABLE "RegulatoryChange" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RegulatoryChange";
CREATE POLICY org_isolation ON "RegulatoryChange"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RegulatoryChangeImpact
ALTER TABLE "RegulatoryChangeImpact" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RegulatoryChangeImpact";
CREATE POLICY org_isolation ON "RegulatoryChangeImpact"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RegulatoryContact
ALTER TABLE "RegulatoryContact" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RegulatoryContact";
CREATE POLICY org_isolation ON "RegulatoryContact"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RegulatoryFeed
ALTER TABLE "RegulatoryFeed" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RegulatoryFeed";
CREATE POLICY org_isolation ON "RegulatoryFeed"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ReportTemplate
ALTER TABLE "ReportTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ReportTemplate";
CREATE POLICY org_isolation ON "ReportTemplate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RetentionPolicy
ALTER TABLE "RetentionPolicy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RetentionPolicy";
CREATE POLICY org_isolation ON "RetentionPolicy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RiskAssessment
ALTER TABLE "RiskAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RiskAssessment";
CREATE POLICY org_isolation ON "RiskAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RiskItem
ALTER TABLE "RiskItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RiskItem";
CREATE POLICY org_isolation ON "RiskItem"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RiskPrediction
ALTER TABLE "RiskPrediction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RiskPrediction";
CREATE POLICY org_isolation ON "RiskPrediction"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- RuleInference
ALTER TABLE "RuleInference" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "RuleInference";
CREATE POLICY org_isolation ON "RuleInference"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SBOMEntry
ALTER TABLE "SBOMEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SBOMEntry";
CREATE POLICY org_isolation ON "SBOMEntry"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SBOMRepository
ALTER TABLE "SBOMRepository" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SBOMRepository";
CREATE POLICY org_isolation ON "SBOMRepository"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SCAFFOLDControlVariate
ALTER TABLE "SCAFFOLDControlVariate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SCAFFOLDControlVariate";
CREATE POLICY org_isolation ON "SCAFFOLDControlVariate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SCCTemplate
ALTER TABLE "SCCTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SCCTemplate";
CREATE POLICY org_isolation ON "SCCTemplate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SCIMConfiguration
ALTER TABLE "SCIMConfiguration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SCIMConfiguration";
CREATE POLICY org_isolation ON "SCIMConfiguration"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOC2CUEC
ALTER TABLE "SOC2CUEC" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOC2CUEC";
CREATE POLICY org_isolation ON "SOC2CUEC"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOC2Control
ALTER TABLE "SOC2Control" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOC2Control";
CREATE POLICY org_isolation ON "SOC2Control"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOC2Engagement
ALTER TABLE "SOC2Engagement" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOC2Engagement";
CREATE POLICY org_isolation ON "SOC2Engagement"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOC2EvidenceSample
ALTER TABLE "SOC2EvidenceSample" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOC2EvidenceSample";
CREATE POLICY org_isolation ON "SOC2EvidenceSample"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOC2Exception
ALTER TABLE "SOC2Exception" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOC2Exception";
CREATE POLICY org_isolation ON "SOC2Exception"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOC2ManagementAssertion
ALTER TABLE "SOC2ManagementAssertion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOC2ManagementAssertion";
CREATE POLICY org_isolation ON "SOC2ManagementAssertion"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOXAssessment
ALTER TABLE "SOXAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOXAssessment";
CREATE POLICY org_isolation ON "SOXAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SOXControl
ALTER TABLE "SOXControl" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SOXControl";
CREATE POLICY org_isolation ON "SOXControl"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SSOConfiguration
ALTER TABLE "SSOConfiguration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SSOConfiguration";
CREATE POLICY org_isolation ON "SSOConfiguration"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SearchIndex
ALTER TABLE "SearchIndex" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SearchIndex";
CREATE POLICY org_isolation ON "SearchIndex"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SecurityTraining
ALTER TABLE "SecurityTraining" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SecurityTraining";
CREATE POLICY org_isolation ON "SecurityTraining"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SecurityTrainingRecord
ALTER TABLE "SecurityTrainingRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SecurityTrainingRecord";
CREATE POLICY org_isolation ON "SecurityTrainingRecord"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SimulationResult
ALTER TABLE "SimulationResult" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SimulationResult";
CREATE POLICY org_isolation ON "SimulationResult"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SimulationScenario
ALTER TABLE "SimulationScenario" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SimulationScenario";
CREATE POLICY org_isolation ON "SimulationScenario"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SoDRule
ALTER TABLE "SoDRule" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SoDRule";
CREATE POLICY org_isolation ON "SoDRule"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SoDViolation
ALTER TABLE "SoDViolation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SoDViolation";
CREATE POLICY org_isolation ON "SoDViolation"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SubscriptionHistory
ALTER TABLE "SubscriptionHistory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SubscriptionHistory";
CREATE POLICY org_isolation ON "SubscriptionHistory"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SurveillancePlan
ALTER TABLE "SurveillancePlan" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SurveillancePlan";
CREATE POLICY org_isolation ON "SurveillancePlan"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SwarmAgent
ALTER TABLE "SwarmAgent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SwarmAgent";
CREATE POLICY org_isolation ON "SwarmAgent"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SwarmInsight
ALTER TABLE "SwarmInsight" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SwarmInsight";
CREATE POLICY org_isolation ON "SwarmInsight"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SwarmTask
ALTER TABLE "SwarmTask" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SwarmTask";
CREATE POLICY org_isolation ON "SwarmTask"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SwarmTaskAlert
ALTER TABLE "SwarmTaskAlert" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SwarmTaskAlert";
CREATE POLICY org_isolation ON "SwarmTaskAlert"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- SwarmTaskMetric
ALTER TABLE "SwarmTaskMetric" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "SwarmTaskMetric";
CREATE POLICY org_isolation ON "SwarmTaskMetric"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- TIAAssessment
ALTER TABLE "TIAAssessment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "TIAAssessment";
CREATE POLICY org_isolation ON "TIAAssessment"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- TranscriptionResult
ALTER TABLE "TranscriptionResult" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "TranscriptionResult";
CREATE POLICY org_isolation ON "TranscriptionResult"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- TrustCertificate
ALTER TABLE "TrustCertificate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "TrustCertificate";
CREATE POLICY org_isolation ON "TrustCertificate"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- UsageTracking
ALTER TABLE "UsageTracking" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "UsageTracking";
CREATE POLICY org_isolation ON "UsageTracking"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "User";
CREATE POLICY org_isolation ON "User"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- UserSession
ALTER TABLE "UserSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "UserSession";
CREATE POLICY org_isolation ON "UserSession"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- UserSigningKey
ALTER TABLE "UserSigningKey" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "UserSigningKey";
CREATE POLICY org_isolation ON "UserSigningKey"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- VRCollaborativeSession
ALTER TABLE "VRCollaborativeSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "VRCollaborativeSession";
CREATE POLICY org_isolation ON "VRCollaborativeSession"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- VRTrainingScenario
ALTER TABLE "VRTrainingScenario" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "VRTrainingScenario";
CREATE POLICY org_isolation ON "VRTrainingScenario"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- VRTrainingSession
ALTER TABLE "VRTrainingSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "VRTrainingSession";
CREATE POLICY org_isolation ON "VRTrainingSession"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Vendor
ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Vendor";
CREATE POLICY org_isolation ON "Vendor"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- VendorMonitoringCheck
ALTER TABLE "VendorMonitoringCheck" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "VendorMonitoringCheck";
CREATE POLICY org_isolation ON "VendorMonitoringCheck"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- WebRTCSession
ALTER TABLE "WebRTCSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "WebRTCSession";
CREATE POLICY org_isolation ON "WebRTCSession"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- Webhook
ALTER TABLE "Webhook" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Webhook";
CREATE POLICY org_isolation ON "Webhook"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- WebhookEvent
ALTER TABLE "WebhookEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "WebhookEvent";
CREATE POLICY org_isolation ON "WebhookEvent"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());

-- ZeroTrustPolicy
ALTER TABLE "ZeroTrustPolicy" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "ZeroTrustPolicy";
CREATE POLICY org_isolation ON "ZeroTrustPolicy"
  USING ("organizationId" = public.get_current_organization_id())
  WITH CHECK ("organizationId" = public.get_current_organization_id());
