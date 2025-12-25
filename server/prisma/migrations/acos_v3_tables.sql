-- aCOS v3.0 Database Tables Migration
-- Run this SQL in Supabase SQL Editor or via Prisma migrate

-- 1. Compliance Goals Table
CREATE TABLE IF NOT EXISTS "ComplianceGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL CHECK ("goalType" IN ('maintain', 'achieve', 'improve')),
    "frameworks" TEXT[] NOT NULL,
    "riskTolerance" TEXT NOT NULL CHECK ("riskTolerance" IN ('low', 'medium', 'high')),
    "horizon" INTEGER NOT NULL,
    "autoActionPolicy" TEXT NOT NULL CHECK ("autoActionPolicy" IN ('conservative', 'moderate', 'aggressive')),
    "targetScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'paused', 'completed', 'archived')),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceGoal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ComplianceGoal_organizationId_idx" ON "ComplianceGoal"("organizationId");
CREATE INDEX IF NOT EXISTS "ComplianceGoal_status_idx" ON "ComplianceGoal"("status");

-- 2. Control Loops Table
CREATE TABLE IF NOT EXISTS "ControlLoop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "observeAgent" TEXT NOT NULL,
    "actAgent" TEXT NOT NULL,
    "verifyAgent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'paused', 'error')),
    "lastObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cycleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlLoop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ControlLoop_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "FrameworkControl"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ControlLoop_organizationId_idx" ON "ControlLoop"("organizationId");
CREATE INDEX IF NOT EXISTS "ControlLoop_controlId_idx" ON "ControlLoop"("controlId");
CREATE INDEX IF NOT EXISTS "ControlLoop_status_idx" ON "ControlLoop"("status");

-- 3. Compliance Debt Table
CREATE TABLE IF NOT EXISTS "ComplianceDebt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "debtType" TEXT NOT NULL CHECK ("debtType" IN ('technical', 'process', 'documentation', 'evidence')),
    "severity" TEXT NOT NULL CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
    "description" TEXT NOT NULL,
    "estimatedRemediationHours" INTEGER NOT NULL,
    "accumulatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceDebt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceDebt_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ComplianceDebt_organizationId_idx" ON "ComplianceDebt"("organizationId");
CREATE INDEX IF NOT EXISTS "ComplianceDebt_frameworkId_idx" ON "ComplianceDebt"("frameworkId");
CREATE INDEX IF NOT EXISTS "ComplianceDebt_severity_idx" ON "ComplianceDebt"("severity");
CREATE INDEX IF NOT EXISTS "ComplianceDebt_resolvedAt_idx" ON "ComplianceDebt"("resolvedAt");

-- 4. Change Impact Forecasts Table
CREATE TABLE IF NOT EXISTS "ChangeImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL CHECK ("changeType" IN ('control', 'policy', 'framework', 'integration')),
    "changeId" TEXT NOT NULL,
    "affectedControls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "affectedFrameworks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "impactScore" INTEGER NOT NULL,
    "riskIncrease" DOUBLE PRECISION NOT NULL,
    "estimatedComplianceChange" DOUBLE PRECISION NOT NULL,
    "forecastedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeImpact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ChangeImpact_organizationId_idx" ON "ChangeImpact"("organizationId");
CREATE INDEX IF NOT EXISTS "ChangeImpact_changeType_idx" ON "ChangeImpact"("changeType");

-- 5. Agentic Actions Table
CREATE TABLE IF NOT EXISTS "AgenticAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL CHECK ("actionType" IN ('control_update', 'policy_create', 'risk_mitigation', 'evidence_upload')),
    "targetId" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "blastRadius" JSONB NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'executing', 'completed', 'rolled_back', 'failed')),
    "rollbackData" JSONB,
    "executedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgenticAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgenticAction_organizationId_idx" ON "AgenticAction"("organizationId");
CREATE INDEX IF NOT EXISTS "AgenticAction_status_idx" ON "AgenticAction"("status");
CREATE INDEX IF NOT EXISTS "AgenticAction_actionType_idx" ON "AgenticAction"("actionType");
CREATE INDEX IF NOT EXISTS "AgenticAction_createdAt_idx" ON "AgenticAction"("createdAt");

