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
    delete: jest.fn<any>().mockResolvedValue({ data: {} }),
  },
}));

// existsSync returns true for the policies directory but false for the bundled
// `opa` binary path, so compileRego() takes the OPA HTTP API path (mocked axios)
// instead of spawning a real `opa check` process.
jest.mock('fs', () => ({
  existsSync: jest.fn<any>((p: string) =>
    typeof p === 'string' && p.includes(`${require('path').sep}bin${require('path').sep}opa`)
      ? false
      : true
  ),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn<any>().mockReturnValue('package main'),
  unlinkSync: jest.fn(),
  mkdtempSync: jest.fn<any>().mockReturnValue('/tmp/rego-test'),
  rmSync: jest.fn(),
}));

// In production OPA_ENDPOINT is a trusted internal host that passes the SSRF allowlist;
// the default test endpoint (http://localhost:8181) is blocked by isUrlSafe. Treat the
// configured OPA endpoint as safe here so these tests exercise the policy-evaluation flow
// rather than the SSRF guard (which has its own dedicated tests in urlValidator).
jest.mock('../../../../utils/urlValidator', () => ({
  __esModule: true,
  isUrlSafe: jest.fn().mockReturnValue(true),
  isWebhookUrlSafe: jest.fn().mockReturnValue(true),
  // Every OPA call now goes through safeAxios (URL + DNS validation, and each
  // redirect hop re-checked). Delegate to the axios mocks by method so the
  // per-test setup in beforeEach still drives the responses. Declared as a
  // plain function, not jest.fn(): resetMocks would wipe an implementation
  // attached at module load.
  safeAxios: (config: any) => {
    const axios = require('axios').default;
    const method = String(config?.method ?? 'get').toLowerCase();
    return axios[method](config?.url, config?.data, config);
  },
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
    framework: 'SOC2',
    rego: 'package complyeasy.data_protection\ndefault allow = false\nallow { input.encrypted == true }',
    severity: 'high',
    tags: ['data-protection'],
    version: 1,
    enabled: true,
    previousVersionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFramework = {
    id: 'fw-1',
    name: 'SOC 2',
    organizationId: orgId,
    status: 'In_Progress',
    progress: 50,
    nextAuditDate: new Date(),
    controls: [
      { id: 'c-1', name: 'CC1.1', status: 'Implemented', category: 'Security', evidenceRequired: true, evidenceVersions: [] },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // resetMocks:true clears the factory return value; re-arm the SSRF allowlist stub.
    const { isUrlSafe, isWebhookUrlSafe } = require('../../../../utils/urlValidator');
    isUrlSafe.mockReturnValue(true);
    isWebhookUrlSafe.mockReturnValue(true);

    const axios = require('axios').default;
    axios.post.mockResolvedValue({ data: { result: true } });
    axios.put.mockResolvedValue({ data: {} });
    axios.get.mockResolvedValue({ data: {} });
    axios.delete.mockResolvedValue({ data: {} });

    const fs = require('fs');
    const pathSep = require('path').sep;
    // Policies dir exists; the bundled opa binary does not (forces the OPA HTTP
    // validation path, which is exercised through the mocked axios above).
    fs.existsSync.mockImplementation((p: string) =>
      typeof p === 'string' && p.includes(`${pathSep}bin${pathSep}opa`) ? false : true
    );
    fs.unlinkSync.mockReturnValue(undefined);
    fs.mkdtempSync.mockReturnValue('/tmp/rego-test');
    fs.rmSync.mockReturnValue(undefined);

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
    (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
      id: orgId, name: 'Test Org', plan: 'Pro',
      users: [{ id: userId, email: 'test@example.com', role: 'admin', mfaEnabled: false, lastLoginAt: null, createdAt: new Date() }],
    });
    (prismaMock.evidenceAnalysis.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  // ===================== createPolicy =====================
  describe('createPolicy', () => {
    it('should create a new compliance policy', async () => {
      const result = await complianceAsCodeService.createPolicy(orgId, {
        name: 'data_protection',
        framework: 'SOC2',
        rego:
          'package complyeasy.data_protection\n' +
          'default allow = false\n' +
          'allow { input.encrypted == true }\n' +
          'violation[msg] { not input.encrypted; msg := "data must be encrypted" }',
        severity: 'high',
        tags: ['data-protection'],
      });

      expect(result).toBeDefined();
      expect(prismaMock.compliancePolicy.create).toHaveBeenCalled();

      // The submitted package header is rewritten to the policy's canonical
      // namespace (data.compliance.<id>) and the normalized Rego is persisted.
      const updateArg = (prismaMock.compliancePolicy.update as jest.Mock<any>).mock.calls[0][0] as any;
      expect(updateArg.where.id).toBe('policy-1');
      expect(updateArg.data.rego).toContain('package compliance["policy-1"]');
      expect(updateArg.data.rego).not.toContain('package complyeasy.data_protection');
    });

    it('should throw on duplicate policy name', async () => {
      (prismaMock.compliancePolicy.create as jest.Mock<any>).mockRejectedValueOnce(new Error('Unique constraint failed'));

      await expect(
        complianceAsCodeService.createPolicy(orgId, {
          name: 'data_protection',
          framework: 'SOC2',
          rego: 'package complyeasy.data_protection\ndefault allow = false',
          severity: 'high',
          tags: ['test'],
        })
      ).rejects.toThrow();
    });

    it('should validate rego syntax', async () => {
      const result = await complianceAsCodeService.createPolicy(orgId, {
        name: 'valid_policy',
        framework: 'SOC2',
        rego:
          'package complyeasy.valid\n' +
          'default allow = false\n' +
          'allow { input.ok }\n' +
          'violation[msg] { not input.ok; msg := "not ok" }',
        severity: 'medium',
        tags: ['valid'],
      });

      expect(result).toBeDefined();
    });

    it('should reject rego that violates the policy contract', async () => {
      // Missing the required deny-by-default rule, the allow rule, and the
      // violation rule -> validation must reject with a 400.
      await expect(
        complianceAsCodeService.createPolicy(orgId, {
          name: 'invalid_policy',
          framework: 'SOC2',
          rego: 'package complyeasy.invalid\n# no rules here',
          severity: 'low',
          tags: ['invalid'],
        })
      ).rejects.toThrow();

      // The provisional record created before validation must be removed.
      expect(prismaMock.compliancePolicy.delete).toHaveBeenCalled();
    });
  });

  // ===================== evaluatePolicy =====================
  describe('evaluatePolicy', () => {
    it('should evaluate a policy with input data', async () => {
      const result = await complianceAsCodeService.evaluatePolicy(
        'policy-1', { encrypted: true }
      );

      expect(result).toBeDefined();
    });

    it('should throw when policy not found', async () => {
      const axios = require('axios').default;
      axios.post.mockRejectedValueOnce(new Error('OPA unavailable'));

      // In production mode, OPA failure should propagate. Restore NODE_ENV in finally
      // so a failed assertion cannot leak the 'production' value into later suites.
      const priorNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(
          complianceAsCodeService.evaluatePolicy('nonexistent', {})
        ).rejects.toThrow();
      } finally {
        process.env.NODE_ENV = priorNodeEnv;
      }
    });

    it('should handle OPA evaluation failure gracefully', async () => {
      const axios = require('axios').default;
      axios.post.mockRejectedValueOnce(new Error('OPA unavailable'));

      const result = await complianceAsCodeService.evaluatePolicy(
        'policy-1', { encrypted: true }
      );

      expect(result).toBeDefined();
    });
  });

  // ===================== evaluateMultiplePolicies =====================
  describe('evaluateMultiplePolicies', () => {
    it('should evaluate multiple policies', async () => {
      const result = await complianceAsCodeService.evaluateMultiplePolicies(
        ['policy-1'], { encrypted: true }
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty policy list', async () => {
      const result = await complianceAsCodeService.evaluateMultiplePolicies(
        [], { encrypted: true }
      );

      expect(result).toBeDefined();
    });
  });

  // ===================== generateComplianceReport =====================
  describe('generateComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const result = await complianceAsCodeService.generateComplianceReport(orgId, 'SOC2');

      expect(result).toBeDefined();
    });

    it('should handle no policies', async () => {
      (prismaMock.compliancePolicy.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await complianceAsCodeService.generateComplianceReport(orgId, 'SOC2');
      expect(result).toBeDefined();
    });
  });

  // ===================== setupCIIntegration =====================
  describe('setupCIIntegration', () => {
    it('should setup CI integration', async () => {
      const result = await complianceAsCodeService.setupCIIntegration(orgId, {
        provider: 'github',
        webhookUrl: 'https://example.com/webhook',
        secret: 'test-secret',
        events: ['push'],
      });

      expect(result).toBeDefined();
    });

    it('should support different CI providers', async () => {
      for (const provider of ['github', 'gitlab', 'jenkins', 'circleci']) {
        const result = await complianceAsCodeService.setupCIIntegration(orgId, {
          provider: provider as any,
          webhookUrl: 'https://example.com/webhook',
          secret: 'test-secret',
          events: ['push'],
        });

        expect(result).toBeDefined();
      }
    });
  });

  // ===================== handleCIWebhook =====================
  describe('handleCIWebhook', () => {
    it('should handle CI webhook from GitHub', async () => {
      const crypto = require('crypto');
      const payload = { repository: { full_name: 'org/repo' }, commits: [] };
      process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
      const hmac = crypto.createHmac('sha256', 'test-secret');
      const sig = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;

      const result = await complianceAsCodeService.handleCIWebhook(
        'webhook-1', 'github', payload, sig
      );

      expect(result).toBeDefined();
      delete process.env.GITHUB_WEBHOOK_SECRET;
    });

    it('should handle missing integration', async () => {
      await expect(
        complianceAsCodeService.handleCIWebhook(
          'webhook-1', 'github', { repository: { full_name: 'org/repo' } }, 'invalid-sig'
        )
      ).rejects.toThrow();
    });
  });

  // ===================== getPoliciesByFramework =====================
  describe('getPoliciesByFramework', () => {
    it('should return policies for a framework', async () => {
      const result = await complianceAsCodeService.getPoliciesByFramework(orgId, 'SOC2');

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
        name: 'updated_policy',
        rego:
          'package complyeasy.updated\n' +
          'default allow = false\n' +
          'allow { input.ok }\n' +
          'violation[msg] { not input.ok; msg := "not ok" }',
      });

      expect(result).toBeDefined();
      expect(prismaMock.compliancePolicy.create).toHaveBeenCalled();
    });

    it('should throw when policy not found', async () => {
      (prismaMock.compliancePolicy.findUnique as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        complianceAsCodeService.updatePolicy('nonexistent', orgId, {
          name: 'Updated',
        })
      ).rejects.toThrow();
    });
  });

  // ===================== rollbackPolicy =====================
  describe('rollbackPolicy', () => {
    it('should rollback a policy to previous version', async () => {
      (prismaMock.compliancePolicy.findUnique as jest.Mock<any>).mockResolvedValueOnce({
        ...mockPolicy,
        previousVersion: {
          id: 'policy-0',
          organizationId: orgId,
          name: 'data_protection',
          framework: 'SOC2',
          rego: 'package complyeasy.old\ndefault allow = false',
          severity: 'high',
          tags: ['data-protection'],
          version: 1,
          enabled: true,
        },
      });

      const result = await complianceAsCodeService.rollbackPolicy('policy-1', orgId);
      expect(result).toBeDefined();
    });

    it('should throw when no previous versions exist', async () => {
      (prismaMock.compliancePolicy.findUnique as jest.Mock<any>).mockResolvedValueOnce({
        ...mockPolicy,
        previousVersion: null,
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

      expect(prismaMock.compliancePolicy.update).toHaveBeenCalled();
    });

    it('should throw when policy not found', async () => {
      (prismaMock.compliancePolicy.update as jest.Mock<any>).mockRejectedValueOnce(new Error('Not found'));

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
      (prismaMock.compliancePolicy.create as jest.Mock<any>).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        complianceAsCodeService.createPolicy(orgId, {
          name: 'test',
          framework: 'SOC2',
          rego: 'package test\ndefault allow = false',
          severity: 'low',
          tags: [],
        })
      ).rejects.toThrow();
    });
  });
});
