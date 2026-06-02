/**
 * Google OAuth 2.0 and Workspace Integration Service
 * Handles authentication, token management, and data syncing with Google Workspace
 */

import { google, Auth } from 'googleapis';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { encryptField, decryptField } from '../../utils/credentialEncryption';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class GoogleService {
  /**
   * Build a fresh OAuth2 client per request/org. A single shared instance would
   * let concurrent multi-tenant calls overwrite each other's credentials between
   * setCredentials() and the awaited API call, leaking one org's access token
   * into another org's request.
   */
  private createOAuthClient(): Auth.OAuth2Client {
    return new google.auth.OAuth2(
      config.oauth.google.clientId,
      config.oauth.google.clientSecret,
      config.oauth.google.callbackUrl
    );
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    ];

    return this.createOAuthClient().generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.createOAuthClient().getToken(code);

      if (!tokens.access_token) {
        throw new AppError('No access token received from Google', 500);
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
      };
    } catch (error) {
      logger.error('Error exchanging Google auth code for tokens', error);
      throw new AppError('Failed to exchange authorization code', 500);
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id!,
        email: data.email!,
        name: data.name!,
        picture: data.picture || undefined,
      };
    } catch (error) {
      logger.error('Error fetching Google user info', error);
      throw new AppError('Failed to fetch user information', 500);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      // Caller may pass an encrypted refresh token from the DB; ensure plaintext for the API call.
      const plaintextRefreshToken = decryptField(refreshToken);
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ refresh_token: plaintextRefreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();

      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || refreshToken,
        expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
      };
    } catch (error) {
      logger.error('Error refreshing Google access token', error);
      throw new AppError('Failed to refresh access token', 500);
    }
  }

  /**
   * Save integration to database
   */
  async saveIntegration(
    organizationId: string,
    tokens: GoogleTokens,
    userInfo: GoogleUserInfo
  ): Promise<void> {
    try {
      await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'google',
          },
        },
        create: {
          organizationId,
          name: 'Google Workspace',
          category: 'identity',
          provider: 'google',
          connected: true,
          accessToken: tokens.access_token ? encryptField(tokens.access_token) : null,
          refreshToken: tokens.refresh_token ? encryptField(tokens.refresh_token) : null,
          expiresAt: new Date(tokens.expiry_date),
          config: {
            userId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          },
          lastSync: new Date(),
        },
        update: {
          connected: true,
          accessToken: tokens.access_token ? encryptField(tokens.access_token) : null,
          refreshToken: tokens.refresh_token ? encryptField(tokens.refresh_token) : undefined,
          expiresAt: new Date(tokens.expiry_date),
          config: {
            userId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          },
          lastSync: new Date(),
        },
      });

      logger.info(`Google integration saved for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error saving Google integration', error);
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
          provider: 'google',
        },
      },
    });
  }

  /**
   * Ensure access token is valid, refresh if needed
   * Includes retry logic with exponential backoff for network failures
   */
  async ensureValidToken(organizationId: string, retryCount: number = 0): Promise<string> {
    const integration = await this.getIntegration(organizationId);

    if (!integration || !integration.connected) {
      throw new AppError('Google integration not connected', 400);
    }

    // Check if token is expired or will expire in next 5 minutes
    const now = new Date();
    const expiresAt = integration.expiresAt || now;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      if (!integration.refreshToken) {
        throw new AppError('No refresh token available', 400);
      }

      const maxRetries = 3;
      const baseDelay = 1000; // 1 second

      try {
        // Refresh the token with retry logic
        const newTokens = await this.refreshAccessTokenWithRetry(
          integration.refreshToken,
          maxRetries,
          baseDelay
        );

        // Update in database (encrypted at rest)
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            accessToken: newTokens.access_token ? encryptField(newTokens.access_token) : null,
            refreshToken: newTokens.refresh_token ? encryptField(newTokens.refresh_token) : integration.refreshToken,
            expiresAt: new Date(newTokens.expiry_date),
          },
        });

        return newTokens.access_token; // plaintext for outbound API use
      } catch (error: any) {
        logger.error(`Failed to refresh Google token after ${retryCount} retries`, error);
        
        // If network error and retries left, retry the entire method
        if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('network'))) {
          const delay = baseDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.ensureValidToken(organizationId, retryCount + 1);
        }
        
        throw error;
      }
    }

    return decryptField(integration.accessToken!);
  }

  /**
   * Refresh access token with exponential backoff retry logic
   */
  private async refreshAccessTokenWithRetry(
    refreshToken: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<GoogleTokens> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.refreshAccessToken(refreshToken);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors (invalid refresh token)
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
          logger.warn(`Google token refresh attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError || new AppError('Failed to refresh token after retries', 500);
  }

  /**
   * Sync users from Google Workspace Admin Directory
   */
  async syncUsers(organizationId: string): Promise<any[]> {
    try {
      const accessToken = await this.ensureValidToken(organizationId);
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const admin = google.admin({ version: 'directory_v1', auth: oauth2Client });

      const { data } = await admin.users.list({
        customer: 'my_customer',
        maxResults: 100,
        orderBy: 'email',
      });

      const users = data.users || [];

      logger.info(`Synced ${users.length} users from Google Workspace for org ${organizationId}`);

      return users.map((user) => ({
        id: user.id,
        email: user.primaryEmail,
        name: user.name?.fullName,
        suspended: user.suspended,
        createdAt: user.creationTime,
        lastLogin: user.lastLoginTime,
      }));
    } catch (error: any) {
      logger.error('Error syncing Google users', error);

      if (error.code === 401) {
        throw new AppError('Authentication failed. Please reconnect Google integration.', 403);
      }

      throw new AppError('Failed to sync users from Google Workspace', 500);
    }
  }

  /**
   * Sync groups from Google Workspace Admin Directory
   */
  async syncGroups(organizationId: string): Promise<any[]> {
    try {
      const accessToken = await this.ensureValidToken(organizationId);
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const admin = google.admin({ version: 'directory_v1', auth: oauth2Client });

      const { data } = await admin.groups.list({
        customer: 'my_customer',
        maxResults: 100,
      });

      const groups = data.groups || [];

      logger.info(`Synced ${groups.length} groups from Google Workspace for org ${organizationId}`);

      return groups.map((group) => ({
        id: group.id,
        email: group.email,
        name: group.name,
        description: group.description,
        memberCount: group.directMembersCount,
      }));
    } catch (error: any) {
      logger.error('Error syncing Google groups', error);

      if (error.code === 401) {
        throw new AppError('Authentication failed. Please reconnect Google integration.', 403);
      }

      throw new AppError('Failed to sync groups from Google Workspace', 500);
    }
  }

  /**
   * Get audit logs from Google Admin Reports API
   */
  async getAuditLogs(
    organizationId: string,
    applicationName: 'admin' | 'drive' | 'login' = 'admin',
    maxResults: number = 100
  ): Promise<any[]> {
    try {
      const accessToken = await this.ensureValidToken(organizationId);
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const reports = google.admin({ version: 'reports_v1', auth: oauth2Client });

      const { data } = await reports.activities.list({
        userKey: 'all',
        applicationName,
        maxResults,
      });

      const activities = data.items || [];

      logger.info(`Fetched ${activities.length} audit logs from Google for org ${organizationId}`);

      return activities.map((activity) => ({
        id: activity.id?.uniqueQualifier,
        actorEmail: activity.actor?.email,
        timestamp: activity.id?.time,
        eventName: activity.events?.[0]?.name,
        eventType: activity.events?.[0]?.type,
        parameters: activity.events?.[0]?.parameters,
      }));
    } catch (error: any) {
      logger.error('Error fetching Google audit logs', error);

      if (error.code === 401) {
        throw new AppError('Authentication failed. Please reconnect Google integration.', 403);
      }

      throw new AppError('Failed to fetch audit logs from Google', 500);
    }
  }

  /**
   * List files from Google Drive
   */
  async listDriveFiles(
    organizationId: string,
    query: string = '',
    maxResults: number = 100
  ): Promise<any[]> {
    try {
      const accessToken = await this.ensureValidToken(organizationId);
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const { data } = await drive.files.list({
        q: query || 'trashed=false',
        pageSize: maxResults,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, owners, shared, webViewLink)',
      });

      const files = data.files || [];

      logger.info(`Listed ${files.length} files from Google Drive for org ${organizationId}`);

      return files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        owners: file.owners?.map((owner) => owner.emailAddress),
        shared: file.shared,
        webViewLink: file.webViewLink,
      }));
    } catch (error: any) {
      logger.error('Error listing Google Drive files', error);

      if (error.code === 401) {
        throw new AppError('Authentication failed. Please reconnect Google integration.', 403);
      }

      throw new AppError('Failed to list files from Google Drive', 500);
    }
  }

  /**
   * Disconnect integration (revoke access)
   */
  async disconnect(organizationId: string): Promise<void> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (integration && integration.accessToken) {
        // Revoke the token
        try {
          await this.createOAuthClient().revokeToken(decryptField(integration.accessToken));
        } catch (error) {
          logger.warn('Error revoking Google token (may already be revoked)', error);
        }
      }

      // Update database
      await prisma.integration.update({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'google',
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

      logger.info(`Google integration disconnected for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error disconnecting Google integration', error);
      throw new AppError('Failed to disconnect Google integration', 500);
    }
  }
}

export default new GoogleService();
