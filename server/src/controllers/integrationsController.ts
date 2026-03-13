/**
 * Integrations Controller
 * Handles OAuth flows and integration management for all external services
 */

import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import { Prisma } from '../generated/prisma/client';

// Import integration services
import googleService from '../services/integrations/googleService';
import githubService from '../services/integrations/githubService';
import slackService from '../services/integrations/slackService';
import jiraService from '../services/integrations/jiraService';
import awsService from '../services/integrations/awsService';
import azureService from '../services/integrations/azureService';
import prisma from '../config/database';
import cacheService from '../services/cache/redisCacheService';

// ============================================================================
// OAuth State Storage — Redis-backed with in-memory fallback
// ============================================================================

// In-memory fallback (for development or when Redis is unavailable)
const memoryOauthStates = new Map<string, { organizationId: string; provider: string; timestamp: number }>();
const memoryActiveWindows = new Map<string, { state: string; timestamp: number }>();

const OAUTH_STATE_TTL = 600; // 10 minutes in seconds
const OAUTH_WINDOW_TTL = 900; // 15 minutes in seconds

/**
 * Generate OAuth state parameter and store in Redis (or memory fallback).
 */
const generateState = async (organizationId: string, provider: string): Promise<string> => {
  const state = uuidv4();
  const data = { organizationId, provider, timestamp: Date.now() };

  const redis = cacheService.getRedisClient();
  if (redis) {
    await redis.setex(`oauth:state:${state}`, OAUTH_STATE_TTL, JSON.stringify(data));
  } else {
    memoryOauthStates.set(state, data);
  }

  return state;
};

/**
 * Verify OAuth state parameter — reads from Redis (or memory fallback).
 */
const verifyState = async (state: string, provider: string): Promise<string | null> => {
  const redis = cacheService.getRedisClient();
  let data: { organizationId: string; provider: string; timestamp: number } | null = null;

  if (redis) {
    const raw = await redis.get(`oauth:state:${state}`);
    if (raw) {
      data = JSON.parse(raw);
      await redis.del(`oauth:state:${state}`); // consume once
    }
  } else {
    data = memoryOauthStates.get(state) || null;
    memoryOauthStates.delete(state);
  }

  if (!data) return null;
  if (data.provider !== provider) return null;
  if (Date.now() - data.timestamp > OAUTH_STATE_TTL * 1000) return null;

  return data.organizationId;
};

/**
 * Get / set active OAuth window tracking.
 */
const getActiveWindow = async (key: string): Promise<{ state: string; timestamp: number } | null> => {
  const redis = cacheService.getRedisClient();
  if (redis) {
    const raw = await redis.get(`oauth:window:${key}`);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryActiveWindows.get(key) || null;
};

const setActiveWindow = async (key: string, state: string): Promise<void> => {
  const data = { state, timestamp: Date.now() };
  const redis = cacheService.getRedisClient();
  if (redis) {
    await redis.setex(`oauth:window:${key}`, OAUTH_WINDOW_TTL, JSON.stringify(data));
  } else {
    memoryActiveWindows.set(key, data);
  }
};

const deleteActiveWindow = async (key: string): Promise<void> => {
  const redis = cacheService.getRedisClient();
  if (redis) {
    await redis.del(`oauth:window:${key}`);
  } else {
    memoryActiveWindows.delete(key);
  }
};

// Clean up expired states every 10 minutes (memory fallback only)
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of memoryOauthStates.entries()) {
    if (now - data.timestamp > OAUTH_STATE_TTL * 1000) {
      memoryOauthStates.delete(state);
    }
  }
  for (const [key, window] of memoryActiveWindows.entries()) {
    if (now - window.timestamp > OAUTH_WINDOW_TTL * 1000) {
      memoryActiveWindows.delete(key);
    }
  }
}, 600000);

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

export const authorizeGoogle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const windowKey = `${organizationId}:google`;

    // Check for active OAuth window
    const activeWindow = await getActiveWindow(windowKey);
    if (activeWindow) {
      const timeSinceStart = Date.now() - activeWindow.timestamp;
      if (timeSinceStart < OAUTH_WINDOW_TTL * 1000) {
        res.json({
          authUrl: googleService.getAuthorizationUrl(activeWindow.state),
          existingWindow: true,
          message: 'An OAuth window is already open. Please complete that authorization or wait for it to expire.'
        });
        return;
      } else {
        await deleteActiveWindow(windowKey);
      }
    }

    const state = await generateState(organizationId, 'google');
    await setActiveWindow(windowKey, state);
    const authUrl = googleService.getAuthorizationUrl(state);

    res.json({ authUrl, existingWindow: false });
  } catch (error) {
    logger.error('Error generating Google auth URL', error);
    res.status(500).json({ error: 'Failed to initiate Google authorization' });
  }
};

export const callbackGoogle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const maxRetries = 3;
  const baseDelay = 1000;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        res.status(400).json({ error: 'Missing authorization code or state' });
        return;
      }

      const organizationId = await verifyState(state as string, 'google');

      if (!organizationId) {
        res.status(400).json({ error: 'Invalid or expired state parameter' });
        return;
      }

      // Clean up active window
      const windowKey = `${organizationId}:google`;
      await deleteActiveWindow(windowKey);

      // Exchange code for tokens with retry logic for network failures
      let tokens;
      try {
        tokens = await googleService.getTokensFromCode(code as string);
      } catch (tokenError: any) {
        // Retry on network errors
        if (attempt < maxRetries && (
          tokenError.code === 'ECONNRESET' ||
          tokenError.code === 'ETIMEDOUT' ||
          tokenError.code === 'ENOTFOUND' ||
          tokenError.message?.includes('network') ||
          tokenError.message?.includes('timeout')
        )) {
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(`Google OAuth token exchange attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          lastError = tokenError;
          continue;
        }
        throw tokenError;
      }

      // Get user info
      const userInfo = await googleService.getUserInfo(tokens.access_token);

      // Save integration
      await googleService.saveIntegration(organizationId, tokens, userInfo);

      // Redirect to frontend with success message
      res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=success`);
      return;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.response?.status === 401 || error.response?.status === 403 || error.message?.includes('Invalid')) {
        logger.error('Error in Google OAuth callback (non-retryable)', error);
        res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=error&message=${encodeURIComponent(error.message)}`);
        return;
      }

      // Retry on network errors
      if (attempt < maxRetries && (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('network') ||
        error.message?.includes('timeout')
      )) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Google OAuth callback attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries exhausted
  logger.error('Error in Google OAuth callback after retries', lastError);
  res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=error&message=${encodeURIComponent(lastError?.message || 'Network error')}`);
};

