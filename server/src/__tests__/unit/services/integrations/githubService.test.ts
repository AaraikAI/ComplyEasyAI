/**
 * GitHub Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock Octokit
const mockReposList = jest.fn();
const mockIssuesCreate = jest.fn();

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      listForOrg: mockReposList,
    },
    issues: {
      create: mockIssuesCreate,
    },
  })),
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
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
      const integrationId = 'integration-123';

      prismaMock.integration.findUnique.mockResolvedValue({
        id: integrationId,
        accessToken: 'test-token',
      } as any);

      mockReposList.mockResolvedValue({
        data: [
          { id: 1, name: 'repo-1', full_name: 'org/repo-1' },
          { id: 2, name: 'repo-2', full_name: 'org/repo-2' },
        ],
      });

      const result = await githubService.listRepositories(integrationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('createIssue()', () => {
    it('should create GitHub issue', async () => {
      const integrationId = 'integration-123';
      const issueData = {
        owner: 'test-org',
        repo: 'test-repo',
        title: 'Test Issue',
        body: 'Issue description',
      };

      prismaMock.integration.findUnique.mockResolvedValue({
        id: integrationId,
        accessToken: 'test-token',
      } as any);

      mockIssuesCreate.mockResolvedValue({
        data: {
          id: 123,
          number: 1,
          title: 'Test Issue',
        },
      });

      const result = await githubService.createIssue(integrationId, issueData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('number');
    });
  });
});

