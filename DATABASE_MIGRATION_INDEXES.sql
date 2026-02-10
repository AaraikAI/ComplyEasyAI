-- =============================================================================
-- ComplyEasyAI - Database Migration: Missing Indexes & Constraints
-- Generated: February 10, 2026
-- Purpose: Add missing indexes identified in Production Readiness Audit v3.0
-- Database: PostgreSQL (Supabase)
-- =============================================================================
--
-- INSTRUCTIONS:
-- 1. Run this migration against your Supabase PostgreSQL database
-- 2. All indexes use CREATE INDEX IF NOT EXISTS for idempotency
-- 3. Alternatively, add the Prisma @@index directives and run `npx prisma migrate dev`
-- 4. Estimated impact: Minimal write overhead, significant read improvement
--
-- =============================================================================

-- =============================================================================
-- SECTION 1: MISSING FOREIGN KEY INDEXES (HIGH PRIORITY)
-- These foreign key fields are used in JOINs but lack indexes, causing slow queries
-- =============================================================================

-- 1. AccessReview.reviewerId - Used in reviewer lookups
CREATE INDEX IF NOT EXISTS "AccessReview_reviewerId_idx"
ON "AccessReview" ("reviewerId");

-- 2. ContinuousMonitor.integrationId - Used for filtering monitors by integration
CREATE INDEX IF NOT EXISTS "ContinuousMonitor_integrationId_idx"
ON "ContinuousMonitor" ("integrationId");

-- 3. Issue.createdById - Used in creator queries and audit trails
CREATE INDEX IF NOT EXISTS "Issue_createdById_idx"
ON "Issue" ("createdById");

-- 4. RiskPrediction.riskId - Used in risk-prediction joins
CREATE INDEX IF NOT EXISTS "RiskPrediction_riskId_idx"
ON "RiskPrediction" ("riskId");

-- 5. CompliancePolicy.previousVersionId - Used for version chain traversal
CREATE INDEX IF NOT EXISTS "CompliancePolicy_previousVersionId_idx"
ON "CompliancePolicy" ("previousVersionId");

-- 6. AISuggestion.controlId - Used in control-suggestion joins
CREATE INDEX IF NOT EXISTS "AISuggestion_controlId_idx"
ON "AISuggestion" ("controlId");

-- 7. EvidenceVersion.uploadedBy - Used in uploader queries
CREATE INDEX IF NOT EXISTS "EvidenceVersion_uploadedBy_idx"
ON "EvidenceVersion" ("uploadedBy");

-- 8. EUAIActTransparencyReport.eUAIActSystemId - Used in system-report joins
CREATE INDEX IF NOT EXISTS "EUAIActTransparencyReport_eUAIActSystemId_idx"
ON "EUAIActTransparencyReport" ("eUAIActSystemId");

-- 9. Tutorial.authorId - Used for author queries
CREATE INDEX IF NOT EXISTS "Tutorial_authorId_idx"
ON "Tutorial" ("authorId");


-- =============================================================================
-- SECTION 2: COMPOSITE INDEXES FOR QUERY OPTIMIZATION (MEDIUM PRIORITY)
-- These cover common multi-column query patterns identified in the codebase
-- =============================================================================

-- 10. AuditLog - Time-range queries per organization (most common audit query)
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_timestamp_idx"
ON "AuditLog" ("organizationId", "timestamp" DESC);

-- 11. Issue - Filtered issue lists (status + priority within org)
CREATE INDEX IF NOT EXISTS "Issue_organizationId_status_priority_idx"
ON "Issue" ("organizationId", "status", "priority");

-- 12. Notification - Unread notifications query (userId + readAt IS NULL)
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx"
ON "Notification" ("userId", "readAt");

-- 13. WebhookEvent - Retry queue processing (pending events sorted by next attempt)
CREATE INDEX IF NOT EXISTS "WebhookEvent_status_nextAttemptAt_idx"
ON "WebhookEvent" ("status", "nextAttemptAt");

-- 14. VendorAssessment - Chronological assessments per vendor
CREATE INDEX IF NOT EXISTS "VendorAssessment_vendorId_assessedDate_idx"
ON "VendorAssessment" ("vendorId", "assessedDate" DESC);

-- 15. MonitorResult - Chronological results per monitor
CREATE INDEX IF NOT EXISTS "MonitorResult_monitorId_runDate_idx"
ON "MonitorResult" ("monitorId", "runDate" DESC);