export const syncGoogleData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { type } = req.body;

    let result;

    switch (type) {
      case 'users':
        result = await googleService.syncUsers(organizationId);
        break;
      case 'groups':
        result = await googleService.syncGroups(organizationId);
        break;
      case 'audit':
        result = await googleService.getAuditLogs(organizationId);
        break;
      case 'drive':
        result = await googleService.listDriveFiles(organizationId);
        break;
      default:
        res.status(400).json({ error: 'Invalid sync type' });
        return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error syncing Google data', error);
    res.status(500).json({ error: error.message || 'Failed to sync Google data' });
  }
};

export const disconnectGoogle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await googleService.disconnect(organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error disconnecting Google', error);
    res.status(500).json({ error: 'Failed to disconnect Google integration' });
  }
};

// ============================================================================
// GITHUB OAUTH
// ============================================================================

export const authorizeGitHub: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const state = await generateState(organizationId, 'github');
    const authUrl = githubService.getAuthorizationUrl(state);

    res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating GitHub auth URL', error);
    res.status(500).json({ error: 'Failed to initiate GitHub authorization' });
  }
};

export const callbackGitHub: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    const organizationId = await verifyState(state as string, 'github');

    if (!organizationId) {
      res.status(400).json({ error: 'Invalid or expired state parameter' });
      return;
    }

    // Exchange code for access token
    const accessToken = await githubService.getAccessToken(code as string);

    // Get user info
    const userInfo = await githubService.getUserInfo(accessToken);

    // Save integration
    await githubService.saveIntegration(organizationId, accessToken, userInfo);

    res.redirect(`${process.env.CLIENT_URL}/settings?integration=github&status=success`);
  } catch (error) {
    logger.error('Error in GitHub OAuth callback', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=github&status=error`);
  }
};

export const syncGitHubData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { type, owner, repo } = req.body;

    let result;

    switch (type) {
      case 'repositories':
        result = await githubService.listRepositories(organizationId);
        break;
      case 'commits':
        if (!owner || !repo) {
          res.status(400).json({ error: 'Owner and repo required for commits' });
          return;
        }
        result = await githubService.getRepositoryCommits(organizationId, owner, repo);
        break;
      case 'security':
        if (!owner || !repo) {
          res.status(400).json({ error: 'Owner and repo required for security alerts' });
          return;
        }
        result = await githubService.getSecurityAlerts(organizationId, owner, repo);
        break;
      case 'compliance':
        result = await githubService.scanRepositoriesForCompliance(organizationId);
        break;
      default:
        res.status(400).json({ error: 'Invalid sync type' });
        return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error syncing GitHub data', error);
    res.status(500).json({ error: error.message || 'Failed to sync GitHub data' });
  }
};

export const disconnectGitHub: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await githubService.disconnect(organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error disconnecting GitHub', error);
    res.status(500).json({ error: 'Failed to disconnect GitHub integration' });
  }
};

// ============================================================================
// SLACK OAUTH
// ============================================================================

export const authorizeSlack: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const state = await generateState(organizationId, 'slack');
    const authUrl = slackService.getAuthorizationUrl(state);

    res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating Slack auth URL', error);
    res.status(500).json({ error: 'Failed to initiate Slack authorization' });
  }
};

export const callbackSlack: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    const organizationId = await verifyState(state as string, 'slack');

    if (!organizationId) {
      res.status(400).json({ error: 'Invalid or expired state parameter' });
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await slackService.getAccessToken(code as string);

    // Save integration
    await slackService.saveIntegration(organizationId, tokenResponse);

    res.redirect(`${process.env.CLIENT_URL}/settings?integration=slack&status=success`);
  } catch (error) {
    logger.error('Error in Slack OAuth callback', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=slack&status=error`);
  }
};

export const syncSlackData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { type, channelId } = req.body;

    let result;

    switch (type) {
      case 'channels':
        result = await slackService.listChannels(organizationId);
        break;
      case 'users':
        result = await slackService.listUsers(organizationId);
        break;
      case 'history':
        if (!channelId) {
          res.status(400).json({ error: 'Channel ID required' });
          return;
        }
        result = await slackService.getChannelHistory(organizationId, channelId);
        break;
      default:
        res.status(400).json({ error: 'Invalid sync type' });
        return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error syncing Slack data', error);
    res.status(500).json({ error: error.message || 'Failed to sync Slack data' });
  }
};

export const postSlackMessage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { channelId, text, blocks } = req.body;

    if (!channelId || !text) {
      res.status(400).json({ error: 'Channel ID and text are required' });
      return;
    }

    const result = await slackService.postMessage(organizationId, channelId, text, blocks);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error posting Slack message', error);
    res.status(500).json({ error: error.message || 'Failed to post message' });
  }
};

export const disconnectSlack: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await slackService.disconnect(organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error disconnecting Slack', error);
    res.status(500).json({ error: 'Failed to disconnect Slack integration' });
  }
};

