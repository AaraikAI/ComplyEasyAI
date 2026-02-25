-- Complete RLS Policies for Organization-Based Access Control
-- Run this in Supabase SQL Editor (split into batches if needed)

-- =====================================================
-- BATCH 4: Compliance and Consent Tables
-- =====================================================

-- ComplianceDebt
DROP POLICY IF EXISTS "org_isolation_select" ON "ComplianceDebt";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ComplianceDebt";
DROP POLICY IF EXISTS "org_isolation_update" ON "ComplianceDebt";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ComplianceDebt";
CREATE POLICY "org_isolation_select" ON "ComplianceDebt" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ComplianceDebt" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ComplianceDebt" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ComplianceDebt" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ComplianceFramework
DROP POLICY IF EXISTS "org_isolation_select" ON "ComplianceFramework";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ComplianceFramework";
DROP POLICY IF EXISTS "org_isolation_update" ON "ComplianceFramework";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ComplianceFramework";
CREATE POLICY "org_isolation_select" ON "ComplianceFramework" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ComplianceFramework" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ComplianceFramework" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ComplianceFramework" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ComplianceGoal
DROP POLICY IF EXISTS "org_isolation_select" ON "ComplianceGoal";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ComplianceGoal";
DROP POLICY IF EXISTS "org_isolation_update" ON "ComplianceGoal";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ComplianceGoal";
CREATE POLICY "org_isolation_select" ON "ComplianceGoal" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ComplianceGoal" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ComplianceGoal" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ComplianceGoal" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- CompliancePolicy
DROP POLICY IF EXISTS "org_isolation_select" ON "CompliancePolicy";
DROP POLICY IF EXISTS "org_isolation_insert" ON "CompliancePolicy";
DROP POLICY IF EXISTS "org_isolation_update" ON "CompliancePolicy";
DROP POLICY IF EXISTS "org_isolation_delete" ON "CompliancePolicy";
CREATE POLICY "org_isolation_select" ON "CompliancePolicy" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "CompliancePolicy" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "CompliancePolicy" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "CompliancePolicy" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ComplianceTrajectory
DROP POLICY IF EXISTS "org_isolation_select" ON "ComplianceTrajectory";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ComplianceTrajectory";
DROP POLICY IF EXISTS "org_isolation_update" ON "ComplianceTrajectory";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ComplianceTrajectory";
CREATE POLICY "org_isolation_select" ON "ComplianceTrajectory" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ComplianceTrajectory" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ComplianceTrajectory" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ComplianceTrajectory" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ConsentPreference
DROP POLICY IF EXISTS "org_isolation_select" ON "ConsentPreference";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ConsentPreference";
DROP POLICY IF EXISTS "org_isolation_update" ON "ConsentPreference";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ConsentPreference";
CREATE POLICY "org_isolation_select" ON "ConsentPreference" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ConsentPreference" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ConsentPreference" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ConsentPreference" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ConsentRecord
DROP POLICY IF EXISTS "org_isolation_select" ON "ConsentRecord";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ConsentRecord";
DROP POLICY IF EXISTS "org_isolation_update" ON "ConsentRecord";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ConsentRecord";
CREATE POLICY "org_isolation_select" ON "ConsentRecord" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ConsentRecord" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ConsentRecord" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ConsentRecord" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ContinuousMonitor
DROP POLICY IF EXISTS "org_isolation_select" ON "ContinuousMonitor";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ContinuousMonitor";
DROP POLICY IF EXISTS "org_isolation_update" ON "ContinuousMonitor";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ContinuousMonitor";
CREATE POLICY "org_isolation_select" ON "ContinuousMonitor" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ContinuousMonitor" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ContinuousMonitor" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ContinuousMonitor" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ControlLoop
DROP POLICY IF EXISTS "org_isolation_select" ON "ControlLoop";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ControlLoop";
DROP POLICY IF EXISTS "org_isolation_update" ON "ControlLoop";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ControlLoop";
CREATE POLICY "org_isolation_select" ON "ControlLoop" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ControlLoop" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ControlLoop" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ControlLoop" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ControlLoopHistory
DROP POLICY IF EXISTS "org_isolation_select" ON "ControlLoopHistory";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ControlLoopHistory";
DROP POLICY IF EXISTS "org_isolation_update" ON "ControlLoopHistory";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ControlLoopHistory";
CREATE POLICY "org_isolation_select" ON "ControlLoopHistory" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ControlLoopHistory" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ControlLoopHistory" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ControlLoopHistory" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- CustomReport
DROP POLICY IF EXISTS "org_isolation_select" ON "CustomReport";
DROP POLICY IF EXISTS "org_isolation_insert" ON "CustomReport";
DROP POLICY IF EXISTS "org_isolation_update" ON "CustomReport";
DROP POLICY IF EXISTS "org_isolation_delete" ON "CustomReport";
CREATE POLICY "org_isolation_select" ON "CustomReport" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "CustomReport" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "CustomReport" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "CustomReport" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 5: DMA and DORA Tables
-- =====================================================

-- DMAComplianceReport
DROP POLICY IF EXISTS "org_isolation_select" ON "DMAComplianceReport";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DMAComplianceReport";
DROP POLICY IF EXISTS "org_isolation_update" ON "DMAComplianceReport";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DMAComplianceReport";
CREATE POLICY "org_isolation_select" ON "DMAComplianceReport" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DMAComplianceReport" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DMAComplianceReport" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DMAComplianceReport" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DMAGatekeeper
DROP POLICY IF EXISTS "org_isolation_select" ON "DMAGatekeeper";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DMAGatekeeper";
DROP POLICY IF EXISTS "org_isolation_update" ON "DMAGatekeeper";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DMAGatekeeper";
CREATE POLICY "org_isolation_select" ON "DMAGatekeeper" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DMAGatekeeper" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DMAGatekeeper" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DMAGatekeeper" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DMAObligationTracking
DROP POLICY IF EXISTS "org_isolation_select" ON "DMAObligationTracking";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DMAObligationTracking";
DROP POLICY IF EXISTS "org_isolation_update" ON "DMAObligationTracking";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DMAObligationTracking";
CREATE POLICY "org_isolation_select" ON "DMAObligationTracking" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DMAObligationTracking" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DMAObligationTracking" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DMAObligationTracking" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DORAICTIncident
DROP POLICY IF EXISTS "org_isolation_select" ON "DORAICTIncident";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DORAICTIncident";
DROP POLICY IF EXISTS "org_isolation_update" ON "DORAICTIncident";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DORAICTIncident";
CREATE POLICY "org_isolation_select" ON "DORAICTIncident" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DORAICTIncident" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DORAICTIncident" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DORAICTIncident" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DORAICTRiskAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "DORAICTRiskAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DORAICTRiskAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "DORAICTRiskAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DORAICTRiskAssessment";
CREATE POLICY "org_isolation_select" ON "DORAICTRiskAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DORAICTRiskAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DORAICTRiskAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DORAICTRiskAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DORAInformationRegister
DROP POLICY IF EXISTS "org_isolation_select" ON "DORAInformationRegister";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DORAInformationRegister";
DROP POLICY IF EXISTS "org_isolation_update" ON "DORAInformationRegister";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DORAInformationRegister";
CREATE POLICY "org_isolation_select" ON "DORAInformationRegister" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DORAInformationRegister" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DORAInformationRegister" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DORAInformationRegister" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DORAResilienceTest
DROP POLICY IF EXISTS "org_isolation_select" ON "DORAResilienceTest";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DORAResilienceTest";
DROP POLICY IF EXISTS "org_isolation_update" ON "DORAResilienceTest";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DORAResilienceTest";
CREATE POLICY "org_isolation_select" ON "DORAResilienceTest" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DORAResilienceTest" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DORAResilienceTest" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DORAResilienceTest" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DORAThirdPartyProvider
DROP POLICY IF EXISTS "org_isolation_select" ON "DORAThirdPartyProvider";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DORAThirdPartyProvider";
DROP POLICY IF EXISTS "org_isolation_update" ON "DORAThirdPartyProvider";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DORAThirdPartyProvider";
CREATE POLICY "org_isolation_select" ON "DORAThirdPartyProvider" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DORAThirdPartyProvider" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DORAThirdPartyProvider" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DORAThirdPartyProvider" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DPOProfile
DROP POLICY IF EXISTS "org_isolation_select" ON "DPOProfile";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DPOProfile";
DROP POLICY IF EXISTS "org_isolation_update" ON "DPOProfile";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DPOProfile";
CREATE POLICY "org_isolation_select" ON "DPOProfile" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DPOProfile" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DPOProfile" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DPOProfile" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 6: DSA Tables
-- =====================================================

