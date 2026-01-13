/**
 * Integrations Controller
 * Handles OAuth flows and integration management for all external services
 */

import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import { Prisma } from '@prisma/client';

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

    // Validate Azure credentials (simplified - in production, actually validate)
    // For now, we'll just save them
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
          // In production, encrypt the secret
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

    // TODO: Implement actual Azure data sync
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSync: new Date() },
    });

    res.json({ message: 'Azure data synced successfully' });
  } catch (error) {
    logger.error('Error syncing Azure data', error);
    res.status(500).json({ error: 'Failed to sync Azure data' });
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
    };

    const displayName = providerNames[provider] || provider;

    // Validate credentials based on type
    let config: any = { ...credentials };
    
    if (type === 'api-key') {
      if (!credentials.apiKey) {
        res.status(400).json({ error: 'API key is required' });
        return;
      }

      // Validate API key for providers that require validation (Stripe, SendGrid, etc.)
      const providersRequiringValidation = ['stripe', 'sendgrid'];
      if (providersRequiringValidation.includes(provider.toLowerCase())) {
        try {
          const patValidationService = (await import('../services/integrations/patValidationService')).default;
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

          logger.info(`API key validated successfully for ${provider}`, {
            organizationId,
            userInfo: validation.userInfo,
          });
        } catch (validationError: any) {
          logger.error(`API key validation failed for ${provider}:`, validationError);
          res.status(400).json({ 
            error: validationError.message || 'Failed to validate API key',
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
        const validation = await patValidationService.validateToken(
          provider,
          credentials.token,
          credentials.baseUrl
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
        logger.error(`PAT validation failed for ${provider}:`, validationError);
        res.status(400).json({ 
          error: validationError.message || 'Failed to validate token',
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
    
    // List of supported OAuth providers
    const supportedProviders = ['google', 'github', 'slack', 'jira'];
    
    if (supportedProviders.includes(provider)) {
      // This should not be reached if specific routes are set up correctly
      res.status(404).json({ error: `Authorization endpoint not found for ${provider}` });
      return;
    }
    
    // For unsupported providers, return a message indicating it's coming soon
    res.status(501).json({ 
      error: `${provider} integration is coming soon. Please check back later.`,
      comingSoon: true 
    });
  } catch (error) {
    logger.error('Error in generic authorize', error);
    res.status(500).json({ error: 'Failed to initiate authorization' });
  }
};

// Generic sync endpoint for all integrations
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

    // Update last sync timestamp
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSync: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: `Synced ${integration.name} integration`,
        userId: authReq.user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ message: `${integration.name} synced successfully`, lastSync: new Date() });
    logger.info(`Integration synced: ${provider} for organization ${organizationId}`);
  } catch (error) {
    logger.error('Error syncing provider', error);
    res.status(500).json({ error: 'Failed to sync integration' });
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