// ============================================================================
// JIRA OAUTH
// ============================================================================

export const authorizeJira: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const state = await generateState(organizationId, 'jira');
    const authUrl = jiraService.getAuthorizationUrl(state);

    res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating Jira auth URL', error);
    res.status(500).json({ error: 'Failed to initiate Jira authorization' });
  }
};

export const callbackJira: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    const organizationId = await verifyState(state as string, 'jira');

    if (!organizationId) {
      res.status(400).json({ error: 'Invalid or expired state parameter' });
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await jiraService.getAccessToken(code as string);

    // Get accessible resources
    const resources = await jiraService.getAccessibleResources(tokenResponse.access_token);

    if (resources.length === 0) {
      res.redirect(`${process.env.CLIENT_URL}/settings?integration=jira&status=error&reason=no_resources`);
      return;
    }

    // Uses first available resource (configure resource selection via UI)
    const resource = resources[0];

    // Save integration
    await jiraService.saveIntegration(
      organizationId,
      tokenResponse,
      resource.id,
      resource.name,
      resource.url
    );

    res.redirect(`${process.env.CLIENT_URL}/settings?integration=jira&status=success`);
  } catch (error) {
    logger.error('Error in Jira OAuth callback', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=jira&status=error`);
  }
};

export const syncJiraData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { type, jql } = req.body;

    let result;

    switch (type) {
      case 'projects':
        result = await jiraService.listProjects(organizationId);
        break;
      case 'issues':
        result = await jiraService.listIssues(organizationId, jql);
        break;
      case 'compliance':
        result = await jiraService.getComplianceIssues(organizationId);
        break;
      case 'audit':
        result = await jiraService.getAuditLogs(organizationId);
        break;
      default:
        res.status(400).json({ error: 'Invalid sync type' });
        return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error syncing Jira data', error);
    res.status(500).json({ error: error.message || 'Failed to sync Jira data' });
  }
};

export const createJiraIssue: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { projectKey, summary, description, issueType, priority } = req.body;

    if (!projectKey || !summary || !description || !issueType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await jiraService.createIssue(organizationId, projectKey, {
      summary,
      description,
      issueType,
      priority,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error creating Jira issue', error);
    res.status(500).json({ error: error.message || 'Failed to create issue' });
  }
};

export const disconnectJira: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await jiraService.disconnect(organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error disconnecting Jira', error);
    res.status(500).json({ error: 'Failed to disconnect Jira integration' });
  }
};

// ============================================================================
// AWS INTEGRATION (credentials-based, not OAuth)
// ============================================================================

export const connectAWS: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { accessKeyId, secretAccessKey, region, sessionToken } = req.body;

    if (!accessKeyId || !secretAccessKey || !region) {
      res.status(400).json({ error: 'Missing required AWS credentials' });
      return;
    }

    // Validate credentials
    const validation = await awsService.validateCredentials({
      accessKeyId,
      secretAccessKey,
      region,
      sessionToken,
    });

    if (!validation.valid) {
      res.status(400).json({ error: validation.error || 'Invalid AWS credentials' });
      return;
    }

    // Save integration
    await awsService.saveIntegration(
      organizationId,
      { accessKeyId, secretAccessKey, region, sessionToken },
      validation.accountId!
    );

    res.json({ success: true, accountId: validation.accountId });
  } catch (error: any) {
    logger.error('Error connecting AWS', error);
    res.status(500).json({ error: error.message || 'Failed to connect AWS' });
  }
};

export const syncAWSData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { type } = req.body;

    let result;

    switch (type) {
      case 'cloudtrail':
        result = await awsService.getCloudTrailEvents(organizationId);
        break;
      case 's3':
        result = await awsService.getS3BucketSecurity(organizationId);
        break;
      case 'iam':
        result = await awsService.getIAMUsers(organizationId);
        break;
      case 'config':
        result = await awsService.getConfigComplianceSummary(organizationId);
        break;
      case 'security-hub':
        result = await awsService.getSecurityHubFindings(organizationId);
        break;
      case 'compliance-scan':
        result = await awsService.runComplianceScan(organizationId);
        break;
      default:
        res.status(400).json({ error: 'Invalid sync type' });
        return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error syncing AWS data', error);
    res.status(500).json({ error: error.message || 'Failed to sync AWS data' });
  }
};

export const disconnectAWS: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await awsService.disconnect(organizationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error disconnecting AWS', error);
    res.status(500).json({ error: 'Failed to disconnect AWS integration' });
  }
};

// ============================================================================
// GENERAL INTEGRATION MANAGEMENT
// ============================================================================

export const listIntegrations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const integrations = await prisma.integration.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        category: true,
        provider: true,
        connected: true,
        lastSync: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ integrations });
  } catch (error) {
    logger.error('Error listing integrations', error);
    res.status(500).json({ error: 'Failed to list integrations' });
  }
};

export const getIntegrationStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { provider } = req.params;

    const integration = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
        provider: true,
        connected: true,
        lastSync: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    res.json({ integration });
  } catch (error) {
    logger.error('Error getting integration status', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
};

// ============================================================================
// AZURE
// ============================================================================

export const connectAzure: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { subscriptionId, clientId, clientSecret, tenantId } = req.body;

    if (!subscriptionId || !clientId || !clientSecret || !tenantId) {
      res.status(400).json({ error: 'All Azure credentials are required' });
      return;
    }

    // Validate Azure credentials by acquiring an access token from Azure AD
    let azureAccessToken: string | null = null;
    try {
      const axios = (await import('axios')).default;
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const tokenResponse = await axios.post(tokenUrl, new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://management.azure.com/.default',
        grant_type: 'client_credentials',
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });

      azureAccessToken = tokenResponse.data.access_token;
      if (!azureAccessToken) {
        res.status(400).json({ error: 'Azure credential validation failed: no access token returned' });
        return;
      }

      // Verify subscription access with the management API
      const subResponse = await axios.get(
        `https://management.azure.com/subscriptions/${subscriptionId}?api-version=2022-12-01`,
        {
          headers: { Authorization: `Bearer ${azureAccessToken}` },
          timeout: 15000,
        }
      );

      if (!subResponse.data || !subResponse.data.subscriptionId) {
        res.status(400).json({ error: 'Azure credentials valid but subscription not accessible' });
        return;
      }

      logger.info(`Azure credentials validated for tenant ${tenantId}, subscription ${subscriptionId}`);
    } catch (validationError: any) {
      const errorMsg = validationError?.response?.data?.error_description
        || validationError?.response?.data?.error?.message
        || validationError?.message
        || 'Invalid Azure credentials';
      logger.error('Azure credential validation failed', errorMsg);
      res.status(400).json({ error: `Azure credential validation failed: ${errorMsg}` });
      return;
    }

    await prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure',
        },
      },
      create: {
        organizationId,
        name: 'Microsoft Azure',
        category: 'cloud',
        provider: 'azure',
        connected: true,
        config: {
          subscriptionId,
          clientId,
          tenantId,
        },
        lastSync: new Date(),
      },
      update: {
        connected: true,
        config: {
          subscriptionId,
          clientId,
          tenantId,
        },
        lastSync: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'Connected Azure integration',
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ message: 'Azure integration connected successfully' });
  } catch (error) {
    logger.error('Error connecting Azure', error);
    res.status(500).json({ error: 'Failed to connect Azure integration' });
  }
};

