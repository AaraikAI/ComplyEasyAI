/**
 * EU AI Database Client Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ---------- Mocks ----------
const mockAxiosPost = jest.fn() as jest.Mock<any>;

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: mockAxiosPost,
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

const mockConfig = {
  euAiDb: {
    apiBaseUrl: 'https://euai.example.com/api',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    orgId: 'eu-org-123',
  },
};

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: mockConfig,
}));

// ---------- Import after mocks ----------
import euAiDatabaseClient from '../../../../services/euRegulations/euAiDatabaseClient';

describe('EUAiDatabaseClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset config to defaults
    mockConfig.euAiDb = {
      apiBaseUrl: 'https://euai.example.com/api',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      orgId: 'eu-org-123',
    };
  });

  // -------------------------------------------------------------------
  // registerSystem - enabled
  // -------------------------------------------------------------------
  describe('registerSystem()', () => {
    const payload = {
      organizationId: 'org-123',
      systemName: 'HighRisk AI System',
      riskLevel: 'high',
      highRiskCategory: 'critical_infrastructure',
      isGeneralPurpose: false,
      isGenerative: false,
    };

    it('should return registration ID on successful registration', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { registrationId: 'eu-reg-abc-123' },
      });

      const result = await euAiDatabaseClient.registerSystem(payload);

      expect(result).toBe('eu-reg-abc-123');
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://euai.example.com/api/systems',
        expect.objectContaining({
          organizationId: 'eu-org-123',
          systemName: 'HighRisk AI System',
          riskLevel: 'high',
          highRiskCategory: 'critical_infrastructure',
        }),
        expect.objectContaining({
          timeout: 10000,
          auth: {
            username: 'test-client-id',
            password: 'test-client-secret',
          },
        }),
      );
    });

    it('should strip trailing slashes from apiBaseUrl', async () => {
      mockConfig.euAiDb.apiBaseUrl = 'https://euai.example.com/api///';
      mockAxiosPost.mockResolvedValue({
        data: { registrationId: 'eu-reg-xyz' },
      });

      await euAiDatabaseClient.registerSystem(payload);

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://euai.example.com/api/systems',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should return null when response is missing registrationId', async () => {
      mockAxiosPost.mockResolvedValue({
        data: {},
      });

      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
    });

    it('should return null on network error without crashing', async () => {
      mockAxiosPost.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
    });

    it('should return null on HTTP error (e.g. 500)', async () => {
      const error: any = new Error('Internal Server Error');
      error.response = { status: 500, data: { message: 'server error' } };
      mockAxiosPost.mockRejectedValue(error);

      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
    });

    it('should return null on HTTP 401', async () => {
      const error: any = new Error('Unauthorized');
      error.response = { status: 401, data: { message: 'invalid credentials' } };
      mockAxiosPost.mockRejectedValue(error);

      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // registerSystem - disabled (missing config)
  // -------------------------------------------------------------------
  describe('registerSystem() when disabled', () => {
    const payload = {
      organizationId: 'org-123',
      systemName: 'System',
      riskLevel: 'high',
      isGeneralPurpose: false,
      isGenerative: false,
    };

    it('should return null when apiBaseUrl is empty', async () => {
      mockConfig.euAiDb.apiBaseUrl = '';
      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('should return null when clientId is empty', async () => {
      mockConfig.euAiDb.clientId = '';
      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('should return null when clientSecret is empty', async () => {
      mockConfig.euAiDb.clientSecret = '';
      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('should return null when orgId is empty', async () => {
      mockConfig.euAiDb.orgId = '';
      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('should return null when euAiDb config is null', async () => {
      (mockConfig as any).euAiDb = null;
      const result = await euAiDatabaseClient.registerSystem(payload);
      expect(result).toBeNull();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });
  });
});
