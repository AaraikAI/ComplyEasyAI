/**
 * Integrations Routes
 * Defines all endpoints for OAuth flows and integration management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as integrationsController from '../controllers/integrationsController';

const router = express.Router();

// ============================================================================
// GOOGLE WORKSPACE
// ============================================================================

// Start OAuth flow
router.get(
  '/google/authorize',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.authorizeGoogle
);

// OAuth callback (public - no auth required)
router.get('/google/callback', integrationsController.callbackGoogle);

// Sync data
router.post(
  '/google/sync',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.syncGoogleData
);

// Disconnect
router.delete(
  '/google',
  authenticate,
  authorize('admin'),
  integrationsController.disconnectGoogle
);

// ============================================================================
// GITHUB
// ============================================================================

router.get(
  '/github/authorize',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.authorizeGitHub
);

router.get('/github/callback', integrationsController.callbackGitHub);

router.post(
  '/github/sync',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.syncGitHubData
);

router.delete(
  '/github',
  authenticate,
  authorize('admin'),
  integrationsController.disconnectGitHub
);

// ============================================================================
// SLACK
// ============================================================================

router.get(
  '/slack/authorize',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.authorizeSlack
);

router.get('/slack/callback', integrationsController.callbackSlack);

router.post(
  '/slack/sync',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.syncSlackData
);

router.post(
  '/slack/message',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.postSlackMessage
);

router.delete(
  '/slack',
  authenticate,
  authorize('admin'),
  integrationsController.disconnectSlack
);

// ============================================================================
// JIRA
// ============================================================================

router.get(
  '/jira/authorize',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.authorizeJira
);

router.get('/jira/callback', integrationsController.callbackJira);

router.post(
  '/jira/sync',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.syncJiraData
);

router.post(
  '/jira/issue',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.createJiraIssue
);

router.delete(
  '/jira',
  authenticate,
  authorize('admin'),
  integrationsController.disconnectJira
);

// ============================================================================
// AWS
// ============================================================================

router.post(
  '/aws/connect',
  authenticate,
  authorize('admin'),
  integrationsController.connectAWS
);

router.post(
  '/aws/sync',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.syncAWSData
);

router.delete(
  '/aws',
  authenticate,
  authorize('admin'),
  integrationsController.disconnectAWS
);

// ============================================================================
// GENERAL
// ============================================================================

// List all integrations
router.get(
  '/',
  authenticate,
  integrationsController.listIntegrations
);

// Get integration status
router.get(
  '/:provider',
  authenticate,
  integrationsController.getIntegrationStatus
);

export default router;
