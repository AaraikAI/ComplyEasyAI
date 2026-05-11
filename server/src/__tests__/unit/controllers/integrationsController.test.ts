/**
 * Integrations Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock integration services
const mockGetAuthorizationUrl = jest.fn<() => string>();
const mockGetAccessToken = jest.fn<() => Promise<{ access_token: string; refresh_token: string }>>();
const mockSaveIntegration = jest.fn<() => Promise<void>>();
const mockDisconnect = jest.fn<() => Promise<void>>();

jest.mock('../../../services/integrations/googleService', () => ({
  __esModule: true,
  default: {
    getAuthorizationUrl: mockGetAuthorizationUrl,
    getTokensFromCode: mockGetAccessToken,
    getUserInfo: jest.fn().mockResolvedValue({ email: 'test@example.com' } as never),
    saveIntegration: mockSaveIntegration,
    disconnect: mockDisconnect,
  },
}));

jest.mock('../../../services/integrations/githubService', () => ({
  __esModule: true,
  default: {
    getAuthorizationUrl: mockGetAuthorizationUrl,
    getAccessToken: mockGetAccessToken,
    getUserInfo: jest.fn().mockResolvedValue({ login: 'testuser' } as never),
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
  let mockNext: NextFunction;

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
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      redirect: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;

    mockGetAuthorizationUrl.mockReturnValue('https://oauth.example.com/auth' as never);
    mockGetAccessToken.mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
    } as never);
  });

  describe('authorizeGoogle()', () => {
    it('should generate Google authorization URL', async () => {
      await integrationsController.authorizeGoogle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          authUrl: expect.any(String),
        })
      );
    });
  });

  describe('callbackGoogle()', () => {
    it('should redirect with error status when state is invalid', async () => {
      mockRequest.query = {
        code: 'test-code',
        state: 'test-state-uuid',
      };

      // The internal oauthStates map is not populated, so verifyState returns null.
      // The controller throws AppError('Invalid or expired state parameter', 400);
      // its catch block treats messages containing "Invalid" as non-retryable and
      // redirects the user back to the frontend instead of sending JSON.
      await integrationsController.callbackGoogle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('integration=google&status=error')
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Invalid or expired state parameter'))
      );
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('listIntegrations()', () => {
    it('should list all integrations', async () => {
      const mockIntegrations = [
        { id: 'int-1', provider: 'google', connected: true },
        { id: 'int-2', provider: 'github', connected: false },
      ];

      (prismaMock.integration.findMany as jest.Mock<any>).mockResolvedValue(mockIntegrations as any);

      await integrationsController.listIntegrations(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
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
      mockAwsService.validateCredentials = jest.fn<any>().mockResolvedValue({
        valid: true,
        accountId: '123456789012',
      } as never);
      mockAwsService.saveIntegration = jest.fn<any>().mockResolvedValue(undefined as never);

      await integrationsController.connectAWS(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
