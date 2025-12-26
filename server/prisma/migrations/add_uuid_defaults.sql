-- Add UUID Default Values to aCOS v3.0 Tables
-- Run this SQL in Supabase SQL Editor to sync database with Prisma schema
-- This ensures the id fields have default values for automatic UUID generation

-- Ensure uuid extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ComplianceGoal - Add default UUID generation
ALTER TABLE "ComplianceGoal" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 2. ControlLoop - Add default UUID generation
ALTER TABLE "ControlLoop" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 3. ComplianceDebt - Add default UUID generation
ALTER TABLE "ComplianceDebt" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 4. ChangeImpact - Add default UUID generation
ALTER TABLE "ChangeImpact" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 5. AgenticAction - Add default UUID generation
ALTER TABLE "AgenticAction" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 6. EvidenceAnalysis - Add default UUID generation
ALTER TABLE "EvidenceAnalysis" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 7. RegulatoryChange - Add default UUID generation
ALTER TABLE "RegulatoryChange" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 8. RiskPrediction - Add default UUID generation
ALTER TABLE "RiskPrediction" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 9. ComplianceTrajectory - Add default UUID generation
ALTER TABLE "ComplianceTrajectory" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 10. SimulationScenario - Add default UUID generation
ALTER TABLE "SimulationScenario" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 11. SimulationResult - Add default UUID generation
ALTER TABLE "SimulationResult" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 12. RedTeamResult - Add default UUID generation
ALTER TABLE "RedTeamResult" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 13. SwarmInsight - Add default UUID generation
ALTER TABLE "SwarmInsight" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 14. IoTDevice - Add default UUID generation
ALTER TABLE "IoTDevice" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 15. EdgeComplianceCheck - Add default UUID generation
ALTER TABLE "EdgeComplianceCheck" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- 16. TranscriptionResult - Add default UUID generation
ALTER TABLE "TranscriptionResult" 
ALTER COLUMN "id" SET DEFAULT (uuid_generate_v4())::text;

-- Verification: Check that defaults are set correctly
-- You can run this query to verify:
-- SELECT 
--     table_name, 
--     column_name, 
--     column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--     AND table_name IN (
--         'ComplianceGoal', 'ControlLoop', 'ComplianceDebt', 'ChangeImpact',
--         'AgenticAction', 'EvidenceAnalysis', 'RegulatoryChange', 'RiskPrediction',
--         'ComplianceTrajectory', 'SimulationScenario', 'SimulationResult',
--         'RedTeamResult', 'SwarmInsight', 'IoTDevice', 'EdgeComplianceCheck', 'TranscriptionResult'
--     )
--     AND column_name = 'id'
-- ORDER BY table_name;