-- DSAAdRepository
DROP POLICY IF EXISTS "org_isolation_select" ON "DSAAdRepository";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSAAdRepository";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSAAdRepository";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSAAdRepository";
CREATE POLICY "org_isolation_select" ON "DSAAdRepository" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSAAdRepository" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSAAdRepository" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSAAdRepository" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSAContentModeration
DROP POLICY IF EXISTS "org_isolation_select" ON "DSAContentModeration";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSAContentModeration";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSAContentModeration";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSAContentModeration";
CREATE POLICY "org_isolation_select" ON "DSAContentModeration" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSAContentModeration" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSAContentModeration" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSAContentModeration" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSAIllegalContentReport
DROP POLICY IF EXISTS "org_isolation_select" ON "DSAIllegalContentReport";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSAIllegalContentReport";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSAIllegalContentReport";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSAIllegalContentReport";
CREATE POLICY "org_isolation_select" ON "DSAIllegalContentReport" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSAIllegalContentReport" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSAIllegalContentReport" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSAIllegalContentReport" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSANonPersonalizedFeed
DROP POLICY IF EXISTS "org_isolation_select" ON "DSANonPersonalizedFeed";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSANonPersonalizedFeed";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSANonPersonalizedFeed";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSANonPersonalizedFeed";
CREATE POLICY "org_isolation_select" ON "DSANonPersonalizedFeed" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSANonPersonalizedFeed" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSANonPersonalizedFeed" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSANonPersonalizedFeed" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSAPlatform
DROP POLICY IF EXISTS "org_isolation_select" ON "DSAPlatform";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSAPlatform";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSAPlatform";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSAPlatform";
CREATE POLICY "org_isolation_select" ON "DSAPlatform" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSAPlatform" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSAPlatform" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSAPlatform" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSARRequest
DROP POLICY IF EXISTS "org_isolation_select" ON "DSARRequest";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSARRequest";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSARRequest";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSARRequest";
CREATE POLICY "org_isolation_select" ON "DSARRequest" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSARRequest" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSARRequest" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSARRequest" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSARiskAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "DSARiskAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSARiskAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSARiskAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSARiskAssessment";
CREATE POLICY "org_isolation_select" ON "DSARiskAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSARiskAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSARiskAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSARiskAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DSATransparencyReport
DROP POLICY IF EXISTS "org_isolation_select" ON "DSATransparencyReport";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DSATransparencyReport";
DROP POLICY IF EXISTS "org_isolation_update" ON "DSATransparencyReport";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DSATransparencyReport";
CREATE POLICY "org_isolation_select" ON "DSATransparencyReport" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DSATransparencyReport" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DSATransparencyReport" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DSATransparencyReport" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DataDeletionRequest
DROP POLICY IF EXISTS "org_isolation_select" ON "DataDeletionRequest";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DataDeletionRequest";
DROP POLICY IF EXISTS "org_isolation_update" ON "DataDeletionRequest";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DataDeletionRequest";
CREATE POLICY "org_isolation_select" ON "DataDeletionRequest" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DataDeletionRequest" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DataDeletionRequest" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DataDeletionRequest" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DataMap
DROP POLICY IF EXISTS "org_isolation_select" ON "DataMap";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DataMap";
DROP POLICY IF EXISTS "org_isolation_update" ON "DataMap";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DataMap";
CREATE POLICY "org_isolation_select" ON "DataMap" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DataMap" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DataMap" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DataMap" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 7: D-E-F Tables
-- =====================================================

