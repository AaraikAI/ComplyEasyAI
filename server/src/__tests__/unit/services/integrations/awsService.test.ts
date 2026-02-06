/**
 * AWS Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock AWS SDK
const mockGetCallerIdentity = jest.fn() as jest.Mock<any>;
const mockSTS = jest.fn() as jest.Mock<any>;

jest.mock('aws-sdk', () => ({
  __esModule: true,
  default: {
    STS: mockSTS,
    config: {
      update: jest.fn(),
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

import awsService from '../../../../services/integrations/awsService';

describe('AWSService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply STS constructor mock after resetMocks clears it
    mockSTS.mockImplementation(() => ({
      getCallerIdentity: (jest.fn() as jest.Mock<any>).mockReturnValue({ promise: mockGetCallerIdentity }),
    }));
  });

  describe('validateCredentials()', () => {
    it('should validate valid AWS credentials', async () => {
      mockGetCallerIdentity.mockResolvedValue({
        Account: '123456789012',
      });

      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      const result = await awsService.validateCredentials(credentials);

      expect(result.valid).toBe(true);
      expect(result.accountId).toBe('123456789012');
    });

    it('should reject invalid credentials', async () => {
      mockGetCallerIdentity.mockRejectedValue(new Error('Invalid credentials'));

      const credentials = {
        accessKeyId: 'invalid',
        secretAccessKey: 'invalid',
        region: 'us-east-1',
      };

      const result = await awsService.validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('saveIntegration()', () => {
    it('should save AWS integration', async () => {
      const organizationId = 'org-123';
      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'secret',
        region: 'us-east-1',
      };

      prismaMock.integration.upsert.mockResolvedValue({
        id: 'integration-123',
        provider: 'aws',
        organizationId,
      } as any);

      await awsService.saveIntegration(organizationId, credentials, '123456789012');

      expect(prismaMock.integration.upsert).toHaveBeenCalled();
    });
  });
});