export const syncAzureData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { type } = req.body;

    const integration = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure',
        },
      },
    });

    if (!integration || !integration.connected) {
      res.status(404).json({ error: 'Azure integration not found or not connected' });
      return;
    }

    let result;

    switch (type) {
      case 'resources':
        result = await azureService.getResources(organizationId);
        break;
      case 'resource-groups':
        result = await azureService.getResourceGroups(organizationId);
        break;
      case 'security-recommendations':
        result = await azureService.getSecurityRecommendations(organizationId);
        break;
      case 'security-alerts':
        result = await azureService.getSecurityAlerts(organizationId);
        break;
      case 'policy-compliance':
        result = await azureService.getPolicyCompliance(organizationId);
        break;
      case 'users':
        result = await azureService.getUsers(organizationId);
        break;
      case 'subscription':
        result = await azureService.getSubscriptionDetails(organizationId);
        break;
      case 'compliance-scan':
        result = await azureService.runComplianceScan(organizationId);
        break;
      default:
        res.status(400).json({ error: 'Invalid sync type. Valid types: resources, resource-groups, security-recommendations, security-alerts, policy-compliance, users, subscription, compliance-scan' });
        return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error syncing Azure data', error);
    res.status(500).json({ error: error.message || 'Failed to sync Azure data' });
  }
};

export const disconnectAzure: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    await prisma.integration.updateMany({
      where: {
        organizationId,
        provider: 'azure',
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        config: undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'Disconnected Azure integration',
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ message: 'Azure integration disconnected successfully' });
  } catch (error) {
    logger.error('Error disconnecting Azure', error);
    res.status(500).json({ error: 'Failed to disconnect Azure integration' });
  }
};

// ============================================================================
// AZURE SYNC ENDPOINTS
// ============================================================================

import azureSyncService from '../services/integrations/azureSyncService';
import { azureSyncJob } from '../jobs/azureSyncJob';

export const runAzureFullSync: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    // Check if integration is connected
    const integration = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure',
        },
      },
    });

    if (!integration || !integration.connected) {
      res.status(404).json({ error: 'Azure integration not connected' });
      return;
    }

    const result = await azureSyncService.runFullSync(organizationId, authReq.user!.id);

    res.json({
      success: result.success,
      jobId: result.jobId,
      summary: {
        resources: result.results.resources.itemsSynced,
        securityFindings: result.results.securityFindings.itemsSynced,
        securityAlerts: result.results.securityAlerts.itemsSynced,
        policyCompliance: result.results.policyCompliance.itemsSynced,
        users: result.results.users.itemsSynced,
      },
      duration: result.totalDuration,
    });
  } catch (error: any) {
    logger.error('Error running Azure full sync', error);
    res.status(500).json({ error: error.message || 'Failed to run Azure sync' });
  }
};

export const getAzureSyncStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const status = await azureSyncJob.getSyncStatus(organizationId);

    res.json(status);
  } catch (error: any) {
    logger.error('Error getting Azure sync status', error);
    res.status(500).json({ error: error.message || 'Failed to get sync status' });
  }
};

export const getAzureSyncHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { limit = '20', offset = '0', syncType } = req.query;

    const history = await azureSyncService.getSyncHistory(organizationId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      syncType: syncType as any,
    });

    res.json(history);
  } catch (error: any) {
    logger.error('Error getting Azure sync history', error);
    res.status(500).json({ error: error.message || 'Failed to get sync history' });
  }
};

