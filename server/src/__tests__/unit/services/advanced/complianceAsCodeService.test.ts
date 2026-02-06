/**
 * Compliance-as-Code Service Unit Tests - Comprehensive Coverage
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn<any>().mockResolvedValue({ data: { result: true } }),
    put: jest.fn<any>().mockResolvedValue({ data: {} }),
    get: jest.fn<any>().mockResolvedValue({ data: {} }),
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn<any>().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn<any>().mockReturnValue('package main'),
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
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

import complianceAsCodeService from '../../../../services/advanced/complianceAsCodeService';

describe('ComplianceAsCodeService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  const mockPolicy = {
    id: 'policy-1',
    organizationId: orgId,
    name: 'data_protection',
    title: 'Data Protection Policy',
    description: 'Ensures data protection compliance',
    regoCode: 'package complyeasy.data_protection\ndefault allow = false\nallow { input.encrypted == true }',
    frameworkId: 'fw-1',
    status: 'active',
    version: 1,
    previousVersions: [],
    evaluationResults: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
  };

  const mockFramework = {
    id: 'fw-1',
    name: 'SOC 2',
    organizationId: orgId,
    controls: [
      { id: 'c-1', name: 'CC1.1', description: 'Control Environment', status: 'Implemented' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const axios = require('axios').default;
    axios.post.mockResolvedValue({ data: { result: true } });
    axios.put.mockResolvedValue({ data: {} });
    axios.get.mockResolvedValue({ data: {} });

    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);

    (prismaMock.compliancePolicy.create as jest.Mock<any>).mockResolvedValue(mockPolicy);
    (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValue(mockPolicy);
    (prismaMock.compliancePolicy.findMany as jest.Mock<any>).mockResolvedValue([mockPolicy]);
    (prismaMock.compliancePolicy.findUnique as jest.Mock<any>).mockResolvedValue(mockPolicy);
    (prismaMock.compliancePolicy.update as jest.Mock<any>).mockResolvedValue(mockPolicy);
    (prismaMock.compliancePolicy.delete as jest.Mock<any>).mockResolvedValue(mockPolicy);
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework]);
    (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockFramework.controls);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.vendor.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.integration.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.integration.create as jest.Mock<any>).mockResolvedValue({});
  });

  // ===================== createPolicy =====================
  describe('createPolicy', () => {
    it('should create a new compliance policy', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      const result = await complianceAsCodeService.createPolicy(orgId, {
        name: 'data_protection',
        title: 'Data Protection Policy',
        description: 'Ensures data protection compliance',
        regoCode: 'package complyeasy.data_protection\ndefault allow = false\nallow { input.encrypted == true }',
        frameworkId: 'fw-1',
      }, userId);

      expect(result).toBeDefined();
      expect(prismaMock.compliancePolicy.create).toHaveBeenCalled();
    });

    it('should throw on duplicate policy name', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockPolicy);

      await expect(
        complianceAsCodeService.createPolicy(orgId, {
          name: 'data_protection',
          title: 'Data Protection',
          regoCode: 'package test',
        }, userId)
      ).rejects.toThrow();
    });

    it('should validate rego syntax', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      const result = await complianceAsCodeService.createPolicy(orgId, {
        name: 'valid_policy',
        title: 'Valid Policy',
        regoCode: 'package complyeasy.valid\ndefault allow = false',
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== evaluatePolicy =====================
  describe('evaluatePolicy', () => {
    it('should evaluate a policy with input data', async () => {
      const result = await complianceAsCodeService.evaluatePolicy(
        'policy-1', orgId, { encrypted: true }
      );

      expect(result).toBeDefined();
    });

    it('should throw when policy not found', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        complianceAsCodeService.evaluatePolicy('nonexistent', orgId, {})
      ).rejects.toThrow();
    });

    it('should handle OPA evaluation failure gracefully', async () => {
      const axios = require('axios').default;
      axios.post.mockRejectedValueOnce(new Error('OPA unavailable'));

      const result = await complianceAsCodeService.evaluatePolicy(
        'policy-1', orgId, { encrypted: true }
      );

      expect(result).toBeDefined();
    });
  });

  // ===================== evaluateMultiplePolicies =====================
  describe('evaluateMultiplePolicies', () => {
    it('should evaluate multiple policies', async () => {
      const result = await complianceAsCodeService.evaluateMultiplePolicies(
        orgId, ['policy-1'], { encrypted: true }
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty policy list', async () => {
      const result = await complianceAsCodeService.evaluateMultiplePolicies(
        orgId, [], { encrypted: true }
      );

      expect(result).toBeDefined();
    });
  });

  // ===================== generateComplianceReport =====================
  describe('generateComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const result = await complianceAsCodeService.generateComplianceReport(orgId);

      expect(result).toBeDefined();
    });

    it('should handle no policies', async () => {
      (prismaMock.compliancePolicy.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await complianceAsCodeService.generateComplianceReport(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== setupCIIntegration =====================
  describe('setupCIIntegration', () => {
    it('should setup CI integration', async () => {
      const result = await complianceAsCodeService.setupCIIntegration(orgId, {
        provider: 'github',
        repositoryUrl: 'https://github.com/org/repo',
        webhookUrl: 'https://example.com/webhook',
      }, userId);

      expect(result).toBeDefined();
    });

    it('should support different CI providers', async () => {
      for (const provider of ['github', 'gitlab', 'jenkins', 'azure_devops']) {
        const result = await complianceAsCodeService.setupCIIntegration(orgId, {
          provider: provider as any,
          repositoryUrl: 'https://example.com/repo',
          webhookUrl: 'https://example.com/webhook',
        }, userId);

        expect(result).toBeDefined();
      }
    });
  });

  // ===================== handleCIWebhook =====================
  describe('handleCIWebhook', () => {
    it('should handle CI webhook from GitHub', async () => {
      (prismaMock.integration.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'int-1',
        type: 'ci_cd',
        organizationId: orgId,
        config: JSON.stringify({ provider: 'github' }),
      });

      const result = await complianceAsCodeService.handleCIWebhook(orgId, {
        provider: 'github',
        event: 'push',
        branch: 'main',
        commit: 'abc123',
        repository: 'org/repo',
      });

      expect(result).toBeDefined();
    });

    it('should handle missing integration', async () => {
      (prismaMock.integration.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        complianceAsCodeService.handleCIWebhook(orgId, {
          provider: 'github',
          event: 'push',
          branch: 'main',
          commit: 'abc123',
          repository: 'org/repo',
        })
      ).rejects.toThrow();
    });
  });

  // ===================== getPoliciesByFramework =====================
  describe('getPoliciesByFramework', () => {
    it('should return policies for a framework', async () => {
      const result = await complianceAsCodeService.getPoliciesByFramework('fw-1', orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===================== getOrganizationComplianceData =====================
  describe('getOrganizationComplianceData', () => {
    it('should return organization compliance data', async () => {
      const result = await complianceAsCodeService.getOrganizationComplianceData(orgId);

      expect(result).toBeDefined();
    });
  });

  // ===================== getPolicy =====================
  describe('getPolicy', () => {
    it('should get a policy by ID', async () => {
      const result = await complianceAsCodeService.getPolicy('policy-1');
      expect(result).toBeDefined();
    });

    it('should return null when policy not found', async () => {
      (prismaMock.compliancePolicy.findUnique as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceAsCodeService.getPolicy('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ===================== updatePolicy =====================
  describe('updatePolicy', () => {
    it('should update a policy', async () => {
      const result = await complianceAsCodeService.updatePolicy('policy-1', orgId, {
        title: 'Updated Policy',
        regoCode: 'package complyeasy.updated\ndefault allow = true',
      }, userId);

      expect(result).toBeDefined();
      expect(prismaMock.compliancePolicy.update).toHaveBeenCalled();
    });

    it('should throw when policy not found', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        complianceAsCodeService.updatePolicy('nonexistent', orgId, {
          title: 'Updated',
        }, userId)
      ).rejects.toThrow();
    });
  });

  // ===================== rollbackPolicy =====================
  describe('rollbackPolicy', () => {
    it('should rollback a policy to previous version', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce({
        ...mockPolicy,
        previousVersions: [
          { version: 1, regoCode: 'package old', title: 'Old title', updatedAt: new Date() },
        ],
      });

      const result = await complianceAsCodeService.rollbackPolicy('policy-1', orgId);
      expect(result).toBeDefined();
    });

    it('should throw when no previous versions exist', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce({
        ...mockPolicy,
        previousVersions: [],
      });

      await expect(
        complianceAsCodeService.rollbackPolicy('policy-1', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== deletePolicy =====================
  describe('deletePolicy', () => {
    it('should delete a policy', async () => {
      await expect(
        complianceAsCodeService.deletePolicy('policy-1', orgId)
      ).resolves.not.toThrow();

      expect(prismaMock.compliancePolicy.delete).toHaveBeenCalled();
    });

    it('should throw when policy not found', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        complianceAsCodeService.deletePolicy('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== detectDrift =====================
  describe('detectDrift', () => {
    it('should detect policy drift', async () => {
      const result = await complianceAsCodeService.detectDrift('policy-1', orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== testPolicy =====================
  describe('testPolicy', () => {
    it('should test a policy with test cases', async () => {
      const result = await complianceAsCodeService.testPolicy('policy-1', orgId, [
        { input: { encrypted: true }, expectedResult: true },
        { input: { encrypted: false }, expectedResult: false },
      ]);

      expect(result).toBeDefined();
    });
  });

  // ===================== benchmarkPolicy =====================
  describe('benchmarkPolicy', () => {
    it('should benchmark a policy', async () => {
      const result = await complianceAsCodeService.benchmarkPolicy('policy-1', orgId, 10);
      expect(result).toBeDefined();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle database error in createPolicy', async () => {
      (prismaMock.compliancePolicy.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);
      (prismaMock.compliancePolicy.create as jest.Mock<any>).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        complianceAsCodeService.createPolicy(orgId, {
          name: 'test',
          title: 'Test',
          regoCode: 'package test',
        }, userId)
      ).rejects.toThrow();
    });
  });
});
