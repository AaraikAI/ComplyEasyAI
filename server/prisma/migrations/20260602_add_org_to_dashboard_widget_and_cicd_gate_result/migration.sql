-- ============================================================================
-- Migration: add_org_to_dashboard_widget_and_cicd_gate_result
-- Created: 2026-05-25
-- Purpose: Adds organizationId column + indexes + foreign keys to two child
--          entities that previously lacked direct multi-tenant scoping.
--
-- PRODUCTION DEPLOY STEPS:
--   1. Run this migration (adds nullable column + indexes + FK).
--   2. Run backfill UPDATE to populate organizationId from parent rows.
--   3. (Future migration) ALTER COLUMN SET NOT NULL once all rows are backfilled.
--
-- The columns are intentionally NULLABLE in this migration because existing
-- DashboardWidget and CICDGateResult rows have no parent-linked org context
-- in their own row. The service layer now writes organizationId on all NEW
-- rows; legacy rows must be backfilled before NOT NULL is enforced.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DashboardWidget
-- ----------------------------------------------------------------------------
ALTER TABLE "DashboardWidget"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Backfill from parent CustomDashboard.organizationId
UPDATE "DashboardWidget" w
  SET "organizationId" = d."organizationId"
  FROM "CustomDashboard" d
  WHERE w."dashboardId" = d.id
    AND w."organizationId" IS NULL;

-- Foreign key to Organization with CASCADE delete (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'DashboardWidget_organizationId_fkey'
  ) THEN
    ALTER TABLE "DashboardWidget"
      ADD CONSTRAINT "DashboardWidget_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "DashboardWidget_organizationId_idx"
  ON "DashboardWidget"("organizationId");

CREATE INDEX IF NOT EXISTS "DashboardWidget_dashboardId_organizationId_idx"
  ON "DashboardWidget"("dashboardId", "organizationId");

-- The NOT NULL enforcement (re-backfill + ALTER COLUMN SET NOT NULL) is shipped
-- as the follow-up migration 20260605_org_not_null_dashboard_cicd, which guards
-- the lockdown behind a residual-NULL check so it fails closed if any row is
-- still unbackfilled.

-- ----------------------------------------------------------------------------
-- CICDGateResult
-- ----------------------------------------------------------------------------
ALTER TABLE "CICDGateResult"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Backfill from parent CICDGatePolicy.organizationId
UPDATE "CICDGateResult" r
  SET "organizationId" = p."organizationId"
  FROM "CICDGatePolicy" p
  WHERE r."policyId" = p.id
    AND r."organizationId" IS NULL;

-- Foreign key to Organization with CASCADE delete (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CICDGateResult_organizationId_fkey'
  ) THEN
    ALTER TABLE "CICDGateResult"
      ADD CONSTRAINT "CICDGateResult_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CICDGateResult_organizationId_idx"
  ON "CICDGateResult"("organizationId");

CREATE INDEX IF NOT EXISTS "CICDGateResult_policyId_organizationId_idx"
  ON "CICDGateResult"("policyId", "organizationId");

-- The NOT NULL enforcement (re-backfill + ALTER COLUMN SET NOT NULL) is shipped
-- as the follow-up migration 20260605_org_not_null_dashboard_cicd.