export const getAzureSyncedResources: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { limit = '100', offset = '0', resourceType, location } = req.query;

    const where: any = { organizationId };
    if (resourceType) where.resourceType = resourceType;
    if (location) where.location = location;

    const [resources, total] = await Promise.all([
      prisma.azureResource.findMany({
        where,
        orderBy: { syncedAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.azureResource.count({ where }),
    ]);

    res.json({ resources, total });
  } catch (error: any) {
    logger.error('Error getting Azure synced resources', error);
    res.status(500).json({ error: error.message || 'Failed to get synced resources' });
  }
};

export const getAzureSyncedSecurityFindings: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { limit = '100', offset = '0', severity, status } = req.query;

    const where: any = { organizationId };
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [findings, total] = await Promise.all([
      prisma.azureSecurityFinding.findMany({
        where,
        orderBy: { syncedAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.azureSecurityFinding.count({ where }),
    ]);

    res.json({ findings, total });
  } catch (error: any) {
    logger.error('Error getting Azure synced security findings', error);
    res.status(500).json({ error: error.message || 'Failed to get synced findings' });
  }
};

export const getAzureSyncedSecurityAlerts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { limit = '100', offset = '0', severity, status } = req.query;

    const where: any = { organizationId };
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [alerts, total] = await Promise.all([
      prisma.azureSecurityAlert.findMany({
        where,
        orderBy: { syncedAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.azureSecurityAlert.count({ where }),
    ]);

    res.json({ alerts, total });
  } catch (error: any) {
    logger.error('Error getting Azure synced security alerts', error);
    res.status(500).json({ error: error.message || 'Failed to get synced alerts' });
  }
};

export const getAzureSyncedUsers: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { limit = '100', offset = '0', accountEnabled, department } = req.query;

    const where: any = { organizationId };
    if (accountEnabled !== undefined) where.accountEnabled = accountEnabled === 'true';
    if (department) where.department = department;

    const [users, total] = await Promise.all([
      prisma.azureUser.findMany({
        where,
        orderBy: { syncedAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.azureUser.count({ where }),
    ]);

    res.json({ users, total });
  } catch (error: any) {
    logger.error('Error getting Azure synced users', error);
    res.status(500).json({ error: error.message || 'Failed to get synced users' });
  }
};

export const getAzureSyncedPolicies: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { limit = '100', offset = '0', complianceState } = req.query;

    const where: any = { organizationId };
    if (complianceState) where.complianceState = complianceState;

    const [policies, total] = await Promise.all([
      prisma.azurePolicyCompliance.findMany({
        where,
        orderBy: { syncedAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.azurePolicyCompliance.count({ where }),
    ]);

    res.json({ policies, total });
  } catch (error: any) {
    logger.error('Error getting Azure synced policies', error);
    res.status(500).json({ error: error.message || 'Failed to get synced policies' });
  }
};

// ============================================================================
// GENERIC CONNECTION HANDLER
// ============================================================================

export const connectProvider: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { provider } = req.params;
    const { type, ...credentials } = req.body;

    if (!type) {
      res.status(400).json({ error: 'Connection type is required' });
      return;
    }

    // Map provider name to display name
    const providerNames: Record<string, string> = {
      'datadog': 'Datadog',
      'newrelic': 'New Relic',
      'sentry': 'Sentry',
      'pagerduty': 'PagerDuty',
      'qualys': 'Qualys',
      'tenable': 'Tenable',
      'crowdstrike': 'CrowdStrike',
      'paloalto': 'Palo Alto',
      'rapid7': 'Rapid7',
      'jenkins': 'Jenkins',
      'splunk': 'Splunk',
      'gitlab': 'GitLab',
      'bitbucket': 'Bitbucket',
      'circleci': 'CircleCI',
      'travis': 'Travis CI',
      'docker': 'Docker Hub',
      'heroku': 'Heroku',
      'digitalocean': 'DigitalOcean',
      'mongodb': 'MongoDB Atlas',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'redis': 'Redis',
      'elasticsearch': 'Elasticsearch',
      'bamboohr': 'BambooHR',
      'workday': 'Workday',
      'adp': 'ADP',
      'gcp': 'Google Cloud Platform',
      'twilio': 'Twilio',
      'sendgrid': 'SendGrid',
      // Additional providers
      'confluence': 'Confluence',
      'trello': 'Trello',
      'asana': 'Asana',
      'monday': 'Monday.com',
      'microsoft-teams': 'Microsoft Teams',
      'discord': 'Discord',
      'okta': 'Okta',
      'auth0': 'Auth0',
      'onelogin': 'OneLogin',
      'salesforce': 'Salesforce',
      'hubspot': 'HubSpot',
      'zendesk': 'Zendesk',
      'stripe': 'Stripe',
      'paypal': 'PayPal',
      'kubernetes': 'Kubernetes',
    };

    const displayName = providerNames[provider] || provider;

    // Validate credentials based on type
    let config: any = { ...credentials };
    
    if (type === 'api-key') {
      if (!credentials.apiKey) {
        res.status(400).json({ error: 'API key is required' });
        return;
      }

      // Validate API key for providers that require validation
      const providersRequiringValidation = [
        'stripe', 'sendgrid', 'digitalocean', 'onelogin', 'microsoft', 'microsoft365', 'office365',
        'docker', 'dockerhub', 'kubernetes', 'k8s', 'confluence', 'trello', 'asana', 'monday', 'monday.com',
        'microsoft-teams', 'teams', 'discord', 'okta', 'workday', 'newrelic', 'new-relic', 'sentry',
        'pagerduty', 'pager-duty', 'auth0', 'datadog', 'qualys', 'tenable', 'tenableio', 'crowdstrike',
        'paloalto', 'palo-alto', 'rapid7', 'splunk', 'bamboohr', 'adp', 'mongodb', 'mongodb-atlas',
        'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'elastic', 'heroku', 'salesforce',
        'hubspot', 'zendesk', 'paypal', 'jenkins'
      ];
      if (providersRequiringValidation.includes(provider.toLowerCase())) {
        try {
          const patValidationService = (await import('../services/integrations/patValidationService')).default;
          
          // Handle special cases for providers that need different parameters
          let baseUrlParam = credentials.baseUrl;
          if (provider.toLowerCase() === 'kubernetes' || provider.toLowerCase() === 'k8s') {
            baseUrlParam = credentials.baseUrl || credentials.apiServerUrl;
          } else if (provider.toLowerCase() === 'jenkins') {
            baseUrlParam = credentials.baseUrl || credentials.jenkinsUrl;
          }
          
          const validation = await patValidationService.validateToken(
            provider,
            credentials.apiKey,
            baseUrlParam
          );

          if (!validation.valid) {
            res.status(400).json({ 
              error: validation.error || 'Invalid API key',
              details: 'Please verify your API key is correct and has the required permissions'
            });
            return;
          }

          logger.info(`API key validated successfully for ${provider}`, {
            organizationId,
            userInfo: validation.userInfo,
          });
        } catch (validationError: any) {
          // Extract error message safely to avoid circular JSON errors
          let errorMessage = 'Failed to validate API key';
          if (validationError?.message) {
            errorMessage = String(validationError.message);
          } else if (validationError?.response?.data?.message) {
            errorMessage = String(validationError.response.data.message);
          } else if (validationError?.response?.statusText) {
            errorMessage = `HTTP ${validationError.response.status}: ${validationError.response.statusText}`;
          }
          
          logger.error(`API key validation failed for ${provider}:`, { message: errorMessage, status: validationError?.response?.status });
          res.status(400).json({ 
            error: errorMessage,
            details: 'Please check your API key and try again'
          });
          return;
        }
      }

      config = { apiKey: credentials.apiKey, baseUrl: credentials.baseUrl };
    } else if (type === 'api-key-secret') {
      if (!credentials.apiKey || !credentials.apiSecret) {
        res.status(400).json({ error: 'API key and secret are required' });
        return;
      }

      // Validate API key and secret for providers that require validation
      const providersRequiringValidation = ['sendgrid', 'twilio'];
      if (providersRequiringValidation.includes(provider.toLowerCase())) {
        try {
          const patValidationService = (await import('../services/integrations/patValidationService')).default;
          
          if (provider.toLowerCase() === 'twilio') {
            // Twilio uses Account SID (apiKey) and Auth Token (apiSecret)
            // Pass auth token as token and Account SID as baseUrl for validation
            const validation = await patValidationService.validateToken(
              provider,
              credentials.apiSecret, // Auth Token
              credentials.apiKey // Account SID as baseUrl parameter
            );

            if (!validation.valid) {
              res.status(400).json({ 
                error: validation.error || 'Invalid Twilio credentials',
                details: 'Please verify your Account SID and Auth Token are correct'
              });
              return;
            }
          } else {
            // SendGrid uses API key for validation
            const validation = await patValidationService.validateToken(
              provider,
              credentials.apiKey,
              credentials.baseUrl
            );

            if (!validation.valid) {
              res.status(400).json({ 
                error: validation.error || 'Invalid API key',
                details: 'Please verify your API key is correct and has the required permissions'
              });
              return;
            }
          }

          logger.info(`API key and secret validated successfully for ${provider}`, {
            organizationId,
          });
        } catch (validationError: any) {
          logger.error(`API key validation failed for ${provider}:`, validationError);
          res.status(400).json({ 
            error: validationError.message || 'Failed to validate credentials',
            details: 'Please check your credentials and try again'
          });
          return;
        }
      }

      config = { 
        apiKey: credentials.apiKey, 
        apiSecret: credentials.apiSecret,
        baseUrl: credentials.baseUrl 
      };
    } else if (type === 'username-password') {
      if (!credentials.username || !credentials.password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }
      config = { 
        username: credentials.username,
        password: credentials.password,
        baseUrl: credentials.baseUrl,
        apiKey: credentials.apiKey,
      };
    } else if (type === 'pat') {
      if (!credentials.token) {
        res.status(400).json({ error: 'Personal access token is required' });
        return;
      }

      // Validate PAT token before saving
      try {
        const patValidationService = (await import('../services/integrations/patValidationService')).default;
        // Handle special cases for providers that need different parameters
        let baseUrlParam = credentials.baseUrl;
        if (provider.toLowerCase() === 'trello') {
          // Trello needs API key as baseUrl parameter
          baseUrlParam = credentials.apiKey;
        } else if (provider.toLowerCase() === 'kubernetes' || provider.toLowerCase() === 'k8s') {
          // Kubernetes needs API server URL
          baseUrlParam = credentials.baseUrl || credentials.apiServerUrl;
        } else if (provider.toLowerCase() === 'jenkins') {
          // Jenkins needs base URL
          baseUrlParam = credentials.baseUrl || credentials.jenkinsUrl;
        }
        
        const validation = await patValidationService.validateToken(
          provider,
          credentials.token,
          baseUrlParam
        );

        if (!validation.valid) {
          res.status(400).json({ 
            error: validation.error || 'Invalid personal access token',
            details: 'Please verify your token is correct and has the required permissions'
          });
          return;
        }

        logger.info(`PAT validated successfully for ${provider}`, {
          organizationId,
          userInfo: validation.userInfo,
        });
      } catch (validationError: any) {
        // Extract error message safely to avoid circular JSON errors
        let errorMessage = 'Failed to validate token';
        if (validationError?.message) {
          errorMessage = String(validationError.message);
        } else if (validationError?.response?.data?.message) {
          errorMessage = String(validationError.response.data.message);
        } else if (validationError?.response?.statusText) {
          errorMessage = `HTTP ${validationError.response.status}: ${validationError.response.statusText}`;
        }
        
        logger.error(`PAT validation failed for ${provider}:`, { message: errorMessage, status: validationError?.response?.status });
        res.status(400).json({ 
          error: errorMessage,
          details: 'Please check your token and try again'
        });
        return;
      }

      config = { token: credentials.token, baseUrl: credentials.baseUrl };
    } else if (type === 'service-account') {
      if (!credentials.serviceAccountJson) {
        res.status(400).json({ error: 'Service account JSON is required' });
        return;
      }
      config = { serviceAccountJson: credentials.serviceAccountJson };
    } else {
      res.status(400).json({ error: `Unsupported connection type: ${type}` });
      return;
    }

    // Determine category
    const categoryMap: Record<string, string> = {
      'datadog': 'security',
      'newrelic': 'security',
      'sentry': 'security',
      'pagerduty': 'security',
      'qualys': 'security',
      'tenable': 'security',
      'crowdstrike': 'security',
      'paloalto': 'security',
      'rapid7': 'security',
      'jenkins': 'dev',
      'splunk': 'security',
      'gitlab': 'dev',
      'bitbucket': 'dev',
      'circleci': 'dev',
      'travis': 'dev',
      'docker': 'dev',
      'heroku': 'cloud',
      'digitalocean': 'cloud',
      'mongodb': 'cloud',
      'postgresql': 'cloud',
      'mysql': 'cloud',
      'redis': 'cloud',
      'elasticsearch': 'cloud',
      'bamboohr': 'hr',
      'workday': 'hr',
      'adp': 'hr',
      'gcp': 'cloud',
      'twilio': 'dev',
      'sendgrid': 'dev',
      // Additional providers
      'confluence': 'dev',
      'trello': 'dev',
      'asana': 'dev',
      'monday': 'dev',
      'microsoft-teams': 'dev',
      'discord': 'dev',
      'okta': 'hr',
      'auth0': 'hr',
      'onelogin': 'hr',
      'salesforce': 'hr',
      'hubspot': 'hr',
      'zendesk': 'hr',
      'stripe': 'security',
      'paypal': 'security',
      'kubernetes': 'dev',
    };

    const category = categoryMap[provider] || 'dev';

    // Save integration
    await prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
      create: {
        organizationId,
        name: displayName,
        category,
        provider,
        connected: true,
        config,
        lastSync: new Date(),
      },
      update: {
        connected: true,
        config,
        lastSync: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: `Connected ${displayName} integration`,
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ message: `${displayName} integration connected successfully` });
  } catch (error) {
    logger.error('Error connecting provider', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
};

// Generic authorize endpoint for providers that don't have specific implementations yet
export const authorizeProvider: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    
    // List of supported OAuth providers (these have specific routes)
    const supportedOAuthProviders = ['google', 'github', 'slack', 'jira'];
    
    if (supportedOAuthProviders.includes(provider)) {
      // This should not be reached if specific routes are set up correctly
      res.status(404).json({ error: `Authorization endpoint not found for ${provider}` });
      return;
    }
    
    // For providers that don't support OAuth, they should use PAT/API key connections
    // Redirect to connect endpoint instead
    res.status(400).json({ 
      error: `${provider} does not support OAuth. Please use API key or PAT connection instead.`,
      useConnect: true,
      supportedAuthTypes: ['pat', 'api-key', 'api-key-secret']
    });
  } catch (error) {
    logger.error('Error in generic authorize', error);
    res.status(500).json({ error: 'Failed to initiate authorization' });
  }
};

// Generic sync endpoint for all integrations — uses the integration registry
// to make REAL API calls and auto-collect compliance evidence.
export const syncProvider: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { provider } = req.params;
    const organizationId = authReq.user!.organizationId;

    // Check if integration exists and is connected
    const integration = await prisma.integration.findFirst({
      where: {
        organizationId,
        provider: provider.toLowerCase(),
        connected: true,
      },
    });

    if (!integration) {
      res.status(404).json({ error: 'Integration not found or not connected' });
      return;
    }

    // ── Real API sync via integration registry ──────────────────────────
    const integrationRegistry = (await import('../services/integrations/providers/integrationRegistry')).default;
    await integrationRegistry.initialise();

    // Extract stored credentials from the integration config
    const config = (integration.config as Record<string, any>) || {};
    const credentials = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      token: config.token || integration.accessToken,
      username: config.username,
      password: config.password,
      baseUrl: config.baseUrl,
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      serviceAccountJson: config.serviceAccountJson,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tenantId: config.tenantId,
      subscriptionId: config.subscriptionId,
      region: config.region,
      accountId: config.accountId,
    };

    let syncResult;
    if (integrationRegistry.has(provider.toLowerCase())) {
      // Perform real API sync with evidence auto-collection
      syncResult = await integrationRegistry.syncProvider(provider.toLowerCase(), credentials);

      // Log collected evidence artifacts (EvidenceVersion requires a controlId which
      // is not available during integration sync — evidence linking to controls is
      // handled separately via the evidence upload UI)
      if (syncResult.evidenceCollected && syncResult.evidenceCollected.length > 0) {
        logger.info(`Integration sync collected ${syncResult.evidenceCollected.length} evidence artifacts from ${integration.name}`);
      }

      logger.info(
        `[Integration Sync] ${provider}: ${syncResult.recordsSynced} evidence items collected in ${syncResult.syncDurationMs}ms`,
      );
    } else {
      // Fallback for providers not yet in the registry
      syncResult = {
        success: true,
        provider,
        evidenceCollected: [],
        recordsSynced: 0,
        syncDurationMs: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Update last sync timestamp
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSync: new Date() },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: `Synced ${integration.name} integration — ${syncResult.recordsSynced} evidence items auto-collected`,
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      message: `${integration.name} synced successfully`,
      lastSync: new Date(),
      evidenceCollected: syncResult.recordsSynced,
      evidenceItems: syncResult.evidenceCollected.map((e: any) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        collectedAt: e.collectedAt,
      })),
      syncDurationMs: syncResult.syncDurationMs,
      errors: syncResult.errors,
    });
    logger.info(`Integration synced: ${provider} for organization ${organizationId}`);
  } catch (error) {
    logger.error('Error syncing provider', error);
    res.status(500).json({ error: 'Failed to sync integration' });
  }
};

