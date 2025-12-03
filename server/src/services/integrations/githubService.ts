/**
 * GitHub OAuth 2.0 and API Integration Service
 * Handles authentication, token management, and data syncing with GitHub
 */

import axios from 'axios';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
  company?: string;
}

class GitHubService {
  private readonly apiBaseUrl = 'https://api.github.com';
  private readonly authBaseUrl = 'https://github.com/login/oauth';

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'read:user',
      'user:email',
      'read:org',
      'repo',
      'security_events',
      'admin:org_hook',
    ];

    const params = new URLSearchParams({
      client_id: config.oauth.github.clientId,
      redirect_uri: config.oauth.github.callbackUrl,
      scope: scopes.join(' '),
      state,
    });

    return `${this.authBaseUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.authBaseUrl}/access_token`,
        {
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          code,
          redirect_uri: config.oauth.github.callbackUrl,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      const data: GitHubTokenResponse = response.data;

      if (!data.access_token) {
        throw new Error('No access token received from GitHub');
      }

      return data.access_token;
    } catch (error) {
      logger.error('Error exchanging GitHub auth code for token', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get authenticated user info
   */
  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching GitHub user info', error);
      throw new Error('Failed to fetch user information');
    }
  }

  /**
   * Save integration to database
   */
  async saveIntegration(
    organizationId: string,
    accessToken: string,
    userInfo: GitHubUser
  ): Promise<void> {
    try {
      await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'github',
          },
        },
        create: {
          organizationId,
          name: 'GitHub',
          category: 'code',
          provider: 'github',
          connected: true,
          accessToken,
          config: {
            userId: userInfo.id,
            login: userInfo.login,
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.avatar_url,
            company: userInfo.company,
          },
          lastSync: new Date(),
        },
        update: {
          connected: true,
          accessToken,
          config: {
            userId: userInfo.id,
            login: userInfo.login,
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.avatar_url,
            company: userInfo.company,
          },
          lastSync: new Date(),
        },
      });

      logger.info(`GitHub integration saved for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error saving GitHub integration', error);
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
          provider: 'github',
        },
      },
    });
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(accessToken: string, endpoint: string, params?: any) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please reconnect GitHub integration.');
      }
      throw error;
    }
  }

  /**
   * List user's repositories
   */
  async listRepositories(organizationId: string): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new Error('GitHub integration not connected');
      }

      const repos = await this.makeRequest(integration.accessToken, '/user/repos', {
        per_page: 100,
        sort: 'updated',
      });

      logger.info(`Listed ${repos.length} repositories from GitHub for org ${organizationId}`);

      return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
      }));
    } catch (error) {
      logger.error('Error listing GitHub repositories', error);
      throw new Error('Failed to list repositories');
    }
  }

  /**
   * Get repository commits
   */
  async getRepositoryCommits(
    organizationId: string,
    owner: string,
    repo: string,
    since?: string
  ): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new Error('GitHub integration not connected');
      }

      const params: any = { per_page: 100 };
      if (since) params.since = since;

      const commits = await this.makeRequest(
        integration.accessToken,
        `/repos/${owner}/${repo}/commits`,
        params
      );

      logger.info(`Fetched ${commits.length} commits from ${owner}/${repo}`);

      return commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        authorEmail: commit.commit.author.email,
        date: commit.commit.author.date,
        url: commit.html_url,
      }));
    } catch (error) {
      logger.error('Error fetching GitHub commits', error);
      throw new Error('Failed to fetch repository commits');
    }
  }

  /**
   * Get security alerts (Dependabot)
   */
  async getSecurityAlerts(organizationId: string, owner: string, repo: string): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new Error('GitHub integration not connected');
      }

      const alerts = await this.makeRequest(
        integration.accessToken,
        `/repos/${owner}/${repo}/dependabot/alerts`,
        { per_page: 100 }
      );

      logger.info(`Fetched ${alerts.length} security alerts from ${owner}/${repo}`);

      return alerts.map((alert: any) => ({
        number: alert.number,
        state: alert.state,
        severity: alert.security_advisory.severity,
        summary: alert.security_advisory.summary,
        description: alert.security_advisory.description,
        cveId: alert.security_advisory.cve_id,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        url: alert.html_url,
      }));
    } catch (error: any) {
      // Dependabot alerts require specific permissions
      if (error.response?.status === 404) {
        logger.warn(`Dependabot alerts not available for ${owner}/${repo}`);
        return [];
      }
      logger.error('Error fetching GitHub security alerts', error);
      throw new Error('Failed to fetch security alerts');
    }
  }

  /**
   * Get organization audit log
   */
  async getAuditLog(organizationId: string, orgName: string): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new Error('GitHub integration not connected');
      }

      const events = await this.makeRequest(
        integration.accessToken,
        `/orgs/${orgName}/audit-log`,
        { per_page: 100 }
      );

      logger.info(`Fetched ${events.length} audit log events from GitHub org ${orgName}`);

      return events.map((event: any) => ({
        action: event.action,
        actor: event.actor,
        createdAt: event.created_at,
        documentId: event.document_id,
        actorLocation: event.actor_location,
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Audit log not available for org ${orgName}`);
        return [];
      }
      logger.error('Error fetching GitHub audit log', error);
      throw new Error('Failed to fetch audit log');
    }
  }

  /**
   * Scan repositories for compliance issues
   */
  async scanRepositoriesForCompliance(organizationId: string): Promise<any> {
    try {
      const repos = await this.listRepositories(organizationId);

      const issues = {
        missingLicense: [] as string[],
        noSecurityPolicy: [] as string[],
        outdatedDependencies: [] as string[],
        publicReposWithSecrets: [] as string[],
      };

      for (const repo of repos) {
        // Check for license
        if (!repo.license) {
          issues.missingLicense.push(repo.fullName);
        }

        // Check for security alerts
        try {
          const alerts = await this.getSecurityAlerts(
            organizationId,
            repo.fullName.split('/')[0],
            repo.name
          );

          if (alerts.length > 0) {
            issues.outdatedDependencies.push(repo.fullName);
          }
        } catch (error) {
          // Skip if not accessible
        }
      }

      logger.info(`Completed compliance scan for ${repos.length} GitHub repositories`);

      return {
        totalRepositories: repos.length,
        issues,
        complianceScore: this.calculateComplianceScore(repos.length, issues),
      };
    } catch (error) {
      logger.error('Error scanning GitHub repositories for compliance', error);
      throw new Error('Failed to scan repositories');
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(totalRepos: number, issues: any): number {
    if (totalRepos === 0) return 100;

    const totalIssues =
      issues.missingLicense.length +
      issues.noSecurityPolicy.length +
      issues.outdatedDependencies.length +
      issues.publicReposWithSecrets.length;

    const maxPossibleIssues = totalRepos * 4; // 4 checks per repo
    const score = Math.max(0, 100 - (totalIssues / maxPossibleIssues) * 100);

    return Math.round(score);
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
            provider: 'github',
          },
        },
        data: {
          connected: false,
          accessToken: null,
          lastSync: null,
        },
      });

      logger.info(`GitHub integration disconnected for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error disconnecting GitHub integration', error);
      throw new Error('Failed to disconnect GitHub integration');
    }
  }
}

export default new GitHubService();