-- DeviceTrust
DROP POLICY IF EXISTS "org_isolation_select" ON "DeviceTrust";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DeviceTrust";
DROP POLICY IF EXISTS "org_isolation_update" ON "DeviceTrust";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DeviceTrust";
CREATE POLICY "org_isolation_select" ON "DeviceTrust" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DeviceTrust" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DeviceTrust" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DeviceTrust" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- DigitalProductPassport
DROP POLICY IF EXISTS "org_isolation_select" ON "DigitalProductPassport";
DROP POLICY IF EXISTS "org_isolation_insert" ON "DigitalProductPassport";
DROP POLICY IF EXISTS "org_isolation_update" ON "DigitalProductPassport";
DROP POLICY IF EXISTS "org_isolation_delete" ON "DigitalProductPassport";
CREATE POLICY "org_isolation_select" ON "DigitalProductPassport" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "DigitalProductPassport" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "DigitalProductPassport" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "DigitalProductPassport" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ESGMetric
DROP POLICY IF EXISTS "org_isolation_select" ON "ESGMetric";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ESGMetric";
DROP POLICY IF EXISTS "org_isolation_update" ON "ESGMetric";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ESGMetric";
CREATE POLICY "org_isolation_select" ON "ESGMetric" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ESGMetric" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ESGMetric" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ESGMetric" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- EUAIActRiskAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "EUAIActRiskAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "EUAIActRiskAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "EUAIActRiskAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "EUAIActRiskAssessment";
CREATE POLICY "org_isolation_select" ON "EUAIActRiskAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "EUAIActRiskAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "EUAIActRiskAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "EUAIActRiskAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- EUAIActSystem
DROP POLICY IF EXISTS "org_isolation_select" ON "EUAIActSystem";
DROP POLICY IF EXISTS "org_isolation_insert" ON "EUAIActSystem";
DROP POLICY IF EXISTS "org_isolation_update" ON "EUAIActSystem";
DROP POLICY IF EXISTS "org_isolation_delete" ON "EUAIActSystem";
CREATE POLICY "org_isolation_select" ON "EUAIActSystem" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "EUAIActSystem" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "EUAIActSystem" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "EUAIActSystem" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- EUAIActTransparencyReport
DROP POLICY IF EXISTS "org_isolation_select" ON "EUAIActTransparencyReport";
DROP POLICY IF EXISTS "org_isolation_insert" ON "EUAIActTransparencyReport";
DROP POLICY IF EXISTS "org_isolation_update" ON "EUAIActTransparencyReport";
DROP POLICY IF EXISTS "org_isolation_delete" ON "EUAIActTransparencyReport";
CREATE POLICY "org_isolation_select" ON "EUAIActTransparencyReport" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "EUAIActTransparencyReport" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "EUAIActTransparencyReport" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "EUAIActTransparencyReport" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- EdgeComplianceCheck
DROP POLICY IF EXISTS "org_isolation_select" ON "EdgeComplianceCheck";
DROP POLICY IF EXISTS "org_isolation_insert" ON "EdgeComplianceCheck";
DROP POLICY IF EXISTS "org_isolation_update" ON "EdgeComplianceCheck";
DROP POLICY IF EXISTS "org_isolation_delete" ON "EdgeComplianceCheck";
CREATE POLICY "org_isolation_select" ON "EdgeComplianceCheck" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "EdgeComplianceCheck" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "EdgeComplianceCheck" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "EdgeComplianceCheck" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- EvidenceAnalysis
DROP POLICY IF EXISTS "org_isolation_select" ON "EvidenceAnalysis";
DROP POLICY IF EXISTS "org_isolation_insert" ON "EvidenceAnalysis";
DROP POLICY IF EXISTS "org_isolation_update" ON "EvidenceAnalysis";
DROP POLICY IF EXISTS "org_isolation_delete" ON "EvidenceAnalysis";
CREATE POLICY "org_isolation_select" ON "EvidenceAnalysis" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "EvidenceAnalysis" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "EvidenceAnalysis" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "EvidenceAnalysis" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- FeatureSubscription
DROP POLICY IF EXISTS "org_isolation_select" ON "FeatureSubscription";
DROP POLICY IF EXISTS "org_isolation_insert" ON "FeatureSubscription";
DROP POLICY IF EXISTS "org_isolation_update" ON "FeatureSubscription";
DROP POLICY IF EXISTS "org_isolation_delete" ON "FeatureSubscription";
CREATE POLICY "org_isolation_select" ON "FeatureSubscription" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "FeatureSubscription" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "FeatureSubscription" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "FeatureSubscription" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- FederatedSwarmAggregation
DROP POLICY IF EXISTS "org_isolation_select" ON "FederatedSwarmAggregation";
DROP POLICY IF EXISTS "org_isolation_insert" ON "FederatedSwarmAggregation";
DROP POLICY IF EXISTS "org_isolation_update" ON "FederatedSwarmAggregation";
DROP POLICY IF EXISTS "org_isolation_delete" ON "FederatedSwarmAggregation";
CREATE POLICY "org_isolation_select" ON "FederatedSwarmAggregation" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "FederatedSwarmAggregation" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "FederatedSwarmAggregation" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "FederatedSwarmAggregation" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- FederatedSwarmPeer
DROP POLICY IF EXISTS "org_isolation_select" ON "FederatedSwarmPeer";
DROP POLICY IF EXISTS "org_isolation_insert" ON "FederatedSwarmPeer";
DROP POLICY IF EXISTS "org_isolation_update" ON "FederatedSwarmPeer";
DROP POLICY IF EXISTS "org_isolation_delete" ON "FederatedSwarmPeer";
CREATE POLICY "org_isolation_select" ON "FederatedSwarmPeer" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "FederatedSwarmPeer" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "FederatedSwarmPeer" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "FederatedSwarmPeer" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- FileUpload
DROP POLICY IF EXISTS "org_isolation_select" ON "FileUpload";
DROP POLICY IF EXISTS "org_isolation_insert" ON "FileUpload";
DROP POLICY IF EXISTS "org_isolation_update" ON "FileUpload";
DROP POLICY IF EXISTS "org_isolation_delete" ON "FileUpload";
CREATE POLICY "org_isolation_select" ON "FileUpload" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "FileUpload" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "FileUpload" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "FileUpload" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 8: G-I Tables
-- =====================================================

-- GNNModel
DROP POLICY IF EXISTS "org_isolation_select" ON "GNNModel";
DROP POLICY IF EXISTS "org_isolation_insert" ON "GNNModel";
DROP POLICY IF EXISTS "org_isolation_update" ON "GNNModel";
DROP POLICY IF EXISTS "org_isolation_delete" ON "GNNModel";
CREATE POLICY "org_isolation_select" ON "GNNModel" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "GNNModel" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "GNNModel" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "GNNModel" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- GRCWorkflow
DROP POLICY IF EXISTS "org_isolation_select" ON "GRCWorkflow";
DROP POLICY IF EXISTS "org_isolation_insert" ON "GRCWorkflow";
DROP POLICY IF EXISTS "org_isolation_update" ON "GRCWorkflow";
DROP POLICY IF EXISTS "org_isolation_delete" ON "GRCWorkflow";
CREATE POLICY "org_isolation_select" ON "GRCWorkflow" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "GRCWorkflow" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "GRCWorkflow" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "GRCWorkflow" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- GapAnalysis
DROP POLICY IF EXISTS "org_isolation_select" ON "GapAnalysis";
DROP POLICY IF EXISTS "org_isolation_insert" ON "GapAnalysis";
DROP POLICY IF EXISTS "org_isolation_update" ON "GapAnalysis";
DROP POLICY IF EXISTS "org_isolation_delete" ON "GapAnalysis";
CREATE POLICY "org_isolation_select" ON "GapAnalysis" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "GapAnalysis" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "GapAnalysis" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "GapAnalysis" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- GovernanceBody
DROP POLICY IF EXISTS "org_isolation_select" ON "GovernanceBody";
DROP POLICY IF EXISTS "org_isolation_insert" ON "GovernanceBody";
DROP POLICY IF EXISTS "org_isolation_update" ON "GovernanceBody";
DROP POLICY IF EXISTS "org_isolation_delete" ON "GovernanceBody";
CREATE POLICY "org_isolation_select" ON "GovernanceBody" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "GovernanceBody" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "GovernanceBody" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "GovernanceBody" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Integration
DROP POLICY IF EXISTS "org_isolation_select" ON "Integration";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Integration";
DROP POLICY IF EXISTS "org_isolation_update" ON "Integration";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Integration";
CREATE POLICY "org_isolation_select" ON "Integration" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Integration" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Integration" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Integration" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- IoTDevice
DROP POLICY IF EXISTS "org_isolation_select" ON "IoTDevice";
DROP POLICY IF EXISTS "org_isolation_insert" ON "IoTDevice";
DROP POLICY IF EXISTS "org_isolation_update" ON "IoTDevice";
DROP POLICY IF EXISTS "org_isolation_delete" ON "IoTDevice";
CREATE POLICY "org_isolation_select" ON "IoTDevice" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "IoTDevice" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "IoTDevice" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "IoTDevice" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Issue
DROP POLICY IF EXISTS "org_isolation_select" ON "Issue";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Issue";
DROP POLICY IF EXISTS "org_isolation_update" ON "Issue";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Issue";
CREATE POLICY "org_isolation_select" ON "Issue" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Issue" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Issue" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Issue" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 9: J-K-L Tables
-- =====================================================