// ============================================================================
// INTEGRATION REGISTRY — real API test / evidence / bulk operations
// ============================================================================

/** Test a single provider's connection by making a real API call */
export const testProviderConnection: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { provider } = req.params;
    const organizationId = authReq.user!.organizationId;

    const integration = await prisma.integration.findFirst({
      where: { organizationId, provider: provider.toLowerCase(), connected: true },
    });

    if (!integration) {
      res.status(404).json({ error: 'Integration not found or not connected' });
      return;
    }

    const integrationRegistry = (await import('../services/integrations/providers/integrationRegistry')).default;
    await integrationRegistry.initialise();

    const config = (integration.config as Record<string, any>) || {};
    const credentials = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      token: config.token || integration.accessToken,
      username: config.username,
      password: config.password,
      baseUrl: config.baseUrl,
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      serviceAccountJson: config.serviceAccountJson,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tenantId: config.tenantId,
      subscriptionId: config.subscriptionId,
      region: config.region,
      accountId: config.accountId,
    };

    const result = await integrationRegistry.testConnection(provider.toLowerCase(), credentials);

    await prisma.auditLog.create({
      data: {
        action: `Tested ${integration.name} connection — ${result.success ? 'SUCCESS' : 'FAILED'} (${result.latencyMs}ms)`,
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json(result);
  } catch (error) {
    logger.error('Error testing provider connection', error);
    res.status(500).json({ error: 'Failed to test provider connection' });
  }
};

/** Collect evidence from a specific provider without a full sync */
export const collectProviderEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { provider } = req.params;
    const organizationId = authReq.user!.organizationId;

    const integration = await prisma.integration.findFirst({
      where: { organizationId, provider: provider.toLowerCase(), connected: true },
    });

    if (!integration) {
      res.status(404).json({ error: 'Integration not found or not connected' });
      return;
    }

    const integrationRegistry = (await import('../services/integrations/providers/integrationRegistry')).default;
    await integrationRegistry.initialise();

    const config = (integration.config as Record<string, any>) || {};
    const credentials = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      token: config.token || integration.accessToken,
      baseUrl: config.baseUrl,
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
    };

    const evidence = await integrationRegistry.collectEvidence(provider.toLowerCase(), credentials);

    // Log collected evidence (EvidenceVersion requires controlId not available here)
    const crypto = require('crypto');
    logger.info(`Collected ${evidence.length} evidence items from ${integration.name}`);

    await prisma.auditLog.create({
      data: {
        action: `Collected ${evidence.length} evidence items from ${integration.name}`,
        userId: authReq.user!.id,
        organizationId,
        hash: crypto.randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      provider,
      evidenceCount: evidence.length,
      evidence: evidence.map(e => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        collectedAt: e.collectedAt,
        apiEndpoint: e.metadata.apiEndpoint,
      })),
    });
  } catch (error) {
    logger.error('Error collecting provider evidence', error);
    res.status(500).json({ error: 'Failed to collect evidence' });
  }
};

