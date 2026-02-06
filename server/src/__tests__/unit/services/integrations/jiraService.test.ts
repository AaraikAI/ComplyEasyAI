/**
 * Jira Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock axios
const mockAxiosPost = jest.fn() as jest.Mock<any>;
const mockAxiosGet = jest.fn() as jest.Mock<any>;

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: mockAxiosPost,
    get: mockAxiosGet,
  },
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    oauth: {
      jira: {
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        callbackUrl: 'http://localhost:3001/api/integrations/jira/callback',
      },
    },
  },
}));

import jiraService from '../../../../services/integrations/jiraService';

describe('JiraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthorizationUrl()', () => {
    it('should generate authorization URL', () => {
      const state = 'test-state';
      const url = jiraService.getAuthorizationUrl(state);

      expect(url).toContain('auth.atlassian.com');
      expect(url).toContain('client_id');
      expect(url).toContain('state=' + state);
    });
  });

  describe('getAccessToken()', () => {
    it('should exchange code for access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'read:jira-work',
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      const result = await jiraService.getAccessToken('test-code');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('test-access-token');
    });

    it('should throw error if no access token received', async () => {
      mockAxiosPost.mockResolvedValue({
        data: {},
      });

      // The inner "No access token received" error is caught and re-thrown
      // as "Failed to exchange authorization code" by the catch block
      await expect(jiraService.getAccessToken('test-code')).rejects.toThrow(
        'Failed to exchange authorization code'
      );
    });
  });

  describe('createIssue()', () => {
    it('should create Jira issue', async () => {
      const organizationId = 'org-123';
      const projectKey = 'TEST';
      const issueData = {
        summary: 'Test Issue',
        description: 'Test description',
        issueType: 'Bug',
      };

      // createIssue calls ensureValidToken -> getIntegration -> prisma.integration.findUnique
      prismaMock.integration.findUnique.mockResolvedValue({
        id: 'integration-123',
        provider: 'jira',
        connected: true,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        config: {
          cloudId: 'cloud-123',
          siteName: 'test-site',
          siteUrl: 'https://test.atlassian.net',
          scope: 'read:jira-work write:jira-work',
        },
      } as any);

      mockAxiosPost.mockResolvedValue({
        data: {
          id: 'issue-123',
          key: 'TEST-1',
          self: 'https://api.atlassian.com/ex/jira/cloud-123/rest/api/3/issue/issue-123',
        },
      });

      const result = await jiraService.createIssue(organizationId, projectKey, issueData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
    });
  });
});

