-- ============================================
-- ComplyEasy AI - Database Schema Fixes
-- Run this in Supabase SQL Editor
-- ============================================
-- This script adds all missing columns and enum values
-- to match the Prisma schema
-- ============================================

-- ============================================
-- 1. UPDATE ENUMS
-- ============================================

-- Add missing SubscriptionStatus enum values
DO $$ 
BEGIN
    -- Add 'incomplete' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'incomplete' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus')) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'incomplete';
    END IF;
    
    -- Add 'incomplete_expired' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'incomplete_expired' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus')) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'incomplete_expired';
    END IF;
    
    -- Add 'unpaid' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unpaid' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus')) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'unpaid';
    END IF;
END $$;

-- Create BillingCycle enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingCycle') THEN
        CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annual');
    END IF;
END $$;

-- Update Plan enum to include new values
-- Note: We'll add new values but keep old ones for backward compatibility
DO $$ 
BEGIN
    -- Add 'Foundation' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Foundation' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Plan')) THEN
        ALTER TYPE "Plan" ADD VALUE 'Foundation';
    END IF;
    
    -- Add 'Essentials' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Essentials' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Plan')) THEN
        ALTER TYPE "Plan" ADD VALUE 'Essentials';
    END IF;
    
    -- Add 'Growth' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Growth' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Plan')) THEN
        ALTER TYPE "Plan" ADD VALUE 'Growth';
    END IF;
    
    -- Add 'Visionary' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Visionary' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Plan')) THEN
        ALTER TYPE "Plan" ADD VALUE 'Visionary';
    END IF;
END $$;

-- ============================================
-- 2. ADD MISSING COLUMNS TO Organization TABLE
-- ============================================

-- Add stripeSubscriptionId column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'stripeSubscriptionId'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "stripeSubscriptionId" TEXT UNIQUE;
        
        -- Create index for stripeSubscriptionId
        CREATE INDEX IF NOT EXISTS "Organization_stripeSubscriptionId_idx" 
        ON "Organization"("stripeSubscriptionId");
    END IF;
END $$;

-- Add billingCycle column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'billingCycle'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'annual';
    END IF;
END $$;

-- Add trialEndsAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'trialEndsAt'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "trialEndsAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add subscriptionStartedAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'subscriptionStartedAt'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add subscriptionEndsAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'subscriptionEndsAt'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add cancelAtPeriodEnd column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'cancelAtPeriodEnd'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add activeAddOns column (array of strings)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'activeAddOns'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "activeAddOns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Add usageMetrics column (JSON)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Organization' 
        AND column_name = 'usageMetrics'
    ) THEN
        ALTER TABLE "Organization" 
        ADD COLUMN "usageMetrics" JSONB;
    END IF;
END $$;

-- ============================================
-- 3. VERIFICATION QUERIES
-- ============================================

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Organization' 
ORDER BY ordinal_position;

-- Verify enum values
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('Plan', 'SubscriptionStatus', 'BillingCycle')
ORDER BY t.typname, e.enumsortorder;

-- ============================================
-- 4. OPTIONAL: MIGRATE EXISTING PLAN VALUES
-- ============================================
-- Uncomment and run this if you want to migrate old plan values to new ones
-- WARNING: This will update existing data. Review before running.

/*
-- Map old plan values to new ones
UPDATE "Organization" 
SET "plan" = 'Foundation' 
WHERE "plan" = 'Basic';

UPDATE "Organization" 
SET "plan" = 'Growth' 
WHERE "plan" = 'Pro';

UPDATE "Organization" 
SET "plan" = 'Visionary' 
WHERE "plan" = 'Enterprise';
*/

-- ============================================
-- END OF SCRIPT
-- ============================================

