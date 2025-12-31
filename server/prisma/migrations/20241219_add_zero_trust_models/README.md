# Migration: Add Zero Trust Security Models

**Date:** 2024-12-19  
**Migration Name:** `20241219_add_zero_trust_models`

## Description

This migration adds three new database tables to support Zero Trust Security functionality:

1. **DeviceTrust** - Tracks device trust information, fingerprints, and trust scores
2. **ZeroTrustPolicy** - Stores Zero Trust security policies with rules
3. **NetworkSegment** - Manages network segmentation rules for Zero Trust architecture

## Tables Created

### DeviceTrust
- Stores device trust verification data
- Tracks trust scores (0-100)
- Maintains device fingerprints
- Links to Organization via foreign key

### ZeroTrustPolicy
- Stores Zero Trust security policies
- Contains policy rules in JSON format
- Supports priority-based policy evaluation
- Links to Organization via foreign key

### NetworkSegment
- Manages network segmentation
- Stores CIDR ranges and resource mappings
- Defines trust levels for network segments
- Links to Organization via foreign key

## Indexes Created

- `DeviceTrust`: organizationId, deviceId, isTrusted, unique(deviceId, organizationId)
- `ZeroTrustPolicy`: organizationId, enabled
- `NetworkSegment`: organizationId, trustLevel

## Foreign Keys

All three tables have foreign key relationships to the `Organization` table with CASCADE delete.

## Usage

This migration can be applied using:

```bash
npx prisma migrate deploy
```

Or manually by running the SQL in your database:

```bash
psql $DATABASE_URL -f prisma/migrations/20241219_add_zero_trust_models/migration.sql
```

## Rollback

To rollback this migration, run:

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

## Notes

- This migration uses PostgreSQL's `uuid-ossp` extension for UUID generation
- All tables use JSONB for flexible JSON data storage
- Timestamps are automatically managed (createdAt, updatedAt)
- All foreign keys use CASCADE delete to maintain referential integrity

