/**
 * Compliance-as-Code Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Mock axios for OPA calls
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    data: {
      result: {
        allowed: true,
        violations: [],
      },
    },
  }),
  get: jest.fn().mockResolvedValue({
    data: { policies: [] },
  }),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('package compliance\n\nallow { true }'),
  writeFileSync: jest.fn(),
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import complianceAsCodeService from '../../../../services/advanced/complianceAsCodeService';

describe('ComplianceAsCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPolicy()', () => {
    it('should create a new compliance policy', async () => {
      const policy = {
        name: 'SOC2 Encryption Policy',
        framework: 'SOC2',
        rego: 'package compliance\n\nallow { input.encryption.enabled == true }',
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
      const axios = require('axios');
      axios.post.mockResolvedValueOnce({
        data: {
          result: {
            allowed: false,
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

      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBe(policyIds.length);
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

  describe('integrateWithCI()', () => {
    it('should set up CI integration', async () => {
      const integration = {
        provider: 'github' as const,
        webhookUrl: 'https://api.github.com/repos/org/repo/hooks',
        secret: 'webhook-secret',
        events: ['pull_request', 'push'],
      };

      const result = await complianceAsCodeService.integrateWithCI(
        'org-123',
        integration
      );

      expect(result).toHaveProperty('integrationId');
      expect(result).toHaveProperty('provider', 'github');
    });
  });

  describe('detectDrift()', () => {
    it('should detect compliance drift', async () => {
      const result = await complianceAsCodeService.detectDrift('org-123', 'SOC2');

      expect(result).toHaveProperty('driftDetected');
      expect(result).toHaveProperty('violations');
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });
});

