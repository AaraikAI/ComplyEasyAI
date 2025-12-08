/**
 * Integrations Controller
 * Handles OAuth flows and integration management for all external services
 */

import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

// Import integration services
import googleService from '../services/integrations/googleService';
import githubService from '../services/integrations/githubService';
import slackService from '../services/integrations/slackService';
import jiraService from '../services/integrations/jiraService';
import awsService from '../services/integrations/awsService';
import prisma from '../config/database';

// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map<string, { organizationId: string; provider: string; timestamp: number }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.timestamp > 600000) { // 10 minutes
      oauthStates.delete(state);
    }
  }
}, 600000);

/**
 * Generate OAuth state parameter
 */
const generateState = (organizationId: string, provider: string): string => {
  const state = uuidv4();
  oauthStates.set(state, { organizationId, provider, timestamp: Date.now() });
  return state;
};

/**
 * Verify OAuth state parameter
 */
const verifyState = (state: string, provider: string): string | null => {
  const data = oauthStates.get(state);

  if (!data) {
    return null;
  }

  if (data.provider !== provider) {
    return null;
  }

  // Check if state is expired (10 minutes)
  if (Date.now() - data.timestamp > 600000) {
    oauthStates.delete(state);
    return null;
  }

  oauthStates.delete(state);
  return data.organizationId;
};

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

export const authorizeGoogle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const state = generateState(organizationId, 'google');
    const authUrl = googleService.getAuthorizationUrl(state);

    res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating Google auth URL', error);
    res.status(500).json({ error: 'Failed to initiate Google authorization' });
  }
};

export const callbackGoogle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    const organizationId = verifyState(state as string, 'google');

    if (!organizationId) {
      res.status(400).json({ error: 'Invalid or expired state parameter' });
      return;
    }

    // Exchange code for tokens
    const tokens = await googleService.getTokensFromCode(code as string);

    // Get user info
    const userInfo = await googleService.getUserInfo(tokens.access_token);

    // Save integration
    await googleService.saveIntegration(organizationId, tokens, userInfo);

    // Redirect to frontend with success message
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=success`);
  } catch (error) {
    logger.error('Error in Google OAuth callback', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=error`);
  }
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
    const state = generateState(organizationId, 'github');
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

    const organizationId = verifyState(state as string, 'github');

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
    const state = generateState(organizationId, 'slack');
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

    const organizationId = verifyState(state as string, 'slack');

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
    const state = generateState(organizationId, 'jira');
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

    const organizationId = verifyState(state as string, 'jira');

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

    // Use first available resource (in production, let user choose)
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
