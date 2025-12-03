/**
 * Jira OAuth 2.0 (3LO) and API Integration Service
 * Handles authentication, token management, and issue tracking with Jira
 */

import axios from 'axios';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';

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
      const response = await axios.post(
        `${this.authBaseUrl}/oauth/token`,
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
        throw new Error('No access token received from Jira');
      }

      return data;
    } catch (error) {
      logger.error('Error exchanging Jira auth code for token', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<JiraTokenResponse> {
    try {
      const response = await axios.post(
        `${this.authBaseUrl}/oauth/token`,
        {
          grant_type: 'refresh_token',
          client_id: config.oauth.jira.clientId,
          client_secret: config.oauth.jira.clientSecret,
          refresh_token: refreshToken,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error refreshing Jira access token', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get accessible resources (cloud instances)
   */
  async getAccessibleResources(accessToken: string): Promise<JiraAccessibleResource[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/oauth/token/accessible-resources`,
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
      throw new Error('Failed to fetch accessible resources');
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
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
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
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
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
      throw new Error('Failed to save integration');
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
   */
  async ensureValidToken(organizationId: string): Promise<{ accessToken: string; cloudId: string }> {
    const integration = await this.getIntegration(organizationId);

    if (!integration || !integration.connected) {
      throw new Error('Jira integration not connected');
    }

    const config = integration.config as any;
    const now = new Date();
    const expiresAt = integration.expiresAt || now;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      if (!integration.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Refresh the token
      const newTokens = await this.refreshAccessToken(integration.refreshToken);

      // Update in database
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      });

      return {
        accessToken: newTokens.access_token,
        cloudId: config.cloudId,
      };
    }

    return {
      accessToken: integration.accessToken!,
      cloudId: config.cloudId,
    };
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
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/ex/jira/${cloudId}/rest/api/3${endpoint}`,
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
        throw new Error('Authentication failed. Please reconnect Jira integration.');
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
      throw new Error('Failed to list projects');
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
      throw new Error('Failed to list issues');
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

      const response = await axios.post(
        `${this.apiBaseUrl}/ex/jira/${cloudId}/rest/api/3/issue`,
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
      throw new Error('Failed to create issue');
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
      throw new Error('Failed to fetch audit logs');
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
      throw new Error('Failed to fetch compliance issues');
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
      severity: 'High' | 'Medium' | 'Low';
      framework?: string;
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
      throw new Error('Failed to create compliance ticket');
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
      throw new Error('Failed to disconnect Jira integration');
    }
  }
}

export default new JiraService();
