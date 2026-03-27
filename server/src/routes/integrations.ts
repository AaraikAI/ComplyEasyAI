/**
 * Integrations Routes
 * Defines all endpoints for OAuth flows and integration management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import { validateBody } from '../middleware/validate';
import {
  connectAWSSchema,
  connectAzureSchema,
  connectProviderSchema,
  syncProviderSchema,
  postSlackMessageSchema,
  createJiraIssueSchema,
  collectEvidenceSchema,
} from '../validators/integrationSchemas';
import * as integrationsController from '../controllers/integrationsController';
import { asyncHandler } from '../types/express';

const router = express.Router();

// ============================================================================
// GOOGLE WORKSPACE
// ============================================================================

// Start OAuth flow
router.get(
  '/google/authorize',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.authorizeGoogle)
);

// OAuth callback (public - no auth required)
router.get('/google/callback', asyncHandler(integrationsController.callbackGoogle));

// Sync data
router.post(
  '/google/sync',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.syncGoogleData)
);

// Disconnect
router.delete(
  '/google',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectGoogle)
);

// ============================================================================
// GITHUB
// ============================================================================

router.get(
  '/github/authorize',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.authorizeGitHub)
);

router.get('/github/callback', asyncHandler(integrationsController.callbackGitHub));

router.post(
  '/github/sync',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.syncGitHubData)
);

router.delete(
  '/github',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectGitHub)
);

// ============================================================================
// SLACK
// ============================================================================

router.get(
  '/slack/authorize',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.authorizeSlack)
);

router.get('/slack/callback', asyncHandler(integrationsController.callbackSlack));

router.post(
  '/slack/sync',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.syncSlackData)
);

router.post(
  '/slack/message',
  authenticate,
  authorize('admin', 'editor'),
  validateBody(postSlackMessageSchema),
  asyncHandler(integrationsController.postSlackMessage)
);

router.delete(
  '/slack',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectSlack)
);

// ============================================================================
// JIRA
// ============================================================================

router.get(
  '/jira/authorize',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.authorizeJira)
);

router.get('/jira/callback', asyncHandler(integrationsController.callbackJira));

router.post(
  '/jira/sync',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.syncJiraData)
);

router.post(
  '/jira/issue',
  authenticate,
  authorize('admin', 'editor'),
  validateBody(createJiraIssueSchema),
  asyncHandler(integrationsController.createJiraIssue)
);

router.delete(
  '/jira',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectJira)
);

// ============================================================================
// AWS
// ============================================================================

router.post(
  '/aws/connect',
  authenticate,
  authorize('admin'),
  validateBody(connectAWSSchema),
  asyncHandler(integrationsController.connectAWS)
);

router.post(
  '/aws/sync',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.syncAWSData)
);

router.delete(
  '/aws',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectAWS)
);

// ============================================================================
// AZURE
// ============================================================================

router.post(
  '/azure/connect',
  authenticate,
  authorize('admin'),
  validateBody(connectAzureSchema),
  asyncHandler(integrationsController.connectAzure)
);

router.post(
  '/azure/sync',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.syncAzureData)
);

router.delete(
  '/azure',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectAzure)
);

// Azure Full Sync (with persistence)
router.post(
  '/azure/sync/full',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.runAzureFullSync)
);

// Azure Sync Status
router.get(
  '/azure/sync/status',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncStatus)
);

// Azure Sync History
router.get(
  '/azure/sync/history',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncHistory)
);

// Azure Synced Resources
router.get(
  '/azure/synced/resources',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncedResources)
);

// Azure Synced Security Findings
router.get(
  '/azure/synced/security-findings',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncedSecurityFindings)
);

// Azure Synced Security Alerts
router.get(
  '/azure/synced/security-alerts',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncedSecurityAlerts)
);

// Azure Synced Users
router.get(
  '/azure/synced/users',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncedUsers)
);

// Azure Synced Policy Compliance
router.get(
  '/azure/synced/policies',
  authenticate,
  asyncHandler(integrationsController.getAzureSyncedPolicies)
);

// ============================================================================
// INTEGRATION REGISTRY — test, evidence, bulk operations
// ============================================================================

// Test connection for a specific provider (real API call)
router.post(
  '/:provider/test',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.testProviderConnection)
);

// Collect evidence from a specific provider (real API call)
router.post(
  '/:provider/evidence',
  authenticate,
  authorize('admin', 'editor'),
  validateBody(collectEvidenceSchema),
  asyncHandler(integrationsController.collectProviderEvidence)
);

// Bulk test all connected integrations
router.post(
  '/bulk/test-all',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.testAllConnections)
);

// Get registry stats — how many providers are registered
router.get(
  '/registry/stats',
  authenticate,
  asyncHandler(integrationsController.getRegistryStats)
);

// ============================================================================
// GENERAL
// ============================================================================

// List all integrations
router.get(
  '/',
  authenticate,
  asyncHandler(integrationsController.listIntegrations)
);

// Get integration status
router.get(
  '/:provider',
  authenticate,
  asyncHandler(integrationsController.getIntegrationStatus)
);

// Generic connect endpoint for API key, PAT, username/password, etc.
router.post(
  '/:provider/connect',
  authenticate,
  authorize('admin', 'editor'),
  enforceLimit('maxIntegrations'),
  validateBody(connectProviderSchema),
  asyncHandler(integrationsController.connectProvider)
);

// Generic authorize endpoint for unsupported providers (must come after specific routes)
router.get(
  '/:provider/authorize',
  authenticate,
  authorize('admin', 'editor'),
  asyncHandler(integrationsController.authorizeProvider)
);

// Generic sync endpoint for all integrations (must come after specific sync routes)
router.post(
  '/:provider/sync',
  authenticate,
  authorize('admin', 'editor'),
  validateBody(syncProviderSchema),
  asyncHandler(integrationsController.syncProvider)
);

// Generic disconnect endpoint for all integrations (must come after specific DELETE routes)
router.delete(
  '/:provider',
  authenticate,
  authorize('admin'),
  asyncHandler(integrationsController.disconnectProvider)
);

export default router;