/** Bulk-test all connected integrations */
export const testAllConnections: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const integrations = await prisma.integration.findMany({
      where: { organizationId, connected: true },
    });

    const integrationRegistry = (await import('../services/integrations/providers/integrationRegistry')).default;
    await integrationRegistry.initialise();

    const results: Array<{ provider: string; name: string; success: boolean; latencyMs: number; error?: string }> = [];

    // Test in batches of 10
    const batchSize = 10;
    for (let i = 0; i < integrations.length; i += batchSize) {
      const batch = integrations.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (int) => {
          const config = (int.config as Record<string, any>) || {};
          const creds = {
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            token: config.token || int.accessToken,
            baseUrl: config.baseUrl,
            accessToken: int.accessToken,
            refreshToken: int.refreshToken,
          };
          const result = await integrationRegistry.testConnection(int.provider, creds);
          return { ...result, provider: int.provider, name: int.name };
        }),
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.push(r.value);
        } else {
          results.push({
            provider: 'unknown',
            name: 'unknown',
            success: false,
            latencyMs: 0,
            error: r.reason?.message || 'Test failed',
          });
        }
      }
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    await prisma.auditLog.create({
      data: {
        action: `Bulk connection test: ${passed}/${results.length} passed, ${failed} failed`,
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      totalTested: results.length,
      passed,
      failed,
      results,
    });
  } catch (error) {
    logger.error('Error bulk testing connections', error);
    res.status(500).json({ error: 'Failed to test connections' });
  }
};