-- JITAccessRequest
DROP POLICY IF EXISTS "org_isolation_select" ON "JITAccessRequest";
DROP POLICY IF EXISTS "org_isolation_insert" ON "JITAccessRequest";
DROP POLICY IF EXISTS "org_isolation_update" ON "JITAccessRequest";
DROP POLICY IF EXISTS "org_isolation_delete" ON "JITAccessRequest";
CREATE POLICY "org_isolation_select" ON "JITAccessRequest" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "JITAccessRequest" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "JITAccessRequest" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "JITAccessRequest" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- JITPrivacyNotice
DROP POLICY IF EXISTS "org_isolation_select" ON "JITPrivacyNotice";
DROP POLICY IF EXISTS "org_isolation_insert" ON "JITPrivacyNotice";
DROP POLICY IF EXISTS "org_isolation_update" ON "JITPrivacyNotice";
DROP POLICY IF EXISTS "org_isolation_delete" ON "JITPrivacyNotice";
CREATE POLICY "org_isolation_select" ON "JITPrivacyNotice" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "JITPrivacyNotice" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "JITPrivacyNotice" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "JITPrivacyNotice" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- JITSession
DROP POLICY IF EXISTS "org_isolation_select" ON "JITSession";
DROP POLICY IF EXISTS "org_isolation_insert" ON "JITSession";
DROP POLICY IF EXISTS "org_isolation_update" ON "JITSession";
DROP POLICY IF EXISTS "org_isolation_delete" ON "JITSession";
CREATE POLICY "org_isolation_select" ON "JITSession" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "JITSession" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "JITSession" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "JITSession" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- KeyRotationPolicy
DROP POLICY IF EXISTS "org_isolation_select" ON "KeyRotationPolicy";
DROP POLICY IF EXISTS "org_isolation_insert" ON "KeyRotationPolicy";
DROP POLICY IF EXISTS "org_isolation_update" ON "KeyRotationPolicy";
DROP POLICY IF EXISTS "org_isolation_delete" ON "KeyRotationPolicy";
CREATE POLICY "org_isolation_select" ON "KeyRotationPolicy" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "KeyRotationPolicy" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "KeyRotationPolicy" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "KeyRotationPolicy" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- KeyUsage
DROP POLICY IF EXISTS "org_isolation_select" ON "KeyUsage";
DROP POLICY IF EXISTS "org_isolation_insert" ON "KeyUsage";
DROP POLICY IF EXISTS "org_isolation_update" ON "KeyUsage";
DROP POLICY IF EXISTS "org_isolation_delete" ON "KeyUsage";
CREATE POLICY "org_isolation_select" ON "KeyUsage" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "KeyUsage" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "KeyUsage" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "KeyUsage" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- LDAPRoleMapping
DROP POLICY IF EXISTS "org_isolation_select" ON "LDAPRoleMapping";
DROP POLICY IF EXISTS "org_isolation_insert" ON "LDAPRoleMapping";
DROP POLICY IF EXISTS "org_isolation_update" ON "LDAPRoleMapping";
DROP POLICY IF EXISTS "org_isolation_delete" ON "LDAPRoleMapping";
CREATE POLICY "org_isolation_select" ON "LDAPRoleMapping" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "LDAPRoleMapping" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "LDAPRoleMapping" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "LDAPRoleMapping" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- LifecycleAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "LifecycleAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "LifecycleAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "LifecycleAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "LifecycleAssessment";
CREATE POLICY "org_isolation_select" ON "LifecycleAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "LifecycleAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "LifecycleAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "LifecycleAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- LivenessChallenge
DROP POLICY IF EXISTS "org_isolation_select" ON "LivenessChallenge";
DROP POLICY IF EXISTS "org_isolation_insert" ON "LivenessChallenge";
DROP POLICY IF EXISTS "org_isolation_update" ON "LivenessChallenge";
DROP POLICY IF EXISTS "org_isolation_delete" ON "LivenessChallenge";
CREATE POLICY "org_isolation_select" ON "LivenessChallenge" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "LivenessChallenge" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "LivenessChallenge" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "LivenessChallenge" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 10: M-N Tables
-- =====================================================

-- MDMPolicy
DROP POLICY IF EXISTS "org_isolation_select" ON "MDMPolicy";
DROP POLICY IF EXISTS "org_isolation_insert" ON "MDMPolicy";
DROP POLICY IF EXISTS "org_isolation_update" ON "MDMPolicy";
DROP POLICY IF EXISTS "org_isolation_delete" ON "MDMPolicy";
CREATE POLICY "org_isolation_select" ON "MDMPolicy" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "MDMPolicy" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "MDMPolicy" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "MDMPolicy" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ManagedDevice
DROP POLICY IF EXISTS "org_isolation_select" ON "ManagedDevice";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ManagedDevice";
DROP POLICY IF EXISTS "org_isolation_update" ON "ManagedDevice";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ManagedDevice";
CREATE POLICY "org_isolation_select" ON "ManagedDevice" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ManagedDevice" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ManagedDevice" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ManagedDevice" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- MaterialityAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "MaterialityAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "MaterialityAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "MaterialityAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "MaterialityAssessment";
CREATE POLICY "org_isolation_select" ON "MaterialityAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "MaterialityAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "MaterialityAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "MaterialityAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- MetricsHistory
DROP POLICY IF EXISTS "org_isolation_select" ON "MetricsHistory";
DROP POLICY IF EXISTS "org_isolation_insert" ON "MetricsHistory";
DROP POLICY IF EXISTS "org_isolation_update" ON "MetricsHistory";
DROP POLICY IF EXISTS "org_isolation_delete" ON "MetricsHistory";
CREATE POLICY "org_isolation_select" ON "MetricsHistory" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "MetricsHistory" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "MetricsHistory" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "MetricsHistory" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- NetworkSegment
DROP POLICY IF EXISTS "org_isolation_select" ON "NetworkSegment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "NetworkSegment";
DROP POLICY IF EXISTS "org_isolation_update" ON "NetworkSegment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "NetworkSegment";
CREATE POLICY "org_isolation_select" ON "NetworkSegment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "NetworkSegment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "NetworkSegment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "NetworkSegment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- NeuroSymbolicReasoning
DROP POLICY IF EXISTS "org_isolation_select" ON "NeuroSymbolicReasoning";
DROP POLICY IF EXISTS "org_isolation_insert" ON "NeuroSymbolicReasoning";
DROP POLICY IF EXISTS "org_isolation_update" ON "NeuroSymbolicReasoning";
DROP POLICY IF EXISTS "org_isolation_delete" ON "NeuroSymbolicReasoning";
CREATE POLICY "org_isolation_select" ON "NeuroSymbolicReasoning" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "NeuroSymbolicReasoning" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "NeuroSymbolicReasoning" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "NeuroSymbolicReasoning" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Notification
DROP POLICY IF EXISTS "org_isolation_select" ON "Notification";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Notification";
DROP POLICY IF EXISTS "org_isolation_update" ON "Notification";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Notification";
CREATE POLICY "org_isolation_select" ON "Notification" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Notification" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Notification" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Notification" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 11: O-P Tables (Part 1)
-- =====================================================

