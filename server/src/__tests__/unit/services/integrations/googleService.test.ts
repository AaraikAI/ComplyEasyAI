/**
 * Google Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock OAuth2 client instance
const mockOAuth2Instance = {
  generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?client_id=test&state=test-state'),
  getToken: jest.fn(),
  setCredentials: jest.fn(),
  on: jest.fn(),
};

// Mock OAuth2 constructor
const MockOAuth2 = jest.fn().mockImplementation(() => mockOAuth2Instance);

const mockListProjects = jest.fn();

// Mock googleapis BEFORE any imports that use it
jest.mock('googleapis', () => ({
  google: {
    cloudresourcemanager: jest.fn().mockReturnValue({
      projects: {
        list: mockListProjects,
      },
    }),
    auth: {
      OAuth2: MockOAuth2,
    },
    oauth2: jest.fn().mockReturnValue({
      userinfo: {
        get: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      },
    }),
  },
  Auth: {},
}));

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    oauth: {
      google: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        callbackUrl: 'http://localhost:3001/api/auth/google/callback',
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
    debug: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
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

