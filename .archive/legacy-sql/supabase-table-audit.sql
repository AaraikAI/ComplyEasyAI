-- ============================================
-- ComplyEasyAI - Supabase Table Audit
-- Run this in the Supabase SQL Editor
-- ============================================
-- Compares your existing tables against the 207
-- tables required by the Prisma schema and reports
-- which ones are missing.
-- ============================================

WITH required_tables AS (
  SELECT unnest(ARRAY[
    'AIRMFActor','AIRMFAssessment','AIRMFCategory','AIRMFCoreFunction',
    'AIRMFLifecycleStage','AIRMFProfile','AIRMFRiskActivity','AIRMFSubcategory',
    'AIRMFTrustworthinessCharacteristic','AISuggestion','AISystem','AITransparencyNotice',
    'AccessReview','AgenticAction','ApiKey','AuditEngagement','AuditFinding',
    'AuditLog','AuditRequest','AuditWorkpaper','AuditorProfile','BCPPlan','BCRProgram',
    'BreachIncident','BreachNotification','BreachTemplate','CEProduct',
    'CertificationProgram','ChangeImpact','ChatConversation','CommunityEvent',
    'ComplianceDebt','ComplianceFramework','ComplianceGoal','CompliancePolicy',
    'ComplianceTrajectory','ConsentPreference','ConsentRecord','ContinuousMonitor',
    'ContributionActivity','ControlLoop','ControlLoopHistory','ControlMapping',
    'Course','CourseEnrollment','CourseLesson','CustomReport','DMAComplianceReport',
    'DMAGatekeeper','DMAObligationTracking','DORAICTIncident','DORAICTRiskAssessment',
    'DORAInformationRegister','DORAResilienceTest','DORAThirdPartyProvider','DPOProfile',
    'DSAAdRepository','DSAContentModeration','DSAIllegalContentReport',
    'DSANonPersonalizedFeed','DSAPlatform','DSARRequest','DSARiskAssessment',
    'DSATransparencyReport','DataDeletionRequest','DataMap','DemoRequest',
    'DeviceAction','DeviceComplianceCheck','DeviceTrust','DigitalProductPassport',
    'ESGMetric','EUAIActRiskAssessment','EUAIActSystem','EUAIActTransparencyReport',
    'EdgeComplianceCheck','EmailVerificationToken','EscalationPath','EventRegistration',
    'EvidenceAnalysis','EvidenceVersion','FeatureSubscription','FederatedSwarmAggregation',
    'FederatedSwarmPeer','FileUpload','ForumCategory','ForumComment','ForumPost',
    'ForumVote','FrameworkControl','GNNModel','GRCWorkflow','GapAnalysis',
    'GovernanceBody','GovernanceDecision','GovernanceMeeting','Incident','IncidentUpdate',
    'Integration','IoTDevice','Issue','IssueComment','JITAccessRequest','JITPrivacyNotice',
    'JITSession','KeyRotationPolicy','KeyUsage','LDAPRoleMapping','LifecycleAssessment',
    'LivenessChallenge','LivenessFrame','MDMPolicy','MagicLink','MaintenanceWindow',
    'ManagedDevice','MaterialityAssessment','MetricsHistory','MonitorResult',
    'NetworkSegment','NeuroSymbolicReasoning','Notification','NotificationPreference',
    'OnboardingChecklist','OnboardingEvent','OnboardingProgress','Organization',
    'Personnel','PhishingTraining','Policy','PolicyTemplate','ProcessMap',
    'ProcessingRestriction','ProductDecommission','ProductLifecycle','ProductRecall',
    'Questionnaire','QuestionnaireQuestion','QuestionnaireResponse','QuestionnaireTemplate',
    'RFPResponse','RedTeamResult','RegulationModuleData','RegulatoryChange',
    'RegulatoryContact','RegulatoryFeed','ResourceDownload','RetentionEnforcement',
    'RetentionPolicy','RiskAssessment','RiskItem','RiskPrediction','RuleInference',
    'SBOMEntry','SBOMRepository','SCCTemplate','SOXAssessment','SOXControl',
    'SOXTestResult','ServiceStatus','SharedResource','SimulationResult',
    'SimulationScenario','SoDRule','SoDViolation','StatusHistory','StatusSubscription',
    'StripeEvent','SubscriptionHistory','SurveillanceIncident','SurveillancePlan',
    'SwarmAgent','SwarmInsight','SwarmTask','SwarmTaskAlert','SwarmTaskCheckpoint',
    'SwarmTaskMetric','TIAAssessment','TranscriptionResult','TrustCertificate',
    'Tutorial','TwoFactorBackupCode','UsageTracking','User','UserCertification',
    'UserContribution','UserSession','VRAnnotation','VRChatMessage',
    'VRCollaborativeSession','VRParticipant','VRSessionPerformance','VRTrainingProgress',
    'VRTrainingScenario','VRTrainingSession','VRVoiceChatState','Vendor',
    'VendorAssessment','VendorMonitor','VendorReview','WebRTCPeer','WebRTCSession',
    'Webhook','WebhookEvent','Webinar','WebinarRegistration','WorkflowExecution',
    'ZeroTrustPolicy'
  ]) AS table_name
),
existing_tables AS (
  SELECT tablename AS table_name
  FROM pg_tables
  WHERE schemaname = 'public'
)
SELECT
  '--- MISSING TABLES (need to be created) ---' AS section,
  r.table_name
FROM required_tables r
LEFT JOIN existing_tables e ON r.table_name = e.table_name
WHERE e.table_name IS NULL
ORDER BY r.table_name;
