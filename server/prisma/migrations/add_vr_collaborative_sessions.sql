-- Migration: Add VR Collaborative Review Sessions table
-- Created: 2026-01-15
-- Description: Adds database persistence for VR collaborative review sessions

-- Create VRCollaborativeSession table
CREATE TABLE IF NOT EXISTS "VRCollaborativeSession" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL UNIQUE,
    "organizationId" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "description" TEXT,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hostUserId" TEXT NOT NULL,
    "maxParticipants" INTEGER,
    "scheduledTime" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "environment" JSONB NOT NULL,
    "complianceData" JSONB NOT NULL,
    "participants" JSONB NOT NULL DEFAULT '[]',
    "permissions" JSONB,
    "recording" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE "VRCollaborativeSession" 
ADD CONSTRAINT "VRCollaborativeSession_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "VRCollaborativeSession_organizationId_idx" ON "VRCollaborativeSession"("organizationId");
CREATE INDEX IF NOT EXISTS "VRCollaborativeSession_sessionId_idx" ON "VRCollaborativeSession"("sessionId");
CREATE INDEX IF NOT EXISTS "VRCollaborativeSession_status_idx" ON "VRCollaborativeSession"("status");
CREATE INDEX IF NOT EXISTS "VRCollaborativeSession_hostUserId_idx" ON "VRCollaborativeSession"("hostUserId");
CREATE INDEX IF NOT EXISTS "VRCollaborativeSession_expiresAt_idx" ON "VRCollaborativeSession"("expiresAt");
CREATE INDEX IF NOT EXISTS "VRCollaborativeSession_lastActivityAt_idx" ON "VRCollaborativeSession"("lastActivityAt");

-- Add comment
COMMENT ON TABLE "VRCollaborativeSession" IS 'Stores VR collaborative review sessions with persistence and expiration support';