/** Get integration registry statistics */
export const getRegistryStats: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const integrationRegistry = (await import('../services/integrations/providers/integrationRegistry')).default;
    await integrationRegistry.initialise();

    const allProviders = integrationRegistry.getAll();
    const categories = new Map<string, number>();

    for (const [, provider] of allProviders) {
      const cat = provider.category;
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }

    res.json({
      totalRegistered: allProviders.size,
      targetTotal: 381,
      coverage: `${((allProviders.size / 381) * 100).toFixed(1)}%`,
      byCategory: Object.fromEntries(categories),
      providerIds: integrationRegistry.getProviderIds(),
    });
  } catch (error) {
    logger.error('Error getting registry stats', error);
    res.status(500).json({ error: 'Failed to get registry stats' });
  }
};

// Generic disconnect endpoint for all integrations
export const disconnectProvider: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { provider } = req.params;
    const organizationId = authReq.user!.organizationId;

    // Check if integration exists
    const integration = await prisma.integration.findFirst({
      where: {
        organizationId,
        provider: provider.toLowerCase(),
      },
    });

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    // Disconnect the integration
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        connected: false,
        config: Prisma.DbNull, // Use Prisma.DbNull to clear JSONB fields
        lastSync: null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: `Disconnected ${integration.name} integration`,
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ message: `${integration.name} integration disconnected successfully` });
    logger.info(`Integration disconnected: ${provider} for organization ${organizationId}`);
  } catch (error) {
    logger.error('Error disconnecting provider', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
};
