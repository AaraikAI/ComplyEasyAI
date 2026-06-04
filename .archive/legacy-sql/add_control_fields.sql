-- ============================================
-- Add Owner and Evidence Required Fields to FrameworkControl
-- Run this in Supabase SQL Editor
-- ============================================

-- Add ownerId field (references User table)
ALTER TABLE "FrameworkControl" 
ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- Add foreign key constraint for ownerId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FrameworkControl_ownerId_fkey'
    ) THEN
        ALTER TABLE "FrameworkControl"
        ADD CONSTRAINT "FrameworkControl_ownerId_fkey"
        FOREIGN KEY ("ownerId")
        REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add index for ownerId
CREATE INDEX IF NOT EXISTS "FrameworkControl_ownerId_idx" 
ON "FrameworkControl"("ownerId");

-- Add evidenceRequired field
ALTER TABLE "FrameworkControl" 
ADD COLUMN IF NOT EXISTS "evidenceRequired" BOOLEAN NOT NULL DEFAULT false;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'FrameworkControl' 
AND column_name IN ('ownerId', 'evidenceRequired')
ORDER BY column_name;

