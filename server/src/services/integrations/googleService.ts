/**
 * Google OAuth 2.0 and Workspace Integration Service
 * Handles authentication, token management, and data syncing with Google Workspace
 */

import { google, Auth } from 'googleapis';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';

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
  private oauth2Client: Auth.OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
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

    return this.oauth2Client.generateAuthUrl({
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
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
      };
    } catch (error) {
      logger.error('Error exchanging Google auth code for tokens', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });

      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id!,
        email: data.email!,
        name: data.name!,
        picture: data.picture || undefined,
      };
    } catch (error) {
      logger.error('Error fetching Google user info', error);
      throw new Error('Failed to fetch user information');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || refreshToken,
        expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
      };
    } catch (error) {
      logger.error('Error refreshing Google access token', error);
      throw new Error('Failed to refresh access token');
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
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
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
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
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
          provider: 'google',
        },
      },
    });
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  async ensureValidToken(organizationId: string): Promise<string> {
    const integration = await this.getIntegration(organizationId);

    if (!integration || !integration.connected) {
      throw new Error('Google integration not connected');
    }

    // Check if token is expired or will expire in next 5 minutes
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
          refreshToken: newTokens.refresh_token || integration.refreshToken,
          expiresAt: new Date(newTokens.expiry_date),
        },
      });

      return newTokens.access_token;
    }

    return integration.accessToken!;
  }

  /**
   * Sync users from Google Workspace Admin Directory
   */
  async syncUsers(organizationId: string): Promise<any[]> {
    try {
      const accessToken = await this.ensureValidToken(organizationId);
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const admin = google.admin({ version: 'directory_v1', auth: this.oauth2Client });

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
        throw new Error('Authentication failed. Please reconnect Google integration.');
      }

      throw new Error('Failed to sync users from Google Workspace');
    }
  }

  /**
   * Sync groups from Google Workspace Admin Directory
   */
  async syncGroups(organizationId: string): Promise<any[]> {
    try {
      const accessToken = await this.ensureValidToken(organizationId);
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const admin = google.admin({ version: 'directory_v1', auth: this.oauth2Client });

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
        throw new Error('Authentication failed. Please reconnect Google integration.');
      }

      throw new Error('Failed to sync groups from Google Workspace');
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
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const reports = google.admin({ version: 'reports_v1', auth: this.oauth2Client });

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
        throw new Error('Authentication failed. Please reconnect Google integration.');
      }

      throw new Error('Failed to fetch audit logs from Google');
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
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

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
        throw new Error('Authentication failed. Please reconnect Google integration.');
      }

      throw new Error('Failed to list files from Google Drive');
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
          await this.oauth2Client.revokeToken(integration.accessToken);
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
      throw new Error('Failed to disconnect Google integration');
    }
  }
}

export default new GoogleService();
