# Production Migration Guide: Zero Trust Security Models

## Overview

This document describes the production-ready migration for Zero Trust Security models that was created to replace the `prisma db push` approach used during development.

## Migration Details

**Migration Name:** `20241219_add_zero_trust_models`  
**Location:** `server/prisma/migrations/20241219_add_zero_trust_models/`  
**Status:** ✅ Created and marked as applied (since tables already exist from `db push`)

## What This Migration Does

Creates three new database tables for Zero Trust Security:

1. **DeviceTrust** - Device trust tracking and verification
2. **ZeroTrustPolicy** - Zero Trust security policies
3. **NetworkSegment** - Network segmentation rules

## Migration File Structure

```
server/prisma/migrations/20241219_add_zero_trust_models/
├── migration.sql    # SQL migration script
└── README.md        # Migration documentation
```

## Applying the Migration

### For Fresh Databases

If you're setting up a new database or need to apply this migration:

```bash
cd server
npx prisma migrate deploy
```

This will apply all pending migrations, including this one.

### Manual Application

You can also apply the migration manually using psql:

```bash
psql $DATABASE_URL -f prisma/migrations/20241219_add_zero_trust_models/migration.sql
```

### For Existing Databases (Already Applied)

Since we used `prisma db push` during development, the tables already exist. The migration has been marked as applied using:

```bash
npx prisma migrate resolve --applied 20241219_add_zero_trust_models
```

This tells Prisma that the migration has already been applied to the database.

## Migration SQL Summary

The migration includes:

1. **Extension Check**: Ensures `uuid-ossp` extension is enabled
2. **Three CREATE TABLE statements**:
   - DeviceTrust with indexes and unique constraints
   - ZeroTrustPolicy with indexes
   - NetworkSegment with indexes
3. **Foreign Key Constraints**: All tables reference Organization with CASCADE delete
4. **Indexes**: Optimized indexes for common query patterns

## Verification

To verify the migration was applied correctly:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('DeviceTrust', 'ZeroTrustPolicy', 'NetworkSegment');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('DeviceTrust', 'ZeroTrustPolicy', 'NetworkSegment');

-- Check foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('DeviceTrust', 'ZeroTrustPolicy', 'NetworkSegment');
```

## Rollback Instructions

If you need to rollback this migration, use the SQL provided in the migration README:

```sql
-- Drop foreign keys first
ALTER TABLE "DeviceTrust" DROP CONSTRAINT IF EXISTS "DeviceTrust_organizationId_fkey";
ALTER TABLE "ZeroTrustPolicy" DROP CONSTRAINT IF EXISTS "ZeroTrustPolicy_organizationId_fkey";
ALTER TABLE "NetworkSegment" DROP CONSTRAINT IF EXISTS "NetworkSegment_organizationId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "DeviceTrust_deviceId_organizationId_key";
DROP INDEX IF EXISTS "DeviceTrust_organizationId_idx";
DROP INDEX IF EXISTS "DeviceTrust_deviceId_idx";
DROP INDEX IF EXISTS "DeviceTrust_isTrusted_idx";
DROP INDEX IF EXISTS "ZeroTrustPolicy_organizationId_idx";
DROP INDEX IF EXISTS "ZeroTrustPolicy_enabled_idx";
DROP INDEX IF EXISTS "NetworkSegment_organizationId_idx";
DROP INDEX IF EXISTS "NetworkSegment_trustLevel_idx";

-- Drop tables
DROP TABLE IF EXISTS "DeviceTrust";
DROP TABLE IF EXISTS "ZeroTrustPolicy";
DROP TABLE IF EXISTS "NetworkSegment";
```

## Production Deployment Checklist

- [x] Migration SQL file created
- [x] Migration README documentation created
- [x] Migration marked as applied (for existing database)
- [x] Foreign key constraints verified
- [x] Indexes verified
- [x] UUID extension check included
- [ ] Test migration on staging environment
- [ ] Backup database before production deployment
- [ ] Apply migration during maintenance window
- [ ] Verify application functionality after migration

## Differences from `prisma db push`

| Aspect | `prisma db push` | `prisma migrate` |
|--------|------------------|-----------------|
| **Purpose** | Development/Prototyping | Production |
| **Version Control** | No migration history | Full migration history |
| **Rollback** | Manual SQL required | Migration-based rollback |
| **Team Sync** | Schema only | Schema + migration files |
| **CI/CD** | Not recommended | Recommended |
| **Audit Trail** | None | Complete history |

## Best Practices

1. **Always use migrations in production** - Never use `prisma db push` in production
2. **Test migrations first** - Apply to staging before production
3. **Backup before migration** - Always backup your database
4. **Monitor after deployment** - Check application logs and metrics
5. **Keep migration files** - Never delete migration files from version control

## Related Files

- `server/prisma/schema.prisma` - Prisma schema definition
- `server/src/services/advanced/zeroTrustService.ts` - Zero Trust service implementation
- `PRODUCTION_FEATURES_IMPLEMENTATION_SUMMARY.md` - Feature implementation summary

## Support

If you encounter issues with this migration:

1. Check the migration SQL syntax
2. Verify database permissions
3. Ensure UUID extension is enabled
4. Check Prisma migration status: `npx prisma migrate status`
5. Review application logs for errors

---

**Created:** 2024-12-19  
**Last Updated:** 2024-12-19

