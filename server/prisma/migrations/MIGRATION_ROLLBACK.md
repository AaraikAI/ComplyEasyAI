# Migration Rollback Procedures

## Overview

Prisma does not natively support down migrations. This document provides manual rollback SQL for critical schema changes. Always take a database backup before applying or rolling back migrations.

## Pre-Rollback Checklist

1. Notify the team and pause deployments
2. Take a full database backup: `pg_dump -Fc complyeasy > backup_$(date +%Y%m%d_%H%M%S).dump`
3. Verify the backup is valid: `pg_restore --list backup_*.dump`
4. Identify the target migration version to roll back to
5. Apply the rollback SQL in a transaction

## Rollback Commands

### General Pattern

```sql
BEGIN;
-- Run the rollback SQL for the specific migration
-- Then remove the migration record from _prisma_migrations
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '<migration_folder_name>';
COMMIT;
```

### Migration: 20260315_add_checklist_grc_columns

```sql
BEGIN;
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "riskHeatmapViewed";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "regulatoryTrackerViewed";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "vendorMonitoringConfigured";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "privacyPlatformViewed";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "incidentManagementViewed";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "controlTestingConfigured";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "auditPrepStarted";
ALTER TABLE "OnboardingChecklist" DROP COLUMN IF EXISTS "workflowAutomationConfigured";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260315_add_checklist_grc_columns';
COMMIT;
```

### Migration: 20260129_add_onboarding_tables

```sql
BEGIN;
DROP TABLE IF EXISTS "OnboardingChecklist" CASCADE;
DROP TABLE IF EXISTS "OnboardingEvent" CASCADE;
DROP TABLE IF EXISTS "OnboardingProgress" CASCADE;
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260129_add_onboarding_tables';
COMMIT;
```

### Migration: 20251204_add_2fa_support

```sql
BEGIN;
ALTER TABLE "User" DROP COLUMN IF EXISTS "twoFactorEnabled";
ALTER TABLE "User" DROP COLUMN IF EXISTS "twoFactorSecret";
ALTER TABLE "User" DROP COLUMN IF EXISTS "backupCodes";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20251204_add_2fa_support';
COMMIT;
```

### Migration: 20241219_add_zero_trust_models

```sql
BEGIN;
DROP TABLE IF EXISTS "ZeroTrustPolicy" CASCADE;
DROP TABLE IF EXISTS "ZeroTrustDevice" CASCADE;
DROP TABLE IF EXISTS "ZeroTrustSession" CASCADE;
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20241219_add_zero_trust_models';
COMMIT;
```

## Restoring from Backup

If rollback SQL fails or data corruption is detected:

```bash
# Stop the application
docker compose down

# Restore from backup
pg_restore -d complyeasy --clean --if-exists backup_*.dump

# Re-run migrations to the desired version
npx prisma migrate deploy

# Restart the application
docker compose up -d
```

## Emergency Contacts

- Database Admin: Check team runbook
- On-call Engineer: Check PagerDuty rotation
