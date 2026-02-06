/**
 * Red Team Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

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

import redTeamService from '../../../../services/advanced/redTeamService';

describe('RedTeamService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupCommonMocks = () => {
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
      {
        id: 'fw-1',
        name: 'SOC2',
        status: 'Compliant',
        organizationId: orgId,
        controls: [
          { id: 'c-1', name: 'Access Control', status: 'Implemented', evidence: 'doc.pdf' },
          { id: 'c-2', name: 'Encryption', status: 'Pending', evidence: null },
          { id: 'c-3', name: 'Monitoring', status: 'Implemented', evidence: null },
        ],
      },
    ]);
    (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'u-1', role: 'Admin', email: 'admin@test.com', twoFactorEnabled: true },
      { id: 'u-2', role: 'User', email: 'user@test.com', twoFactorEnabled: false },
    ]);
    (prismaMock.user.count as jest.Mock<any>).mockResolvedValue(2);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'p-1', title: 'Security Policy', category: 'Security' },
    ]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
  };

  describe('runRedTeamSimulation', () => {
    it('should run a control_bypass attack simulation', async () => {
      setupCommonMocks();

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Control Bypass Test',
          attackType: 'control_bypass',
          targetFramework: 'fw-1',
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.scenarioId).toBeDefined();
      expect(result.attackPath).toBeDefined();
      expect(Array.isArray(result.vulnerabilitiesFound)).toBe(true);
      expect(Array.isArray(result.remediationRecommendations)).toBe(true);
      expect(typeof result.executionTime).toBe('number');
    });

    it('should run an evidence_tampering attack simulation', async () => {
      setupCommonMocks();

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Evidence Tampering Test',
          attackType: 'evidence_tampering',
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.attackPath).toBeDefined();
    });

    it('should run a policy_violation attack simulation', async () => {
      setupCommonMocks();

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Policy Violation Test',
          attackType: 'policy_violation',
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.vulnerabilitiesFound).toBeDefined();
    });

    it('should run an access_escalation attack simulation', async () => {
      setupCommonMocks();

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Access Escalation Test',
          attackType: 'access_escalation',
        },
        userId
      );

      expect(result).toBeDefined();
    });

    it('should support multiple attackers', async () => {
      setupCommonMocks();

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Multi-attacker Test',
          attackType: 'control_bypass',
          multipleAttackers: true,
        },
        userId
      );

      expect(result).toBeDefined();
      if (result.attackers) {
        expect(result.attackers.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle timeout gracefully', async () => {
      setupCommonMocks();

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Timeout Test',
          attackType: 'control_bypass',
          timeLimit: 1, // 1ms - virtually impossible to complete
        },
        userId
      );

      expect(result).toBeDefined();
      // Even with timeout, should return a valid result
    });

    it('should run social_engineering simulation', async () => {
      setupCommonMocks();
      (prismaMock.personnel as any) = {
        findMany: jest.fn<any>().mockResolvedValue([
          { userId: 'u-1', securityTraining: false },
        ]),
      };

      const result = await redTeamService.runRedTeamSimulation(
        orgId,
        {
          name: 'Social Engineering Test',
          attackType: 'social_engineering',
        },
        userId
      );

      expect(result).toBeDefined();
    });
  });

  describe('runAutomatedScan', () => {
    it('should run automated security scan', async () => {
      setupCommonMocks();
      (prismaMock.personnel as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const result = await redTeamService.runAutomatedScan(orgId, userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect attack type scope', async () => {
      setupCommonMocks();

      const result = await redTeamService.runAutomatedScan(orgId, userId, {
        scope: { attackTypes: ['control_bypass', 'evidence_tampering'] },
      });

      expect(result).toBeDefined();
    });
  });

  describe('scanForComplianceGaps', () => {
    it('should identify compliance gaps', async () => {
      setupCommonMocks();

      const result = await redTeamService.scanForComplianceGaps(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('scanForMisconfigurations', () => {
    it('should detect misconfigurations', async () => {
      setupCommonMocks();

      const result = await redTeamService.scanForMisconfigurations(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('scanForPolicyViolations', () => {
    it('should detect policy violations', async () => {
      setupCommonMocks();

      const result = await redTeamService.scanForPolicyViolations(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('compareScanResults', () => {
    it('should compare baseline and current scan results', async () => {
      setupCommonMocks();
      (prismaMock.personnel as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const baseline = [
        {
          scenarioId: 'test-1',
          success: true,
          attackPath: ['step1'],
          vulnerabilitiesFound: [{ type: 'control_bypass', severity: 'High' as const, description: 'test', affectedControls: [] }],
          remediationRecommendations: ['Fix it'],
          executionTime: 100,
        },
      ];

      const current = [
        {
          scenarioId: 'test-1',
          success: false,
          attackPath: [],
          vulnerabilitiesFound: [],
          remediationRecommendations: [],
          executionTime: 50,
        },
      ];

      const result = await redTeamService.compareScanResults(baseline, current);

      expect(result).toBeDefined();
    });
  });

  describe('markFalsePositive', () => {
    it('should mark a vulnerability as false positive', async () => {
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'scan-log-1',
        details: JSON.stringify({
          vulnerabilitiesFound: [
            { type: 'control_bypass', severity: 'High', description: 'test', falsePositive: false },
          ],
        }),
      });
      (prismaMock.auditLog.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await redTeamService.markFalsePositive(
        orgId,
        'scan-log-1',
        0,
        userId
      );

      expect(result).toBeDefined();
    });
  });
});
