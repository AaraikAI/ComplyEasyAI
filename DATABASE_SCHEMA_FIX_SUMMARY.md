# Database Schema Fix Summary

## Overview
This document summarizes all missing database fields and provides SQL queries to fix them.

## Quick Fix: Add stripeSubscriptionId Column

**File:** `QUICK_FIX_stripeSubscriptionId.sql`

This is the minimal fix to add just the `stripeSubscriptionId` column that was causing the immediate error.

## Complete Fix: All Missing Fields

**File:** `fix_database_schema.sql`

This comprehensive script fixes all schema mismatches between the Prisma schema and the database.

## Missing Fields in Organization Table

The following columns are missing from the `Organization` table:

1. ✅ **stripeSubscriptionId** (TEXT, UNIQUE) - Stripe subscription ID
2. ✅ **billingCycle** (BillingCycle enum) - Monthly or annual billing
3. ✅ **trialEndsAt** (TIMESTAMP) - When the trial period ends
4. ✅ **subscriptionStartedAt** (TIMESTAMP) - When subscription started
5. ✅ **subscriptionEndsAt** (TIMESTAMP) - When subscription ends
6. ✅ **cancelAtPeriodEnd** (BOOLEAN) - Whether to cancel at period end
7. ✅ **activeAddOns** (TEXT[]) - Array of active add-on names
8. ✅ **usageMetrics** (JSONB) - Usage tracking data

## Missing Enum Values

### SubscriptionStatus Enum
Missing values:
- `incomplete`
- `incomplete_expired`
- `unpaid`

### Plan Enum
Current database has: `Basic`, `Pro`, `Enterprise`
Prisma schema expects: `Foundation`, `Essentials`, `Growth`, `Visionary`

**Note:** The fix script adds the new values while keeping the old ones for backward compatibility. You may want to migrate existing data (see optional migration in the script).

### BillingCycle Enum
This enum may not exist at all. The script creates it with values:
- `monthly`
- `annual`

## How to Apply the Fixes

### Option 1: Quick Fix (Just stripeSubscriptionId)
1. Open Supabase SQL Editor
2. Copy and paste the contents of `QUICK_FIX_stripeSubscriptionId.sql`
3. Run the query

### Option 2: Complete Fix (All Missing Fields)
1. Open Supabase SQL Editor
2. Copy and paste the contents of `fix_database_schema.sql`
3. Run the query
4. Review the verification queries at the end to confirm all columns were added

## Verification

After running the scripts, you can verify the changes:

```sql
-- Check Organization table columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Organization' 
ORDER BY ordinal_position;

-- Check enum values
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('Plan', 'SubscriptionStatus', 'BillingCycle')
ORDER BY t.typname, e.enumsortorder;
```

## Important Notes

1. **Plan Enum Migration**: The script adds new Plan enum values but doesn't automatically migrate existing data. If you have organizations with `Basic`, `Pro`, or `Enterprise` plans, you may want to update them to the new values:
   - `Basic` → `Foundation`
   - `Pro` → `Growth`
   - `Enterprise` → `Visionary`

2. **Backward Compatibility**: The script is designed to be safe and won't break existing data. It only adds missing columns and enum values.

3. **Indexes**: The script automatically creates necessary indexes for performance.

4. **Default Values**: All new columns have appropriate default values to prevent errors with existing data.

## After Running the Fixes

Once you've applied the fixes:
1. Restart your backend server (if running)
2. The magic link login should now work without errors
3. All Organization-related queries should work correctly

## Troubleshooting

If you encounter errors:
1. Check that you're running the queries in the Supabase SQL Editor (not in a migration)
2. Ensure you have the necessary permissions
3. Check the Supabase logs for detailed error messages
4. Verify the table and enum names match exactly (case-sensitive)

