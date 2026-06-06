-- =====================================================================
-- 20260605_org_not_null_dashboard_cicd — finish multi-tenant lockdown
-- =====================================================================
-- Follow-up to add_org_to_dashboard_widget_and_cicd_gate_result.sql, which
-- added a NULLABLE organizationId to DashboardWidget and CICDGateResult and
-- backfilled it from the parent row, but deferred the NOT NULL enforcement.
--
-- While organizationId is nullable, the org_isolation RLS policies on these
-- two tables scope on a column that can be NULL: a NULL-org row makes the
-- policy predicate evaluate to UNKNOWN, so under FORCE ROW LEVEL SECURITY the
-- row is neither visible nor insertable, and pre-backfill rows can slip past
-- isolation. This migration completes the backfill and enforces NOT NULL so
-- the predicate is always determinate.
--
-- Fails closed: each ALTER COLUMN ... SET NOT NULL aborts the transaction if
-- any residual NULL remains after the re-backfill, so the lockdown cannot be
-- applied against partially-backfilled data.
--
-- Prerequisite: add_org_to_dashboard_widget_and_cicd_gate_result.sql applied.
-- =====================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- DashboardWidget
-- ----------------------------------------------------------------------------
-- Re-backfill any rows added between the prior migration and this one.
UPDATE "DashboardWidget" w
  SET "organizationId" = d."organizationId"
  FROM "CustomDashboard" d
  WHERE w."dashboardId" = d.id
    AND w."organizationId" IS NULL;

ALTER TABLE "DashboardWidget"
  ALTER COLUMN "organizationId" SET NOT NULL;

-- ----------------------------------------------------------------------------
-- CICDGateResult
-- ----------------------------------------------------------------------------
UPDATE "CICDGateResult" r
  SET "organizationId" = p."organizationId"
  FROM "CICDGatePolicy" p
  WHERE r."policyId" = p.id
    AND r."organizationId" IS NULL;

ALTER TABLE "CICDGateResult"
  ALTER COLUMN "organizationId" SET NOT NULL;

COMMIT;

-- =====================================================================
-- OPERATIONAL CUTOVER (outside the repo)
-- =====================================================================
-- This migration must be applied AFTER the application code has been writing
-- organizationId on every new DashboardWidget / CICDGateResult row, so the
-- re-backfill above leaves zero residual NULLs. If either ALTER COLUMN fails
-- with a not-null violation, a row has a parent whose organizationId is itself
-- NULL or the parent row is missing — investigate those rows, repair the
-- parent linkage, then re-run. Do NOT relax the constraint to force it through.
-- =====================================================================