-- 6. Evidence Analysis Table
CREATE TABLE IF NOT EXISTS "EvidenceAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deepfakeScore" DOUBLE PRECISION NOT NULL,
    "cryptographicHash" TEXT NOT NULL,
    "physicalAttestation" JSONB,
    "humanLiveness" JSONB,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "verificationStatus" TEXT NOT NULL CHECK ("verificationStatus" IN ('verified', 'suspicious', 'failed')),
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceAnalysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EvidenceAnalysis_evidenceId_idx" ON "EvidenceAnalysis"("evidenceId");
CREATE INDEX IF NOT EXISTS "EvidenceAnalysis_organizationId_idx" ON "EvidenceAnalysis"("organizationId");
CREATE INDEX IF NOT EXISTS "EvidenceAnalysis_verificationStatus_idx" ON "EvidenceAnalysis"("verificationStatus");

-- 7. Regulatory Changes Table
CREATE TABLE IF NOT EXISTS "RegulatoryChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "regulationName" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "changeType" TEXT NOT NULL CHECK ("changeType" IN ('new', 'amendment', 'repeal')),
    "affectedFrameworks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "extractedRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "autoGeneratedControls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'analyzed', 'implemented', 'conflict')),
    "regulationText" TEXT,
    "source" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegulatoryChange_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RegulatoryChange_organizationId_idx" ON "RegulatoryChange"("organizationId");
CREATE INDEX IF NOT EXISTS "RegulatoryChange_jurisdiction_idx" ON "RegulatoryChange"("jurisdiction");
CREATE INDEX IF NOT EXISTS "RegulatoryChange_status_idx" ON "RegulatoryChange"("status");
CREATE INDEX IF NOT EXISTS "RegulatoryChange_effectiveDate_idx" ON "RegulatoryChange"("effectiveDate");

-- 8. Risk Predictions Table (TGN)
CREATE TABLE IF NOT EXISTS "RiskPrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "riskId" TEXT,
    "riskType" TEXT NOT NULL,
    "predictedProbability" DOUBLE PRECISION NOT NULL,
    "predictedSeverity" TEXT NOT NULL CHECK ("predictedSeverity" IN ('Critical', 'High', 'Medium', 'Low')),
    "predictedDate" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "timeHorizonMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskPrediction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiskPrediction_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RiskPrediction_organizationId_idx" ON "RiskPrediction"("organizationId");
CREATE INDEX IF NOT EXISTS "RiskPrediction_predictedDate_idx" ON "RiskPrediction"("predictedDate");
CREATE INDEX IF NOT EXISTS "RiskPrediction_predictedSeverity_idx" ON "RiskPrediction"("predictedSeverity");

-- 9. Compliance Trajectories Table
CREATE TABLE IF NOT EXISTS "ComplianceTrajectory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "currentScore" INTEGER NOT NULL,
    "predictedScores" JSONB NOT NULL,
    "trend" TEXT NOT NULL CHECK ("trend" IN ('improving', 'stable', 'declining')),
    "timeHorizonMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceTrajectory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceTrajectory_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ComplianceTrajectory_organizationId_idx" ON "ComplianceTrajectory"("organizationId");
CREATE INDEX IF NOT EXISTS "ComplianceTrajectory_frameworkId_idx" ON "ComplianceTrajectory"("frameworkId");
CREATE INDEX IF NOT EXISTS "ComplianceTrajectory_createdAt_idx" ON "ComplianceTrajectory"("createdAt");

-- 10. Simulation Scenarios Table
CREATE TABLE IF NOT EXISTS "SimulationScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL CHECK ("scenarioType" IN ('control_change', 'policy_update', 'risk_event', 'framework_addition')),
    "parameters" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SimulationScenario_organizationId_idx" ON "SimulationScenario"("organizationId");
CREATE INDEX IF NOT EXISTS "SimulationScenario_scenarioType_idx" ON "SimulationScenario"("scenarioType");

-- 11. Simulation Results Table
CREATE TABLE IF NOT EXISTS "SimulationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "baselineScore" INTEGER NOT NULL,
    "simulatedScore" INTEGER NOT NULL,
    "scoreChange" INTEGER NOT NULL,
    "affectedControls" INTEGER NOT NULL,
    "affectedFrameworks" INTEGER NOT NULL,
    "riskChanges" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "recommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationResult_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SimulationResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SimulationResult_scenarioId_idx" ON "SimulationResult"("scenarioId");
