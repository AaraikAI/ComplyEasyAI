/**
 * Integrations Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock integration services
const mockGetAuthorizationUrl = jest.fn();
const mockGetAccessToken = jest.fn();
const mockSaveIntegration = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('../../../services/integrations/googleService', () => ({
  __esModule: true,
  default: {
    getAuthorizationUrl: mockGetAuthorizationUrl,
    getTokensFromCode: mockGetAccessToken,
    getUserInfo: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    saveIntegration: mockSaveIntegration,
    disconnect: mockDisconnect,
  },
}));

jest.mock('../../../services/integrations/githubService', () => ({
  __esModule: true,
  default: {
    getAuthorizationUrl: mockGetAuthorizationUrl,
    getAccessToken: mockGetAccessToken,
    getUserInfo: jest.fn().mockResolvedValue({ login: 'testuser' }),
    saveIntegration: mockSaveIntegration,
    disconnect: mockDisconnect,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import * as integrationsController from '../../../controllers/integrationsController';

describe('IntegrationsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLIENT_URL = 'http://localhost:3000';

    mockRequest = {
      query: {},
      body: {},
      params: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockGetAuthorizationUrl.mockReturnValue('https://oauth.example.com/auth');
    mockGetAccessToken.mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
    });
  });

  describe('authorizeGoogle()', () => {
    it('should generate Google authorization URL', async () => {
      await integrationsController.authorizeGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          authUrl: expect.any(String),
        })
      );
    });
  });

  describe('callbackGoogle()', () => {
    it('should handle Google OAuth callback', async () => {
      mockRequest.query = {
        code: 'test-code',
        state: 'test-state-uuid',
      };

      // Mock state verification (would need to mock the state map)
      await integrationsController.callbackGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      // Should redirect
      expect(mockResponse.redirect).toHaveBeenCalled();
    });
  });

  describe('listIntegrations()', () => {
    it('should list all integrations', async () => {
      const mockIntegrations = [
        { id: 'int-1', provider: 'google', connected: true },
        { id: 'int-2', provider: 'github', connected: false },
      ];

      prismaMock.integration.findMany.mockResolvedValue(mockIntegrations as any);

      await integrationsController.listIntegrations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.any(Array),
        })
      );
    });
  });

  describe('connectAWS()', () => {
    it('should connect AWS integration', async () => {
      mockRequest.body = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const mockAwsService = require('../../../services/integrations/awsService').default;
      mockAwsService.validateCredentials = jest.fn().mockResolvedValue({
        valid: true,
        accountId: '123456789012',
      });
      mockAwsService.saveIntegration = jest.fn().mockResolvedValue(undefined);

      await integrationsController.connectAWS(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});

