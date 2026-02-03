/**
 * Google Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock OAuth2 client instance
const mockOAuth2Instance = {
  generateAuthUrl: (jest.fn() as jest.Mock<any>).mockReturnValue('https://accounts.google.com/o/oauth2/auth?client_id=test&state=test-state'),
  getToken: jest.fn() as jest.Mock<any>,
  setCredentials: jest.fn() as jest.Mock<any>,
  on: jest.fn() as jest.Mock<any>,
};

// Mock OAuth2 constructor
const MockOAuth2 = (jest.fn() as jest.Mock<any>).mockImplementation(() => mockOAuth2Instance);

const mockListProjects = jest.fn() as jest.Mock<any>;

// Mock googleapis BEFORE any imports that use it
jest.mock('googleapis', () => ({
  google: {
    cloudresourcemanager: (jest.fn() as jest.Mock<any>).mockReturnValue({
      projects: {
        list: mockListProjects,
      },
    }),
    auth: {
      OAuth2: MockOAuth2,
    },
    oauth2: (jest.fn() as jest.Mock<any>).mockReturnValue({
      userinfo: {
        get: (jest.fn() as jest.Mock<any>).mockResolvedValue({
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

  // Note: listProjects method not implemented in Google service
  // Tests for syncUsers and other methods can be added as needed
});