CREATE INDEX IF NOT EXISTS "SimulationResult_organizationId_idx" ON "SimulationResult"("organizationId");
CREATE INDEX IF NOT EXISTS "SimulationResult_createdAt_idx" ON "SimulationResult"("createdAt");

-- 12. Red Team Results Table
CREATE TABLE IF NOT EXISTS "RedTeamResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "attackPath" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "vulnerabilitiesFound" JSONB NOT NULL,
    "remediationRecommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "executionTime" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedTeamResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RedTeamResult_organizationId_idx" ON "RedTeamResult"("organizationId");
CREATE INDEX IF NOT EXISTS "RedTeamResult_createdAt_idx" ON "RedTeamResult"("createdAt");

-- 13. Swarm Insights Table
CREATE TABLE IF NOT EXISTS "SwarmInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL CHECK ("insightType" IN ('best_practice', 'risk_pattern', 'control_effectiveness', 'framework_trend')),
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "applicableFrameworks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwarmInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SwarmInsight_organizationId_idx" ON "SwarmInsight"("organizationId");
CREATE INDEX IF NOT EXISTS "SwarmInsight_insightType_idx" ON "SwarmInsight"("insightType");

-- 14. IoT Devices Table
CREATE TABLE IF NOT EXISTS "IoTDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "complianceStatus" TEXT NOT NULL DEFAULT 'unknown' CHECK ("complianceStatus" IN ('compliant', 'non_compliant', 'unknown')),
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sensorData" JSONB,
    "mqttTopic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IoTDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IoTDevice_deviceId_organizationId_key" ON "IoTDevice"("deviceId", "organizationId");
CREATE INDEX IF NOT EXISTS "IoTDevice_organizationId_idx" ON "IoTDevice"("organizationId");
CREATE INDEX IF NOT EXISTS "IoTDevice_complianceStatus_idx" ON "IoTDevice"("complianceStatus");

-- 15. Edge Compliance Checks Table
CREATE TABLE IF NOT EXISTS "EdgeComplianceCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL CHECK ("checkType" IN ('encryption', 'access_control', 'data_retention', 'audit_logging')),
    "status" TEXT NOT NULL CHECK ("status" IN ('pass', 'fail', 'warning')),
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EdgeComplianceCheck_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IoTDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EdgeComplianceCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EdgeComplianceCheck_deviceId_idx" ON "EdgeComplianceCheck"("deviceId");
CREATE INDEX IF NOT EXISTS "EdgeComplianceCheck_organizationId_idx" ON "EdgeComplianceCheck"("organizationId");
CREATE INDEX IF NOT EXISTS "EdgeComplianceCheck_timestamp_idx" ON "EdgeComplianceCheck"("timestamp");

-- 16. Transcription Results Table
CREATE TABLE IF NOT EXISTS "TranscriptionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "language" TEXT NOT NULL,
    "duration" INTEGER,
    "segments" JSONB,
    "sourceType" TEXT NOT NULL CHECK ("sourceType" IN ('audio', 'video', 'document')),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TranscriptionResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TranscriptionResult_organizationId_idx" ON "TranscriptionResult"("organizationId");
CREATE INDEX IF NOT EXISTS "TranscriptionResult_evidenceId_idx" ON "TranscriptionResult"("evidenceId");
CREATE INDEX IF NOT EXISTS "TranscriptionResult_sourceType_idx" ON "TranscriptionResult"("sourceType");

-- Add updatedAt trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updatedAt columns
CREATE TRIGGER update_compliance_goal_updated_at BEFORE UPDATE ON "ComplianceGoal" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_control_loop_updated_at BEFORE UPDATE ON "ControlLoop" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_debt_updated_at BEFORE UPDATE ON "ComplianceDebt" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agentic_action_updated_at BEFORE UPDATE ON "AgenticAction" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regulatory_change_updated_at BEFORE UPDATE ON "RegulatoryChange" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_trajectory_updated_at BEFORE UPDATE ON "ComplianceTrajectory" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iot_device_updated_at BEFORE UPDATE ON "IoTDevice" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

