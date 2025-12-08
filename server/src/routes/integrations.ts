/**
 * Integrations Routes
 * Defines all endpoints for OAuth flows and integration management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
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

export default router;
