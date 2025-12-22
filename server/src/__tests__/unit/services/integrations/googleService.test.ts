/**
 * Google Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock Google APIs
const mockOAuth2Client = jest.fn();
const mockListProjects = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    cloudresourcemanager: jest.fn().mockReturnValue({
      projects: {
        list: mockListProjects,
      },
    }),
    auth: {
      OAuth2Client: mockOAuth2Client,
    },
  },
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import googleService from '../../../../services/integrations/googleService';

describe('GoogleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthorizationUrl()', () => {
    it('should generate authorization URL', () => {
      const state = 'test-state';
      const url = googleService.getAuthorizationUrl(state);

      expect(url).toContain('accounts.google.com');
      expect(url).toContain('client_id');
    });
  });

  describe('listProjects()', () => {
    it('should list GCP projects', async () => {
      const integrationId = 'integration-123';

      prismaMock.integration.findUnique.mockResolvedValue({
        id: integrationId,
        accessToken: 'test-token',
      } as any);

      mockListProjects.mockResolvedValue({
        data: {
          projects: [
            { projectId: 'project-1', name: 'Project 1' },
            { projectId: 'project-2', name: 'Project 2' },
          ],
        },
      });

      const result = await googleService.listProjects(integrationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });
});