-- OnboardingChecklist
DROP POLICY IF EXISTS "org_isolation_select" ON "OnboardingChecklist";
DROP POLICY IF EXISTS "org_isolation_insert" ON "OnboardingChecklist";
DROP POLICY IF EXISTS "org_isolation_update" ON "OnboardingChecklist";
DROP POLICY IF EXISTS "org_isolation_delete" ON "OnboardingChecklist";
CREATE POLICY "org_isolation_select" ON "OnboardingChecklist" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "OnboardingChecklist" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "OnboardingChecklist" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "OnboardingChecklist" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- OnboardingEvent
DROP POLICY IF EXISTS "org_isolation_select" ON "OnboardingEvent";
DROP POLICY IF EXISTS "org_isolation_insert" ON "OnboardingEvent";
DROP POLICY IF EXISTS "org_isolation_update" ON "OnboardingEvent";
DROP POLICY IF EXISTS "org_isolation_delete" ON "OnboardingEvent";
CREATE POLICY "org_isolation_select" ON "OnboardingEvent" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "OnboardingEvent" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "OnboardingEvent" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "OnboardingEvent" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- OnboardingProgress
DROP POLICY IF EXISTS "org_isolation_select" ON "OnboardingProgress";
DROP POLICY IF EXISTS "org_isolation_insert" ON "OnboardingProgress";
DROP POLICY IF EXISTS "org_isolation_update" ON "OnboardingProgress";
DROP POLICY IF EXISTS "org_isolation_delete" ON "OnboardingProgress";
CREATE POLICY "org_isolation_select" ON "OnboardingProgress" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "OnboardingProgress" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "OnboardingProgress" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "OnboardingProgress" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Personnel
DROP POLICY IF EXISTS "org_isolation_select" ON "Personnel";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Personnel";
DROP POLICY IF EXISTS "org_isolation_update" ON "Personnel";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Personnel";
CREATE POLICY "org_isolation_select" ON "Personnel" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Personnel" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Personnel" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Personnel" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- PhishingTraining
DROP POLICY IF EXISTS "org_isolation_select" ON "PhishingTraining";
DROP POLICY IF EXISTS "org_isolation_insert" ON "PhishingTraining";
DROP POLICY IF EXISTS "org_isolation_update" ON "PhishingTraining";
DROP POLICY IF EXISTS "org_isolation_delete" ON "PhishingTraining";
CREATE POLICY "org_isolation_select" ON "PhishingTraining" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "PhishingTraining" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "PhishingTraining" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "PhishingTraining" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Policy
DROP POLICY IF EXISTS "org_isolation_select" ON "Policy";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Policy";
DROP POLICY IF EXISTS "org_isolation_update" ON "Policy";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Policy";
CREATE POLICY "org_isolation_select" ON "Policy" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Policy" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Policy" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Policy" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- PolicyTemplate
DROP POLICY IF EXISTS "org_isolation_select" ON "PolicyTemplate";
DROP POLICY IF EXISTS "org_isolation_insert" ON "PolicyTemplate";
DROP POLICY IF EXISTS "org_isolation_update" ON "PolicyTemplate";
DROP POLICY IF EXISTS "org_isolation_delete" ON "PolicyTemplate";
CREATE POLICY "org_isolation_select" ON "PolicyTemplate" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "PolicyTemplate" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "PolicyTemplate" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "PolicyTemplate" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ProcessMap
DROP POLICY IF EXISTS "org_isolation_select" ON "ProcessMap";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ProcessMap";
DROP POLICY IF EXISTS "org_isolation_update" ON "ProcessMap";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ProcessMap";
CREATE POLICY "org_isolation_select" ON "ProcessMap" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ProcessMap" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ProcessMap" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ProcessMap" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ProcessingRestriction
DROP POLICY IF EXISTS "org_isolation_select" ON "ProcessingRestriction";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ProcessingRestriction";
DROP POLICY IF EXISTS "org_isolation_update" ON "ProcessingRestriction";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ProcessingRestriction";
CREATE POLICY "org_isolation_select" ON "ProcessingRestriction" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ProcessingRestriction" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ProcessingRestriction" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ProcessingRestriction" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 12: P Tables (Part 2)
-- =====================================================

-- ProductDecommission
DROP POLICY IF EXISTS "org_isolation_select" ON "ProductDecommission";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ProductDecommission";
DROP POLICY IF EXISTS "org_isolation_update" ON "ProductDecommission";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ProductDecommission";
CREATE POLICY "org_isolation_select" ON "ProductDecommission" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ProductDecommission" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ProductDecommission" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ProductDecommission" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ProductLifecycle
DROP POLICY IF EXISTS "org_isolation_select" ON "ProductLifecycle";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ProductLifecycle";
DROP POLICY IF EXISTS "org_isolation_update" ON "ProductLifecycle";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ProductLifecycle";
CREATE POLICY "org_isolation_select" ON "ProductLifecycle" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ProductLifecycle" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ProductLifecycle" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ProductLifecycle" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ProductRecall
DROP POLICY IF EXISTS "org_isolation_select" ON "ProductRecall";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ProductRecall";
DROP POLICY IF EXISTS "org_isolation_update" ON "ProductRecall";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ProductRecall";
CREATE POLICY "org_isolation_select" ON "ProductRecall" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ProductRecall" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ProductRecall" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ProductRecall" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 13: Q-R Tables
-- =====================================================

