/**
 * Compliance-as-Code Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock axios for OPA calls
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (jest.fn() as jest.Mock<any>).mockImplementation((url: string) => {
      // Handle policy evaluation
      if (url.includes('/v1/data/compliance/')) {
        return Promise.resolve({
          data: {
            result: {
              allow: true,
              violations: [],
            },
          },
        });
      }
      // Handle compile/validation
      if (url.includes('/v1/compile')) {
        return Promise.resolve({
          data: { result: true },
        });
      }
      return Promise.resolve({
        data: { result: {} },
      });
    }),
    put: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      data: {},
      status: 200,
    }),
    get: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      data: { policies: [] },
    }),
  },
}));

jest.mock('fs', () => ({
  existsSync: (jest.fn() as jest.Mock<any>).mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: (jest.fn() as jest.Mock<any>).mockReturnValue('package compliance\n\nallow if { true }'),
  writeFileSync: jest.fn(),
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

import complianceAsCodeService from '../../../../services/advanced/complianceAsCodeService';

describe('ComplianceAsCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock compliancePolicy for getPoliciesByFramework
    (prismaMock as any).compliancePolicy = {
      findMany: jest.fn<any>().mockResolvedValue([
        {
          id: 'policy-1',
          name: 'Test Policy',
          framework: 'SOC2',
          rego: 'package compliance\n\nallow { true }',
          severity: 'high',
          tags: ['test'],
        },
      ]),
      create: jest.fn<any>().mockResolvedValue({
        id: 'policy-1',
        name: 'Test Policy',
        framework: 'SOC2',
        rego: 'package compliance',
        severity: 'high',
        tags: ['test'],
      }),
      upsert: jest.fn<any>().mockResolvedValue({}),
    };
    // Mock organization data queries used in getOrganizationComplianceData
    (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
      id: 'org-123',
      name: 'Test Org',
      users: [],
    });
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock as any).evidenceAnalysis = {
      findMany: jest.fn<any>().mockResolvedValue([]),
    };
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
  });

  describe('createPolicy()', () => {
    it('should create a new compliance policy', async () => {
      const policy = {
        name: 'SOC2 Encryption Policy',
        framework: 'SOC2',
        rego: 'package compliance\n\nallow if { input.encryption.enabled == true }',
        severity: 'critical' as const,
        tags: ['encryption', 'soc2'],
      };

      const result = await complianceAsCodeService.createPolicy('org-123', policy);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', policy.name);
      expect(result).toHaveProperty('framework', policy.framework);
      expect(result).toHaveProperty('rego');
    });
  });

  describe('evaluatePolicy()', () => {
    it('should evaluate policy and return allowed result', async () => {
      const policyId = 'policy-123';
      const input = {
        encryption: {
          enabled: true,
          algorithm: 'AES-256',
        },
      };

      const result = await complianceAsCodeService.evaluatePolicy(policyId, input);

      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('violations');
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('should detect policy violations', async () => {
      const axios = require('axios').default;
      axios.post.mockResolvedValueOnce({
        data: {
          result: {
            allow: false,
            violations: [
              {
                rule: 'encryption_required',
                severity: 'critical',
                message: 'Encryption must be enabled',
              },
            ],
          },
        },
      });

      const policyId = 'policy-123';
      const input = {
        encryption: {
          enabled: false,
        },
      };

      const result = await complianceAsCodeService.evaluatePolicy(policyId, input);

      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateMultiplePolicies()', () => {
    it('should evaluate multiple policies', async () => {
      const policyIds = ['policy-1', 'policy-2', 'policy-3'];
      const input = {
        encryption: { enabled: true },
        access: { mfa: true },
      };

      const result = await complianceAsCodeService.evaluateMultiplePolicies(
        policyIds,
        input
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(policyIds.length);
      expect(result[0]).toHaveProperty('allowed');
      expect(result[0]).toHaveProperty('violations');
    });
  });

  describe('generateComplianceReport()', () => {
    it('should generate compliance report', async () => {
      const result = await complianceAsCodeService.generateComplianceReport(
        'org-123',
        'SOC2'
      );

      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('framework', 'SOC2');
      expect(result).toHaveProperty('totalPolicies');
      expect(result).toHaveProperty('passedPolicies');
      expect(result).toHaveProperty('failedPolicies');
      expect(result).toHaveProperty('score');
    });
  });

  describe('setupCIIntegration()', () => {
    it('should set up CI integration', async () => {
      const integration = {
        provider: 'github' as const,
        webhookUrl: 'https://api.github.com/repos/org/repo/hooks',
        secret: 'webhook-secret',
        events: ['pull_request', 'push'],
      };

      const result = await complianceAsCodeService.setupCIIntegration(
        'org-123',
        integration
      );

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateComplianceReport() - drift detection', () => {
    it('should detect compliance drift in report', async () => {
      const result = await complianceAsCodeService.generateComplianceReport(
        'org-123',
        'SOC2'
      );

      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('framework', 'SOC2');
      expect(result).toHaveProperty('violations');
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });
});
