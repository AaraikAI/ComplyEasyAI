/**
 * Jira OAuth 2.0 (3LO) and API Integration Service
 * Handles authentication, token management, and issue tracking with Jira
 */

import axios from 'axios';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { isUrlSafe } from '../../utils/urlValidator';
import { encryptField, decryptField } from '../../utils/credentialEncryption';

interface JiraTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface JiraAccessibleResource {
  id: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl: string;
}

class JiraService {
  private readonly authBaseUrl = 'https://auth.atlassian.com';
  private readonly apiBaseUrl = 'https://api.atlassian.com';

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'read:jira-user',
      'read:jira-work',
      'write:jira-work',
      'read:audit-log:jira',
      'offline_access', // Required for refresh token
    ];

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: config.oauth.jira.clientId,
      scope: scopes.join(' '),
      redirect_uri: config.oauth.jira.callbackUrl,
      state,
      response_type: 'code',
      prompt: 'consent',
    });

    return `${this.authBaseUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<JiraTokenResponse> {
    try {
      const url = `${this.authBaseUrl}/oauth/token`;
      if (!isUrlSafe(url)) {
        logger.error('Jira outbound URL rejected by isUrlSafe', { url });
        throw new AppError(`Unsafe Jira URL: ${url}`, 400);
      }
      const response = await axios.post(
        url,
        {
          grant_type: 'authorization_code',
          client_id: config.oauth.jira.clientId,
          client_secret: config.oauth.jira.clientSecret,
          code,
          redirect_uri: config.oauth.jira.callbackUrl,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data: JiraTokenResponse = response.data;

      if (!data.access_token) {
        throw new AppError('No access token received from Jira', 500);
      }

      return data;
    } catch (error) {
      logger.error('Error exchanging Jira auth code for token', error);
      throw new AppError('Failed to exchange authorization code', 500);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<JiraTokenResponse> {
    try {
      const url = `${this.authBaseUrl}/oauth/token`;
      if (!isUrlSafe(url)) {
        logger.error('Jira outbound URL rejected by isUrlSafe', { url });
        throw new AppError(`Unsafe Jira URL: ${url}`, 400);
      }
      // Caller may pass an encrypted refresh token from the DB; ensure plaintext is used in the API call.
      const plaintextRefreshToken = decryptField(refreshToken);
      const response = await axios.post(
        url,
        {
          grant_type: 'refresh_token',
          client_id: config.oauth.jira.clientId,
          client_secret: config.oauth.jira.clientSecret,
          refresh_token: plaintextRefreshToken,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error refreshing Jira access token', error);
      throw new AppError('Failed to refresh access token', 500);
    }
  }

  /**
   * Get accessible resources (cloud instances)
   */
  async getAccessibleResources(accessToken: string): Promise<JiraAccessibleResource[]> {
    try {
      const url = `${this.apiBaseUrl}/oauth/token/accessible-resources`;
      if (!isUrlSafe(url)) {
        logger.error('Jira outbound URL rejected by isUrlSafe', { url });
        throw new AppError(`Unsafe Jira URL: ${url}`, 400);
      }
      const response = await axios.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching Jira accessible resources', error);
      throw new AppError('Failed to fetch accessible resources', 500);
    }
  }

  /**
   * Save integration to database
   */
  async saveIntegration(
    organizationId: string,
    tokenResponse: JiraTokenResponse,
    cloudId: string,
    siteName: string,
    siteUrl: string
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

      await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'jira',
          },
        },
        create: {
          organizationId,
          name: 'Jira',
          category: 'project',
          provider: 'jira',
          connected: true,
          accessToken: tokenResponse.access_token ? encryptField(tokenResponse.access_token) : null,
          refreshToken: tokenResponse.refresh_token ? encryptField(tokenResponse.refresh_token) : null,
          expiresAt,
          config: {
            cloudId,
            siteName,
            siteUrl,
            scope: tokenResponse.scope,
          },
          lastSync: new Date(),
        },
        update: {
          connected: true,
          accessToken: tokenResponse.access_token ? encryptField(tokenResponse.access_token) : null,
          refreshToken: tokenResponse.refresh_token ? encryptField(tokenResponse.refresh_token) : null,
          expiresAt,
          config: {
            cloudId,
            siteName,
            siteUrl,
            scope: tokenResponse.scope,
          },
          lastSync: new Date(),
        },
      });

      logger.info(`Jira integration saved for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error saving Jira integration', error);
      throw new AppError('Failed to save integration', 500);
    }
  }

  /**
   * Get integration from database
   */
  async getIntegration(organizationId: string) {
    return prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'jira',
        },
      },
    });
  }

  /**
   * Ensure access token is valid, refresh if needed
   * Includes retry logic with exponential backoff for network failures
   */
  async ensureValidToken(organizationId: string, retryCount: number = 0): Promise<{ accessToken: string; cloudId: string }> {
    const integration = await this.getIntegration(organizationId);

    if (!integration || !integration.connected) {
      throw new AppError('Jira integration not connected', 400);
    }

    const config = integration.config as any;
    const now = new Date();
    const expiresAt = integration.expiresAt || now;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      if (!integration.refreshToken) {
        throw new AppError('No refresh token available', 400);
      }

      const maxRetries = 3;
      const baseDelay = 1000;

      try {
        // Refresh the token with retry logic
        const newTokens = await this.refreshAccessTokenWithRetry(
          integration.refreshToken,
          maxRetries,
          baseDelay
        );

        // Update in database (encrypt tokens at rest)
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            accessToken: newTokens.access_token ? encryptField(newTokens.access_token) : null,
            refreshToken: newTokens.refresh_token ? encryptField(newTokens.refresh_token) : null,
            expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
          },
        });

        return {
          accessToken: newTokens.access_token, // plaintext for outbound API use
          cloudId: config.cloudId,
        };
      } catch (error: any) {
        logger.error(`Failed to refresh Jira token after ${retryCount} retries`, error);
        
        // If network error and retries left, retry the entire method
        if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('network'))) {
          const delay = baseDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.ensureValidToken(organizationId, retryCount + 1);
        }
        
        throw error;
      }
    }

    return {
      accessToken: decryptField(integration.accessToken!),
      cloudId: config.cloudId,
    };
  }

  /**
   * Refresh access token with exponential backoff retry logic
   */
  private async refreshAccessTokenWithRetry(
    refreshToken: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.refreshAccessToken(refreshToken);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AppError('Refresh token is invalid or expired. Please reconnect the integration.', 403);
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
          logger.warn(`Jira token refresh attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError || new AppError('Failed to refresh token after retries', 500);
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    accessToken: string,
    cloudId: string,
    endpoint: string,
    params?: any
  ) {
    const url = `${this.apiBaseUrl}/ex/jira/${cloudId}/rest/api/3${endpoint}`;
    if (!isUrlSafe(url)) {
      throw new AppError('Blocked unsafe outbound URL', 400);
    }
    try {
      const response = await axios.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AppError('Authentication failed. Please reconnect Jira integration.', 403);
      }
      throw error;
    }
  }

  /**
   * List projects
   */
  async listProjects(organizationId: string): Promise<any[]> {
    try {
      const { accessToken, cloudId } = await this.ensureValidToken(organizationId);

      const data = await this.makeRequest(accessToken, cloudId, '/project/search', {
        maxResults: 100,
      });

      const projects = data.values || [];

      logger.info(`Listed ${projects.length} Jira projects for org ${organizationId}`);

      return projects.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
        style: project.style,
        lead: project.lead?.displayName,
        url: project.self,
      }));
    } catch (error) {
      logger.error('Error listing Jira projects', error);
      throw new AppError('Failed to list projects', 500);
    }
  }

  /**
   * List issues
   */
  async listIssues(
    organizationId: string,
    jql: string = '',
    maxResults: number = 100
  ): Promise<any[]> {
    try {
      const { accessToken, cloudId } = await this.ensureValidToken(organizationId);

      const searchJql = jql || 'ORDER BY created DESC';

      const data = await this.makeRequest(accessToken, cloudId, '/search', {
        jql: searchJql,
        maxResults,
        fields: 'summary,status,priority,assignee,created,updated,issuetype',
      });

      const issues = data.issues || [];

      logger.info(`Listed ${issues.length} Jira issues for org ${organizationId}`);

      return issues.map((issue: any) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name,
        assignee: issue.fields.assignee?.displayName,
        issueType: issue.fields.issuetype.name,
        createdAt: issue.fields.created,
        updatedAt: issue.fields.updated,
        url: `${issue.self}`,
      }));
    } catch (error) {
      logger.error('Error listing Jira issues', error);
      throw new AppError('Failed to list issues', 500);
    }
  }

  /**
   * Create issue
   */
  async createIssue(
    organizationId: string,
    projectKey: string,
    issueData: {
      summary: string;
      description: string;
      issueType: string;
      priority?: string;
    }
  ): Promise<any> {
    try {
      const { accessToken, cloudId } = await this.ensureValidToken(organizationId);

      const url = `${this.apiBaseUrl}/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue`;
      if (!isUrlSafe(url)) {
        logger.error('Jira outbound URL rejected by isUrlSafe', { url, cloudId });
        throw new AppError(`Unsafe Jira URL: ${url}`, 400);
      }
      const response = await axios.post(
        url,
        {
          fields: {
            project: {
              key: projectKey,
            },
            summary: issueData.summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: issueData.description,
                    },
                  ],
                },
              ],
            },
            issuetype: {
              name: issueData.issueType,
            },
            priority: issueData.priority
              ? {
                  name: issueData.priority,
                }
              : undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Created Jira issue ${response.data.key} for org ${organizationId}`);

      return {
        id: response.data.id,
        key: response.data.key,
        self: response.data.self,
      };
    } catch (error) {
      logger.error('Error creating Jira issue', error);
      throw new AppError('Failed to create issue', 500);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(organizationId: string, maxResults: number = 100): Promise<any[]> {
    try {
      const { accessToken, cloudId } = await this.ensureValidToken(organizationId);

      const data = await this.makeRequest(accessToken, cloudId, '/auditing/record', {
        maxResults,
      });

      const records = data.records || [];

      logger.info(`Fetched ${records.length} audit log entries from Jira for org ${organizationId}`);

      return records.map((record: any) => ({
        id: record.id,
        summary: record.summary,
        category: record.category,
        eventSource: record.eventSource,
        author: record.authorAccountId,
        remoteAddress: record.remoteAddress,
        createdAt: record.created,
        objectItem: record.objectItem,
        changedValues: record.changedValues,
      }));
    } catch (error) {
      logger.error('Error fetching Jira audit logs', error);
      throw new AppError('Failed to fetch audit logs', 500);
    }
  }

  /**
   * Get compliance issues (filtered by labels/custom fields)
   */
  async getComplianceIssues(organizationId: string): Promise<any[]> {
    try {
      const jql = 'labels in (compliance, security, audit) OR labels = "compliance-ticket"';
      return await this.listIssues(organizationId, jql, 100);
    } catch (error) {
      logger.error('Error fetching Jira compliance issues', error);
      throw new AppError('Failed to fetch compliance issues', 500);
    }
  }

  /**
   * Create compliance ticket
   */
  async createComplianceTicket(
    organizationId: string,
    projectKey: string,
    ticket: {
      title: string;
      description: string;
      severity: string;
      framework?: string;
      controlId?: string;
    }
  ): Promise<any> {
    try {
      const issue = await this.createIssue(organizationId, projectKey, {
        summary: `[Compliance] ${ticket.title}`,
        description: `${ticket.description}\n\nFramework: ${ticket.framework || 'General'}\nSeverity: ${ticket.severity}`,
        issueType: 'Task',
        priority: ticket.severity,
      });

      logger.info(`Created compliance ticket ${issue.key} in Jira for org ${organizationId}`);

      return issue;
    } catch (error) {
      logger.error('Error creating Jira compliance ticket', error);
      throw new AppError('Failed to create compliance ticket', 500);
    }
  }

  /**
   * Disconnect integration
   */
  async disconnect(organizationId: string): Promise<void> {
    try {
      await prisma.integration.update({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'jira',
          },
        },
        data: {
          connected: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          lastSync: null,
        },
      });

      logger.info(`Jira integration disconnected for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error disconnecting Jira integration', error);
      throw new AppError('Failed to disconnect Jira integration', 500);
    }
  }

  /**
   * Sync compliance issues bidirectionally between ComplyEasyAI and Jira
   */
  async syncComplianceIssues(
    organizationId: string,
    options?: {
      direction?: 'push' | 'pull' | 'bidirectional';
      since?: Date;
      projectKey?: string;
    }
  ): Promise<{
    pushed: number;
    pulled: number;
    updated: number;
    errors: string[];
  }> {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.connected) {
        throw new AppError('Jira integration not connected', 400);
      }

      const direction = options?.direction || 'bidirectional';
      const since = options?.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      let pushed = 0;
      let pulled = 0;
      let updated = 0;
      const errors: string[] = [];

      // PUSH: Send local compliance issues to Jira
      if (direction === 'push' || direction === 'bidirectional') {
        try {
          const localIssues = await prisma.issue.findMany({
            where: {
              organizationId,
              updatedAt: { gte: since },
              status: { not: 'Closed' },
            },
            take: 100,
          });

          for (const issue of localIssues) {
            try {
              // Check if issue already synced. Pushed records store the local
              // issue id in `hash`, so match on that exactly rather than a
              // substring search on the JSON `details`.
              const existingSync = await prisma.auditLog.findFirst({
                where: {
                  organizationId,
                  action: 'jira_sync.pushed',
                  hash: issue.id,
                },
              });

              if (!existingSync) {
                const jiraIssue = await this.createComplianceTicket(
                  organizationId,
                  options?.projectKey || '',
                  {
                    title: issue.title,
                    description: issue.description || '',
                    framework: (issue as any).framework || 'General',
                    severity: issue.priority || 'Medium',
                    controlId: (issue as any).category || undefined,
                  }
                );

                await prisma.auditLog.create({
                  data: {
                    action: 'jira_sync.pushed',
                    organizationId,
                    hash: issue.id,
                    details: JSON.stringify({
                      localIssueId: issue.id,
                      jiraIssueKey: jiraIssue.key,
                      jiraIssueId: jiraIssue.id,
                    }),
                  },
                });

                pushed++;
              }
            } catch (issueError: any) {
              errors.push(`Push failed for issue ${issue.id}: ${issueError.message}`);
            }
          }
        } catch (pushError: any) {
          errors.push(`Push phase failed: ${pushError.message}`);
        }
      }

      // PULL: Fetch Jira compliance issues and create/update local records
      if (direction === 'pull' || direction === 'bidirectional') {
        try {
          const jiraIssues = await this.getComplianceIssues(organizationId);

          const syncCreatorId = await this.resolveSyncCreatorId(organizationId);

          for (const jiraIssue of jiraIssues) {
            try {
              // Check if already synced. The pulled record stores the Jira key
              // exactly in `hash`, so match on that instead of a substring search
              // on `details` (where 'AB-1' would also match 'AB-10'/'AB-100').
              const existingSync = await prisma.auditLog.findFirst({
                where: {
                  organizationId,
                  action: 'jira_sync.pulled',
                  hash: jiraIssue.key,
                },
              });

              if (existingSync) {
                // Update existing local issue
                const syncDetails = JSON.parse(existingSync.details || '{}');
                if (syncDetails.localIssueId) {
                  await prisma.issue.update({
                    where: { id: syncDetails.localIssueId },
                    data: {
                      status: this.mapJiraStatusToLocal(jiraIssue.fields?.status?.name),
                      updatedAt: new Date(),
                    },
                  }).catch((err) => { logger.error('Jira sync issue update failed', { error: err.message, issueId: syncDetails.localIssueId }); });
                  updated++;
                }
              } else {
                // Create new local issue
                const localIssue = await prisma.issue.create({
                  data: {
                    organizationId,
                    title: jiraIssue.fields?.summary || jiraIssue.key,
                    description: jiraIssue.fields?.description || '',
                    issueType: 'compliance',
                    priority: this.mapJiraPriorityToSeverity(jiraIssue.fields?.priority?.name) as any,
                    status: this.mapJiraStatusToLocal(jiraIssue.fields?.status?.name),
                    createdById: syncCreatorId,
                    tags: JSON.stringify({ source: 'jira', jiraKey: jiraIssue.key }),
                  },
                });

                await prisma.auditLog.create({
                  data: {
                    action: 'jira_sync.pulled',
                    organizationId,
                    hash: jiraIssue.key,
                    details: JSON.stringify({
                      localIssueId: localIssue.id,
                      jiraIssueKey: jiraIssue.key,
                      jiraIssueId: jiraIssue.id,
                    }),
                  },
                });

                pulled++;
              }
            } catch (issueError: any) {
              errors.push(`Pull failed for Jira issue ${jiraIssue.key}: ${issueError.message}`);
            }
          }
        } catch (pullError: any) {
          errors.push(`Pull phase failed: ${pullError.message}`);
        }
      }

      logger.info(`[Jira] Sync complete for org ${organizationId}: pushed=${pushed}, pulled=${pulled}, updated=${updated}, errors=${errors.length}`);

      return { pushed, pulled, updated, errors };
    } catch (error: any) {
      logger.error('[Jira] Error syncing compliance issues', error);
      throw new AppError(`Issue sync failed: ${error.message}`, 500);
    }
  }

  /**
   * Update a synced Jira issue's status
   */
  async updateIssueStatus(
    organizationId: string,
    issueKey: string,
    status: string,
    comment?: string
  ): Promise<{ success: boolean }> {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.connected) {
        throw new AppError('Jira integration not connected', 400);
      }

      const config = integration.config as any;
      const cloudId = config?.cloudId;
      if (!cloudId) throw new AppError('Jira cloud ID not found', 400);

      const { accessToken } = await this.ensureValidToken(organizationId);

      const encodedCloudId = encodeURIComponent(cloudId);
      const encodedIssueKey = encodeURIComponent(issueKey);
      const transitionsUrl = `${this.apiBaseUrl}/ex/jira/${encodedCloudId}/rest/api/3/issue/${encodedIssueKey}/transitions`;
      if (!isUrlSafe(transitionsUrl)) {
        logger.error('Jira outbound URL rejected by isUrlSafe', { url: transitionsUrl, cloudId, issueKey });
        throw new AppError(`Unsafe Jira URL: ${transitionsUrl}`, 400);
      }
      // Get available transitions
      const transitionsResponse = await axios.get(
        transitionsUrl,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
      );

      const transitions = transitionsResponse.data.transitions || [];
      const targetTransition = transitions.find(
        (t: any) => t.name.toLowerCase() === status.toLowerCase() ||
                     t.to.name.toLowerCase() === status.toLowerCase()
      );

      if (targetTransition) {
        await axios.post(
          transitionsUrl,
          { transition: { id: targetTransition.id } },
          { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );
      }

      // Add comment if provided
      if (comment) {
        const commentUrl = `${this.apiBaseUrl}/ex/jira/${encodedCloudId}/rest/api/3/issue/${encodedIssueKey}/comment`;
        if (!isUrlSafe(commentUrl)) {
          logger.error('Jira outbound URL rejected by isUrlSafe', { url: commentUrl, cloudId, issueKey });
          throw new AppError(`Unsafe Jira URL: ${commentUrl}`, 400);
        }
        await axios.post(
          commentUrl,
          {
            body: {
              type: 'doc',
              version: 1,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }],
            },
          },
          { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );
      }

      logger.info(`[Jira] Issue ${issueKey} updated to status: ${status}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`[Jira] Error updating issue ${issueKey}`, error);
      return { success: false };
    }
  }

  /**
   * Get sync status for an organization
   */
  async getSyncStatus(
    organizationId: string
  ): Promise<{
    lastSync: Date | null;
    totalSynced: number;
    pendingSync: number;
    syncErrors: number;
  }> {
    try {
      const [lastSyncLog, totalSynced, syncErrors] = await Promise.all([
        prisma.auditLog.findFirst({
          where: {
            organizationId,
            action: { startsWith: 'jira_sync.' },
          },
          orderBy: { timestamp: 'desc' },
        }),
        prisma.auditLog.count({
          where: {
            organizationId,
            action: { startsWith: 'jira_sync.' },
          },
        }),
        prisma.auditLog.count({
          where: {
            organizationId,
            action: 'jira_sync.error',
          },
        }),
      ]);

      // Count local issues not yet synced
      const totalLocalIssues = await prisma.issue.count({
        where: { organizationId, status: { not: 'Closed' } },
      });

      const syncedIssueIds = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: 'jira_sync.pushed',
        },
        select: { hash: true },
      });

      const pendingSync = totalLocalIssues - syncedIssueIds.length;

      return {
        lastSync: lastSyncLog?.timestamp || null,
        totalSynced,
        pendingSync: Math.max(0, pendingSync),
        syncErrors,
      };
    } catch (error) {
      logger.error('[Jira] Error getting sync status', error);
      return { lastSync: null, totalSynced: 0, pendingSync: 0, syncErrors: 0 };
    }
  }

  /**
   * Map Jira status to local issue status
   */
  private mapJiraStatusToLocal(jiraStatus?: string): 'Open' | 'In_Progress' | 'Resolved' | 'Closed' | 'Reopened' {
    if (!jiraStatus) return 'Open';
    const statusLower = jiraStatus.toLowerCase();
    if (['done', 'closed', 'resolved'].includes(statusLower)) return 'Closed';
    if (['in progress', 'in review'].includes(statusLower)) return 'In_Progress';
    if (['to do', 'open', 'backlog'].includes(statusLower)) return 'Open';
    return 'Open';
  }

  /**
   * Map Jira priority to local severity
   */
  private mapJiraPriorityToSeverity(jiraPriority?: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!jiraPriority) return 'Medium';
    const priorityLower = jiraPriority.toLowerCase();
    if (['highest', 'blocker'].includes(priorityLower)) return 'Critical';
    if (['high'].includes(priorityLower)) return 'High';
    if (['medium', 'normal'].includes(priorityLower)) return 'Medium';
    return 'Low';
  }

  /**
   * Resolve a real user id in the organization to own externally-synced issues.
   * `Issue.createdById` is a required FK to User, so a literal 'system' string
   * would violate referential integrity. Prefer an admin/compliance owner.
   */
  private async resolveSyncCreatorId(organizationId: string): Promise<string> {
    const creator = await prisma.user.findFirst({
      where: { organizationId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    if (!creator) {
      throw new AppError(
        `Cannot sync Jira issues: organization ${organizationId} has no user to own synced issues`,
        400
      );
    }
    return creator.id;
  }

  /**
   * Process Jira webhook events for real-time sync
   */
  async processWebhookEvent(
    organizationId: string,
    event: {
      webhookEvent: string;
      issue?: any;
      changelog?: any;
    }
  ): Promise<{ processed: boolean }> {
    try {
      const eventType = event.webhookEvent;

      switch (eventType) {
        case 'jira:issue_updated': {
          // Find synced local issue and update it. Pulled records key the Jira
          // issue key exactly in `hash`; match that first, then fall back to
          // push-originated records whose key lives in `details` under the fully
          // delimited token `"jiraIssueKey":"<key>"`. A delimited match avoids the
          // substring collision a raw `contains` would cause ('AB-1' vs 'AB-10').
          if (event.issue?.key) {
            const issueKey: string = event.issue.key;
            const syncRecord =
              (await prisma.auditLog.findFirst({
                where: {
                  organizationId,
                  action: { startsWith: 'jira_sync.' },
                  hash: issueKey,
                },
              })) ||
              (await prisma.auditLog.findFirst({
                where: {
                  organizationId,
                  action: { startsWith: 'jira_sync.' },
                  details: { contains: `"jiraIssueKey":"${issueKey}"` },
                },
              }));

            if (syncRecord) {
              const syncDetails = JSON.parse(syncRecord.details || '{}');
              if (syncDetails.localIssueId) {
                await prisma.issue.update({
                  where: { id: syncDetails.localIssueId },
                  data: {
                    status: this.mapJiraStatusToLocal(event.issue.fields?.status?.name) as any,
                    updatedAt: new Date(),
                  },
                }).catch((err) => { logger.error('Jira webhook issue update failed', { error: err.message, issueId: syncDetails.localIssueId }); });
              }
            }
          }
          break;
        }

        case 'jira:issue_deleted': {
          if (event.issue?.key) {
            logger.info(`[Jira] Issue deleted in Jira: ${event.issue.key}`);
          }
          break;
        }

        default:
          logger.debug(`[Jira] Unhandled webhook event: ${eventType}`);
      }

      return { processed: true };
    } catch (error) {
      logger.error('[Jira] Error processing webhook event', error);
      return { processed: false };
    }
  }
}

export default new JiraService();
