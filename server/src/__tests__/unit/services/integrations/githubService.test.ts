/**
 * GitHub Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock axios (the service uses axios, not Octokit)
const mockAxiosGet = jest.fn() as jest.Mock<any>;
const mockAxiosPost = jest.fn() as jest.Mock<any>;

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    oauth: {
      github: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        callbackUrl: 'http://localhost:3001/api/auth/github/callback',
      },
    },
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

import githubService from '../../../../services/integrations/githubService';

describe('GitHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listRepositories()', () => {
    it('should list GitHub repositories', async () => {
      const organizationId = 'org-123';

      prismaMock.integration.findUnique.mockResolvedValue({
        id: 'integration-123',
        provider: 'github',
        connected: true,
        accessToken: 'test-token',
      } as any);

      mockAxiosGet.mockResolvedValue({
        data: [
          {
            id: 1,
            name: 'repo-1',
            full_name: 'org/repo-1',
            private: false,
            description: 'Test repo 1',
            html_url: 'https://github.com/org/repo-1',
            language: 'TypeScript',
            stargazers_count: 10,
            forks_count: 2,
            open_issues_count: 1,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-06-01T00:00:00Z',
            pushed_at: '2023-06-01T00:00:00Z',
          },
          {
            id: 2,
            name: 'repo-2',
            full_name: 'org/repo-2',
            private: true,
            description: 'Test repo 2',
            html_url: 'https://github.com/org/repo-2',
            language: 'JavaScript',
            stargazers_count: 5,
            forks_count: 1,
            open_issues_count: 0,
            created_at: '2023-02-01T00:00:00Z',
            updated_at: '2023-07-01T00:00:00Z',
            pushed_at: '2023-07-01T00:00:00Z',
          },
        ],
      });

      const result = await githubService.listRepositories(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  // Note: createIssue method not implemented in service
  // Tests for repository listing and other methods can be added as needed
});
