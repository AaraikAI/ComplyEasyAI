-- ============================================
-- QUICK FIX: Add stripeSubscriptionId Column
-- Run this in Supabase SQL Editor
-- ============================================

-- Add stripeSubscriptionId column to Organization table
ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT UNIQUE;

-- Create index for stripeSubscriptionId
CREATE INDEX IF NOT EXISTS "Organization_stripeSubscriptionId_idx" 
ON "Organization"("stripeSubscriptionId");

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Organization' 
AND column_name = 'stripeSubscriptionId';