-- Questionnaire
DROP POLICY IF EXISTS "org_isolation_select" ON "Questionnaire";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Questionnaire";
DROP POLICY IF EXISTS "org_isolation_update" ON "Questionnaire";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Questionnaire";
CREATE POLICY "org_isolation_select" ON "Questionnaire" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Questionnaire" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Questionnaire" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Questionnaire" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- QuestionnaireTemplate
DROP POLICY IF EXISTS "org_isolation_select" ON "QuestionnaireTemplate";
DROP POLICY IF EXISTS "org_isolation_insert" ON "QuestionnaireTemplate";
DROP POLICY IF EXISTS "org_isolation_update" ON "QuestionnaireTemplate";
DROP POLICY IF EXISTS "org_isolation_delete" ON "QuestionnaireTemplate";
CREATE POLICY "org_isolation_select" ON "QuestionnaireTemplate" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "QuestionnaireTemplate" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "QuestionnaireTemplate" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "QuestionnaireTemplate" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RFPResponse
DROP POLICY IF EXISTS "org_isolation_select" ON "RFPResponse";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RFPResponse";
DROP POLICY IF EXISTS "org_isolation_update" ON "RFPResponse";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RFPResponse";
CREATE POLICY "org_isolation_select" ON "RFPResponse" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RFPResponse" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RFPResponse" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RFPResponse" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RedTeamResult
DROP POLICY IF EXISTS "org_isolation_select" ON "RedTeamResult";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RedTeamResult";
DROP POLICY IF EXISTS "org_isolation_update" ON "RedTeamResult";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RedTeamResult";
CREATE POLICY "org_isolation_select" ON "RedTeamResult" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RedTeamResult" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RedTeamResult" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RedTeamResult" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RegulationModuleData
DROP POLICY IF EXISTS "org_isolation_select" ON "RegulationModuleData";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RegulationModuleData";
DROP POLICY IF EXISTS "org_isolation_update" ON "RegulationModuleData";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RegulationModuleData";
CREATE POLICY "org_isolation_select" ON "RegulationModuleData" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RegulationModuleData" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RegulationModuleData" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RegulationModuleData" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RegulatoryChange
DROP POLICY IF EXISTS "org_isolation_select" ON "RegulatoryChange";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RegulatoryChange";
DROP POLICY IF EXISTS "org_isolation_update" ON "RegulatoryChange";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RegulatoryChange";
CREATE POLICY "org_isolation_select" ON "RegulatoryChange" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RegulatoryChange" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RegulatoryChange" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RegulatoryChange" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RegulatoryContact
DROP POLICY IF EXISTS "org_isolation_select" ON "RegulatoryContact";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RegulatoryContact";
DROP POLICY IF EXISTS "org_isolation_update" ON "RegulatoryContact";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RegulatoryContact";
CREATE POLICY "org_isolation_select" ON "RegulatoryContact" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RegulatoryContact" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RegulatoryContact" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RegulatoryContact" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RegulatoryFeed
DROP POLICY IF EXISTS "org_isolation_select" ON "RegulatoryFeed";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RegulatoryFeed";
DROP POLICY IF EXISTS "org_isolation_update" ON "RegulatoryFeed";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RegulatoryFeed";
CREATE POLICY "org_isolation_select" ON "RegulatoryFeed" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RegulatoryFeed" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RegulatoryFeed" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RegulatoryFeed" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RetentionPolicy
DROP POLICY IF EXISTS "org_isolation_select" ON "RetentionPolicy";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RetentionPolicy";
DROP POLICY IF EXISTS "org_isolation_update" ON "RetentionPolicy";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RetentionPolicy";
CREATE POLICY "org_isolation_select" ON "RetentionPolicy" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RetentionPolicy" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RetentionPolicy" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RetentionPolicy" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RiskAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "RiskAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RiskAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "RiskAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RiskAssessment";
CREATE POLICY "org_isolation_select" ON "RiskAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RiskAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RiskAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RiskAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RiskItem
DROP POLICY IF EXISTS "org_isolation_select" ON "RiskItem";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RiskItem";
DROP POLICY IF EXISTS "org_isolation_update" ON "RiskItem";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RiskItem";
CREATE POLICY "org_isolation_select" ON "RiskItem" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RiskItem" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RiskItem" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RiskItem" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RiskPrediction
DROP POLICY IF EXISTS "org_isolation_select" ON "RiskPrediction";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RiskPrediction";
DROP POLICY IF EXISTS "org_isolation_update" ON "RiskPrediction";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RiskPrediction";
CREATE POLICY "org_isolation_select" ON "RiskPrediction" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RiskPrediction" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RiskPrediction" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RiskPrediction" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- RuleInference
DROP POLICY IF EXISTS "org_isolation_select" ON "RuleInference";
DROP POLICY IF EXISTS "org_isolation_insert" ON "RuleInference";
DROP POLICY IF EXISTS "org_isolation_update" ON "RuleInference";
DROP POLICY IF EXISTS "org_isolation_delete" ON "RuleInference";
CREATE POLICY "org_isolation_select" ON "RuleInference" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "RuleInference" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "RuleInference" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "RuleInference" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 14: S Tables
-- =====================================================

-- SBOMEntry
DROP POLICY IF EXISTS "org_isolation_select" ON "SBOMEntry";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SBOMEntry";
DROP POLICY IF EXISTS "org_isolation_update" ON "SBOMEntry";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SBOMEntry";
CREATE POLICY "org_isolation_select" ON "SBOMEntry" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SBOMEntry" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SBOMEntry" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SBOMEntry" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SBOMRepository
DROP POLICY IF EXISTS "org_isolation_select" ON "SBOMRepository";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SBOMRepository";
DROP POLICY IF EXISTS "org_isolation_update" ON "SBOMRepository";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SBOMRepository";
CREATE POLICY "org_isolation_select" ON "SBOMRepository" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SBOMRepository" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SBOMRepository" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SBOMRepository" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SCCTemplate
DROP POLICY IF EXISTS "org_isolation_select" ON "SCCTemplate";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SCCTemplate";
DROP POLICY IF EXISTS "org_isolation_update" ON "SCCTemplate";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SCCTemplate";
CREATE POLICY "org_isolation_select" ON "SCCTemplate" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SCCTemplate" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SCCTemplate" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SCCTemplate" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SOXAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "SOXAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SOXAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "SOXAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SOXAssessment";
CREATE POLICY "org_isolation_select" ON "SOXAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SOXAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SOXAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SOXAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SOXControl
DROP POLICY IF EXISTS "org_isolation_select" ON "SOXControl";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SOXControl";
DROP POLICY IF EXISTS "org_isolation_update" ON "SOXControl";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SOXControl";
CREATE POLICY "org_isolation_select" ON "SOXControl" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SOXControl" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SOXControl" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SOXControl" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SimulationResult
DROP POLICY IF EXISTS "org_isolation_select" ON "SimulationResult";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SimulationResult";
DROP POLICY IF EXISTS "org_isolation_update" ON "SimulationResult";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SimulationResult";
CREATE POLICY "org_isolation_select" ON "SimulationResult" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SimulationResult" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SimulationResult" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SimulationResult" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SimulationScenario
DROP POLICY IF EXISTS "org_isolation_select" ON "SimulationScenario";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SimulationScenario";
DROP POLICY IF EXISTS "org_isolation_update" ON "SimulationScenario";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SimulationScenario";
CREATE POLICY "org_isolation_select" ON "SimulationScenario" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SimulationScenario" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SimulationScenario" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SimulationScenario" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SoDRule
DROP POLICY IF EXISTS "org_isolation_select" ON "SoDRule";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SoDRule";
DROP POLICY IF EXISTS "org_isolation_update" ON "SoDRule";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SoDRule";
CREATE POLICY "org_isolation_select" ON "SoDRule" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SoDRule" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SoDRule" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SoDRule" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SoDViolation
DROP POLICY IF EXISTS "org_isolation_select" ON "SoDViolation";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SoDViolation";
DROP POLICY IF EXISTS "org_isolation_update" ON "SoDViolation";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SoDViolation";
CREATE POLICY "org_isolation_select" ON "SoDViolation" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SoDViolation" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SoDViolation" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SoDViolation" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SubscriptionHistory
DROP POLICY IF EXISTS "org_isolation_select" ON "SubscriptionHistory";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SubscriptionHistory";
DROP POLICY IF EXISTS "org_isolation_update" ON "SubscriptionHistory";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SubscriptionHistory";
CREATE POLICY "org_isolation_select" ON "SubscriptionHistory" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SubscriptionHistory" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SubscriptionHistory" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SubscriptionHistory" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SurveillancePlan
DROP POLICY IF EXISTS "org_isolation_select" ON "SurveillancePlan";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SurveillancePlan";
DROP POLICY IF EXISTS "org_isolation_update" ON "SurveillancePlan";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SurveillancePlan";
CREATE POLICY "org_isolation_select" ON "SurveillancePlan" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SurveillancePlan" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SurveillancePlan" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SurveillancePlan" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SwarmAgent
DROP POLICY IF EXISTS "org_isolation_select" ON "SwarmAgent";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SwarmAgent";
DROP POLICY IF EXISTS "org_isolation_update" ON "SwarmAgent";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SwarmAgent";
CREATE POLICY "org_isolation_select" ON "SwarmAgent" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SwarmAgent" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SwarmAgent" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SwarmAgent" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SwarmInsight
DROP POLICY IF EXISTS "org_isolation_select" ON "SwarmInsight";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SwarmInsight";
DROP POLICY IF EXISTS "org_isolation_update" ON "SwarmInsight";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SwarmInsight";
CREATE POLICY "org_isolation_select" ON "SwarmInsight" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SwarmInsight" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SwarmInsight" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SwarmInsight" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SwarmTask
DROP POLICY IF EXISTS "org_isolation_select" ON "SwarmTask";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SwarmTask";
DROP POLICY IF EXISTS "org_isolation_update" ON "SwarmTask";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SwarmTask";
CREATE POLICY "org_isolation_select" ON "SwarmTask" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SwarmTask" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SwarmTask" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SwarmTask" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SwarmTaskAlert
DROP POLICY IF EXISTS "org_isolation_select" ON "SwarmTaskAlert";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SwarmTaskAlert";
DROP POLICY IF EXISTS "org_isolation_update" ON "SwarmTaskAlert";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SwarmTaskAlert";
CREATE POLICY "org_isolation_select" ON "SwarmTaskAlert" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SwarmTaskAlert" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SwarmTaskAlert" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SwarmTaskAlert" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- SwarmTaskMetric
DROP POLICY IF EXISTS "org_isolation_select" ON "SwarmTaskMetric";
DROP POLICY IF EXISTS "org_isolation_insert" ON "SwarmTaskMetric";
DROP POLICY IF EXISTS "org_isolation_update" ON "SwarmTaskMetric";
DROP POLICY IF EXISTS "org_isolation_delete" ON "SwarmTaskMetric";
CREATE POLICY "org_isolation_select" ON "SwarmTaskMetric" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "SwarmTaskMetric" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "SwarmTaskMetric" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "SwarmTaskMetric" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 15: T-U-V-W-Z Tables
-- =====================================================

