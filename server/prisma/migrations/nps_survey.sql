-- ============================================================================
-- NPS Survey Module
-- ----------------------------------------------------------------------------
-- Adds 2 tables:
--   NPSInvitation — scheduled / sent invitations with status tracking
--   NPSResponse   — collected 0-10 scores with optional comment, category
-- Both are organization-scoped with ON DELETE CASCADE.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "NPSInvitation" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "snoozedUntil" TIMESTAMP(3),
  "emailMessageId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Scheduled',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NPSInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NPSInvitation_userId_trigger_scheduledFor_key" UNIQUE ("userId", "trigger", "scheduledFor"),
  CONSTRAINT "NPSInvitation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "NPSInvitation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "NPSInvitation_organizationId_idx" ON "NPSInvitation"("organizationId");
CREATE INDEX IF NOT EXISTS "NPSInvitation_userId_idx" ON "NPSInvitation"("userId");
CREATE INDEX IF NOT EXISTS "NPSInvitation_status_idx" ON "NPSInvitation"("status");
CREATE INDEX IF NOT EXISTS "NPSInvitation_scheduledFor_idx" ON "NPSInvitation"("scheduledFor");
CREATE INDEX IF NOT EXISTS "NPSInvitation_expiresAt_idx" ON "NPSInvitation"("expiresAt");

CREATE TABLE IF NOT EXISTS "NPSResponse" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "invitationId" TEXT,
  "score" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "comment" TEXT,
  "source" TEXT NOT NULL DEFAULT 'in_app',
  "userAgent" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NPSResponse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NPSResponse_score_check" CHECK ("score" >= 0 AND "score" <= 10),
  CONSTRAINT "NPSResponse_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "NPSResponse_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "NPSResponse_invitationId_fkey"
    FOREIGN KEY ("invitationId") REFERENCES "NPSInvitation"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "NPSResponse_organizationId_idx" ON "NPSResponse"("organizationId");
CREATE INDEX IF NOT EXISTS "NPSResponse_userId_idx" ON "NPSResponse"("userId");
CREATE INDEX IF NOT EXISTS "NPSResponse_invitationId_idx" ON "NPSResponse"("invitationId");
CREATE INDEX IF NOT EXISTS "NPSResponse_category_idx" ON "NPSResponse"("category");
CREATE INDEX IF NOT EXISTS "NPSResponse_createdAt_idx" ON "NPSResponse"("createdAt");
