-- =====================================================================
-- 20260605_org_fk_onboarding_event_reg_impact — add Organization FKs
-- =====================================================================
-- OnboardingEvent and RegulatoryChangeImpact each carry a denormalized
-- organizationId (TEXT) with no foreign key to Organization, so they had no
-- referential integrity and no CASCADE cleanup when an Organization is
-- deleted — rows orphaned silently. Both are RLS-scoped on organizationId,
-- which makes a dangling org reference a latent isolation hazard.
--
-- This migration removes any orphaned rows (an organizationId that does not
-- resolve to an existing Organization can never belong to a live tenant),
-- then adds the FK with ON DELETE CASCADE / ON UPDATE CASCADE, matching the
-- pattern used by the sibling org-scoped tables.
--
-- Idempotent: the constraint is only added if it does not already exist.
-- =====================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- OnboardingEvent
-- ----------------------------------------------------------------------------
DELETE FROM "OnboardingEvent" e
  WHERE NOT EXISTS (
    SELECT 1 FROM "Organization" o WHERE o.id = e."organizationId"
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'OnboardingEvent_organizationId_fkey'
  ) THEN
    ALTER TABLE "OnboardingEvent"
      ADD CONSTRAINT "OnboardingEvent_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- RegulatoryChangeImpact
-- ----------------------------------------------------------------------------
DELETE FROM "RegulatoryChangeImpact" i
  WHERE NOT EXISTS (
    SELECT 1 FROM "Organization" o WHERE o.id = i."organizationId"
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'RegulatoryChangeImpact_organizationId_fkey'
  ) THEN
    ALTER TABLE "RegulatoryChangeImpact"
      ADD CONSTRAINT "RegulatoryChangeImpact_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