-- TIAAssessment
DROP POLICY IF EXISTS "org_isolation_select" ON "TIAAssessment";
DROP POLICY IF EXISTS "org_isolation_insert" ON "TIAAssessment";
DROP POLICY IF EXISTS "org_isolation_update" ON "TIAAssessment";
DROP POLICY IF EXISTS "org_isolation_delete" ON "TIAAssessment";
CREATE POLICY "org_isolation_select" ON "TIAAssessment" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "TIAAssessment" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "TIAAssessment" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "TIAAssessment" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- TranscriptionResult
DROP POLICY IF EXISTS "org_isolation_select" ON "TranscriptionResult";
DROP POLICY IF EXISTS "org_isolation_insert" ON "TranscriptionResult";
DROP POLICY IF EXISTS "org_isolation_update" ON "TranscriptionResult";
DROP POLICY IF EXISTS "org_isolation_delete" ON "TranscriptionResult";
CREATE POLICY "org_isolation_select" ON "TranscriptionResult" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "TranscriptionResult" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "TranscriptionResult" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "TranscriptionResult" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- TrustCertificate
DROP POLICY IF EXISTS "org_isolation_select" ON "TrustCertificate";
DROP POLICY IF EXISTS "org_isolation_insert" ON "TrustCertificate";
DROP POLICY IF EXISTS "org_isolation_update" ON "TrustCertificate";
DROP POLICY IF EXISTS "org_isolation_delete" ON "TrustCertificate";
CREATE POLICY "org_isolation_select" ON "TrustCertificate" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "TrustCertificate" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "TrustCertificate" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "TrustCertificate" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- UsageTracking
DROP POLICY IF EXISTS "org_isolation_select" ON "UsageTracking";
DROP POLICY IF EXISTS "org_isolation_insert" ON "UsageTracking";
DROP POLICY IF EXISTS "org_isolation_update" ON "UsageTracking";
DROP POLICY IF EXISTS "org_isolation_delete" ON "UsageTracking";
CREATE POLICY "org_isolation_select" ON "UsageTracking" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "UsageTracking" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "UsageTracking" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "UsageTracking" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- User
DROP POLICY IF EXISTS "org_isolation_select" ON "User";
DROP POLICY IF EXISTS "org_isolation_insert" ON "User";
DROP POLICY IF EXISTS "org_isolation_update" ON "User";
DROP POLICY IF EXISTS "org_isolation_delete" ON "User";
CREATE POLICY "org_isolation_select" ON "User" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "User" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "User" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "User" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- UserSession
DROP POLICY IF EXISTS "org_isolation_select" ON "UserSession";
DROP POLICY IF EXISTS "org_isolation_insert" ON "UserSession";
DROP POLICY IF EXISTS "org_isolation_update" ON "UserSession";
DROP POLICY IF EXISTS "org_isolation_delete" ON "UserSession";
CREATE POLICY "org_isolation_select" ON "UserSession" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "UserSession" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "UserSession" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "UserSession" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- VRCollaborativeSession
DROP POLICY IF EXISTS "org_isolation_select" ON "VRCollaborativeSession";
DROP POLICY IF EXISTS "org_isolation_insert" ON "VRCollaborativeSession";
DROP POLICY IF EXISTS "org_isolation_update" ON "VRCollaborativeSession";
DROP POLICY IF EXISTS "org_isolation_delete" ON "VRCollaborativeSession";
CREATE POLICY "org_isolation_select" ON "VRCollaborativeSession" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "VRCollaborativeSession" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "VRCollaborativeSession" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "VRCollaborativeSession" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- VRTrainingScenario
DROP POLICY IF EXISTS "org_isolation_select" ON "VRTrainingScenario";
DROP POLICY IF EXISTS "org_isolation_insert" ON "VRTrainingScenario";
DROP POLICY IF EXISTS "org_isolation_update" ON "VRTrainingScenario";
DROP POLICY IF EXISTS "org_isolation_delete" ON "VRTrainingScenario";
CREATE POLICY "org_isolation_select" ON "VRTrainingScenario" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "VRTrainingScenario" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "VRTrainingScenario" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "VRTrainingScenario" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- VRTrainingSession
DROP POLICY IF EXISTS "org_isolation_select" ON "VRTrainingSession";
DROP POLICY IF EXISTS "org_isolation_insert" ON "VRTrainingSession";
DROP POLICY IF EXISTS "org_isolation_update" ON "VRTrainingSession";
DROP POLICY IF EXISTS "org_isolation_delete" ON "VRTrainingSession";
CREATE POLICY "org_isolation_select" ON "VRTrainingSession" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "VRTrainingSession" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "VRTrainingSession" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "VRTrainingSession" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Vendor
DROP POLICY IF EXISTS "org_isolation_select" ON "Vendor";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Vendor";
DROP POLICY IF EXISTS "org_isolation_update" ON "Vendor";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Vendor";
CREATE POLICY "org_isolation_select" ON "Vendor" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Vendor" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Vendor" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Vendor" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- WebRTCSession
DROP POLICY IF EXISTS "org_isolation_select" ON "WebRTCSession";
DROP POLICY IF EXISTS "org_isolation_insert" ON "WebRTCSession";
DROP POLICY IF EXISTS "org_isolation_update" ON "WebRTCSession";
DROP POLICY IF EXISTS "org_isolation_delete" ON "WebRTCSession";
CREATE POLICY "org_isolation_select" ON "WebRTCSession" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "WebRTCSession" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "WebRTCSession" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "WebRTCSession" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- Webhook
DROP POLICY IF EXISTS "org_isolation_select" ON "Webhook";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Webhook";
DROP POLICY IF EXISTS "org_isolation_update" ON "Webhook";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Webhook";
CREATE POLICY "org_isolation_select" ON "Webhook" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Webhook" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Webhook" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Webhook" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- WebhookEvent
DROP POLICY IF EXISTS "org_isolation_select" ON "WebhookEvent";
DROP POLICY IF EXISTS "org_isolation_insert" ON "WebhookEvent";
DROP POLICY IF EXISTS "org_isolation_update" ON "WebhookEvent";
DROP POLICY IF EXISTS "org_isolation_delete" ON "WebhookEvent";
CREATE POLICY "org_isolation_select" ON "WebhookEvent" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "WebhookEvent" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "WebhookEvent" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "WebhookEvent" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- ZeroTrustPolicy
DROP POLICY IF EXISTS "org_isolation_select" ON "ZeroTrustPolicy";
DROP POLICY IF EXISTS "org_isolation_insert" ON "ZeroTrustPolicy";
DROP POLICY IF EXISTS "org_isolation_update" ON "ZeroTrustPolicy";
DROP POLICY IF EXISTS "org_isolation_delete" ON "ZeroTrustPolicy";
CREATE POLICY "org_isolation_select" ON "ZeroTrustPolicy" FOR SELECT USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "ZeroTrustPolicy" FOR INSERT WITH CHECK ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "ZeroTrustPolicy" FOR UPDATE USING ("organizationId" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "ZeroTrustPolicy" FOR DELETE USING ("organizationId" = public.get_current_organization_id());

-- =====================================================
-- BATCH 16: Legacy snake_case Tables with organization_id
-- =====================================================

-- breach_incidents (legacy)
DROP POLICY IF EXISTS "org_isolation_select" ON "breach_incidents";
DROP POLICY IF EXISTS "org_isolation_insert" ON "breach_incidents";
DROP POLICY IF EXISTS "org_isolation_update" ON "breach_incidents";
DROP POLICY IF EXISTS "org_isolation_delete" ON "breach_incidents";
CREATE POLICY "org_isolation_select" ON "breach_incidents" FOR SELECT USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "breach_incidents" FOR INSERT WITH CHECK ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "breach_incidents" FOR UPDATE USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "breach_incidents" FOR DELETE USING ("organization_id" = public.get_current_organization_id());

-- governance_bodies (legacy)
DROP POLICY IF EXISTS "org_isolation_select" ON "governance_bodies";
DROP POLICY IF EXISTS "org_isolation_insert" ON "governance_bodies";
DROP POLICY IF EXISTS "org_isolation_update" ON "governance_bodies";
DROP POLICY IF EXISTS "org_isolation_delete" ON "governance_bodies";
CREATE POLICY "org_isolation_select" ON "governance_bodies" FOR SELECT USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "governance_bodies" FOR INSERT WITH CHECK ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "governance_bodies" FOR UPDATE USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "governance_bodies" FOR DELETE USING ("organization_id" = public.get_current_organization_id());

-- process_maps (legacy)
DROP POLICY IF EXISTS "org_isolation_select" ON "process_maps";
DROP POLICY IF EXISTS "org_isolation_insert" ON "process_maps";
DROP POLICY IF EXISTS "org_isolation_update" ON "process_maps";
DROP POLICY IF EXISTS "org_isolation_delete" ON "process_maps";
CREATE POLICY "org_isolation_select" ON "process_maps" FOR SELECT USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "process_maps" FOR INSERT WITH CHECK ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "process_maps" FOR UPDATE USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "process_maps" FOR DELETE USING ("organization_id" = public.get_current_organization_id());

-- sbom_entries (legacy)
DROP POLICY IF EXISTS "org_isolation_select" ON "sbom_entries";
DROP POLICY IF EXISTS "org_isolation_insert" ON "sbom_entries";
DROP POLICY IF EXISTS "org_isolation_update" ON "sbom_entries";
DROP POLICY IF EXISTS "org_isolation_delete" ON "sbom_entries";
CREATE POLICY "org_isolation_select" ON "sbom_entries" FOR SELECT USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "sbom_entries" FOR INSERT WITH CHECK ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "sbom_entries" FOR UPDATE USING ("organization_id" = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "sbom_entries" FOR DELETE USING ("organization_id" = public.get_current_organization_id());

-- =====================================================
-- BATCH 17: Tables that were already created in previous batches
-- These are included here for completeness (Batch 1-3 tables)
-- =====================================================

-- Note: The following tables already have RLS policies from Batch 1-3:
-- AISuggestion, AISystem, AITransparencyNotice, AccessReview, AgenticAction, ApiKey
-- AuditEngagement, AuditFinding, AuditLog, AuditorProfile, AzurePolicyCompliance,
-- AzureResource, AzureSecurityAlert, AzureSecurityFinding, AzureSyncJob, AzureUser
-- BCPPlan, BCRProgram, BreachIncident, BreachTemplate, CEProduct, ChangeImpact, ChatConversation

-- =====================================================
-- Special handling for Organization table (no organizationId self-reference)
-- Use id-based policy instead
-- =====================================================

-- Organization (self-referencing - users can only see their own org)
DROP POLICY IF EXISTS "org_isolation_select" ON "Organization";
DROP POLICY IF EXISTS "org_isolation_insert" ON "Organization";
DROP POLICY IF EXISTS "org_isolation_update" ON "Organization";
DROP POLICY IF EXISTS "org_isolation_delete" ON "Organization";
CREATE POLICY "org_isolation_select" ON "Organization" FOR SELECT USING (id = public.get_current_organization_id());
CREATE POLICY "org_isolation_insert" ON "Organization" FOR INSERT WITH CHECK (id = public.get_current_organization_id());
CREATE POLICY "org_isolation_update" ON "Organization" FOR UPDATE USING (id = public.get_current_organization_id());
CREATE POLICY "org_isolation_delete" ON "Organization" FOR DELETE USING (id = public.get_current_organization_id());