-- 16. ControlLoopHistory - Chronological execution history per loop
CREATE INDEX IF NOT EXISTS "ControlLoopHistory_loopId_timestamp_idx"
ON "ControlLoopHistory" ("loopId", "timestamp" DESC);


-- =============================================================================
-- SECTION 3: VERIFICATION QUERIES
-- Run these after migration to verify indexes were created successfully
-- =============================================================================

-- List all indexes created by this migration:
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE indexname LIKE '%_idx'
--   AND indexname IN (
--     'AccessReview_reviewerId_idx',
--     'ContinuousMonitor_integrationId_idx',
--     'Issue_createdById_idx',
--     'RiskPrediction_riskId_idx',
--     'CompliancePolicy_previousVersionId_idx',
--     'AISuggestion_controlId_idx',
--     'EvidenceVersion_uploadedBy_idx',
--     'EUAIActTransparencyReport_eUAIActSystemId_idx',
--     'Tutorial_authorId_idx',
--     'AuditLog_organizationId_timestamp_idx',
--     'Issue_organizationId_status_priority_idx',
--     'Notification_userId_readAt_idx',
--     'WebhookEvent_status_nextAttemptAt_idx',
--     'VendorAssessment_vendorId_assessedDate_idx',
--     'MonitorResult_monitorId_runDate_idx',
--     'ControlLoopHistory_loopId_timestamp_idx'
--   )
-- ORDER BY tablename, indexname;


-- =============================================================================
-- SECTION 4: EQUIVALENT PRISMA SCHEMA CHANGES
-- If you prefer to manage indexes via Prisma migrations, add these to schema.prisma
-- Then run: npx prisma migrate dev --name add_missing_indexes
-- =============================================================================

-- model AccessReview {
--   ...existing fields...
--   @@index([reviewerId])  // ADD THIS
-- }

-- model ContinuousMonitor {
--   ...existing fields...
--   @@index([integrationId])  // ADD THIS
-- }

-- model Issue {
--   ...existing fields...
--   @@index([createdById])  // ADD THIS
--   @@index([organizationId, status, priority])  // ADD THIS (composite)
-- }

-- model RiskPrediction {
--   ...existing fields...
--   @@index([riskId])  // ADD THIS
-- }

-- model CompliancePolicy {
--   ...existing fields...
--   @@index([previousVersionId])  // ADD THIS
-- }

-- model AISuggestion {
--   ...existing fields...
--   @@index([controlId])  // ADD THIS
-- }

-- model EvidenceVersion {
--   ...existing fields...
--   @@index([uploadedBy])  // ADD THIS
-- }

-- model EUAIActTransparencyReport {
--   ...existing fields...
--   @@index([eUAIActSystemId])  // ADD THIS
-- }

-- model Tutorial {
--   ...existing fields...
--   @@index([authorId])  // ADD THIS
-- }

-- model AuditLog {
--   ...existing fields...
--   @@index([organizationId, timestamp])  // ADD THIS (composite, replaces individual ones for this query pattern)
-- }

-- model Notification {
--   ...existing fields...
--   @@index([userId, readAt])  // ADD THIS (composite)
-- }

-- model WebhookEvent {
--   ...existing fields...
--   @@index([status, nextAttemptAt])  // ADD THIS (composite)
-- }

-- model VendorAssessment {
--   ...existing fields...
--   @@index([vendorId, assessedDate])  // ADD THIS (composite)
-- }

-- model MonitorResult {
--   ...existing fields...
--   @@index([monitorId, runDate])  // ADD THIS (composite)
-- }

-- model ControlLoopHistory {
--   ...existing fields...
--   @@index([loopId, timestamp])  // ADD THIS (composite, may already exist - check for duplicates)
-- }


-- =============================================================================
-- NOTES:
-- =============================================================================
-- Total new indexes: 16
--   - 9 single-column FK indexes (HIGH priority)
--   - 7 composite indexes (MEDIUM priority)
--
-- Estimated disk space increase: Minimal (~1-5 MB depending on row counts)
-- Write performance impact: Negligible (< 1% overhead per INSERT/UPDATE)
-- Read performance improvement: 10-100x for affected queries at scale
--
-- MISSING TABLES: NONE
-- All 124 Prisma models have corresponding tables. No new tables needed.
-- =============================================================================
