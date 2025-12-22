/**
 * Jira Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock axios
const mockAxiosPost = jest.fn();
const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: mockAxiosPost,
    get: mockAxiosGet,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../config', () => ({
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

      await expect(jiraService.getAccessToken('test-code')).rejects.toThrow(
        'No access token received'
      );
    });
  });

  describe('createIssue()', () => {
    it('should create Jira issue', async () => {
      const integrationId = 'integration-123';
      const issueData = {
        summary: 'Test Issue',
        description: 'Test description',
        issueType: 'Bug',
        projectKey: 'TEST',
      };

      prismaMock.integration.findUnique.mockResolvedValue({
        id: integrationId,
        accessToken: 'test-token',
        cloudId: 'cloud-123',
      } as any);

      mockAxiosPost.mockResolvedValue({
        data: {
          id: 'issue-123',
          key: 'TEST-1',
        },
      });

      const result = await jiraService.createIssue(integrationId, issueData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
    });
  });
});

