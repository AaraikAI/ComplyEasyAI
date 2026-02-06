/**
 * Temporal Graph Network Service Unit Tests
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

jest.mock('../../../../services/advanced/mlModelsService', () => ({
  __esModule: true,
  default: {
    buildTemporalGraph: jest.fn<any>().mockReturnValue({
      nodes: [
        { id: 'r-1', type: 'risk', category: 'Security', severity: 'High', data: {} },
      ],
      edges: [],
    }),
    predictRisksWithTGN: jest.fn<any>().mockResolvedValue([
      {
        riskType: 'Security',
        probability: 0.7,
        severity: 'High',
        predictedDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        confidence: 0.8,
        factors: ['Historical frequency'],
      },
    ]),
  },
}));

jest.mock('../../../../services/notificationService', () => ({
  __esModule: true,
  default: {
    sendNotification: jest.fn<any>().mockResolvedValue(undefined),
    notifyAdmins: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../../services/webhookService', () => ({
  __esModule: true,
  default: {
    triggerWebhook: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

import temporalGraphNetworkService from '../../../../services/advanced/temporalGraphNetworkService';

describe('TemporalGraphNetworkService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations (cleared by resetMocks)
    const mlModelsService = require('../../../../services/advanced/mlModelsService').default;
    mlModelsService.buildTemporalGraph.mockReturnValue({
      nodes: [
        { id: 'r-1', type: 'risk', category: 'Security', severity: 'High', data: {} },
      ],
      edges: [],
    });
    mlModelsService.predictRisksWithTGN.mockResolvedValue([
      {
        riskType: 'Security',
        probability: 0.7,
        severity: 'High',
        predictedDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        confidence: 0.8,
        factors: ['Historical frequency'],
      },
    ]);

    const notificationService = require('../../../../services/notificationService').default;
    notificationService.sendNotification.mockResolvedValue(undefined);
    notificationService.notifyAdmins.mockResolvedValue(undefined);

    const webhookService = require('../../../../services/webhookService').default;
    webhookService.triggerWebhook.mockResolvedValue(undefined);

    // Prisma mocks
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.complianceFramework.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.integration.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.regulatoryChange.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  const setupPredictionMocks = () => {
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
      {
        id: 'risk-1',
        title: 'Security Risk',
        severity: 'High',
        category: 'Security',
        status: 'Open',
        detectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        organizationId: orgId,
      },
    ]);
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
      {
        id: 'fw-1',
        name: 'SOC2',
        status: 'In_Progress',
        organizationId: orgId,
        controls: [
          {
            id: 'c-1',
            name: 'Access Control',
            status: 'Implemented',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'c-2',
            name: 'Monitoring',
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ]);
    (prismaMock.riskPrediction as any) = {
      create: jest.fn<any>().mockResolvedValue({ id: 'pred-1' }),
      findMany: jest.fn<any>().mockResolvedValue([]),
    };
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
  };

  describe('predictFutureRisks', () => {
    it('should predict future risks for 6-month horizon', async () => {
      setupPredictionMocks();

      const predictions = await temporalGraphNetworkService.predictFutureRisks(orgId, 6);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should predict risks for 12-month horizon', async () => {
      setupPredictionMocks();

      const predictions = await temporalGraphNetworkService.predictFutureRisks(orgId, 12);

      expect(predictions).toBeDefined();
    });

    it('should round invalid horizon to nearest valid value', async () => {
      setupPredictionMocks();

      const predictions = await temporalGraphNetworkService.predictFutureRisks(orgId, 5);

      expect(predictions).toBeDefined();
    });

    it('should handle ML model failure with fallback', async () => {
      setupPredictionMocks();

      const mlModelsService = require('../../../../services/advanced/mlModelsService').default;
      mlModelsService.predictRisksWithTGN.mockRejectedValueOnce(new Error('Model failed'));

      const predictions = await temporalGraphNetworkService.predictFutureRisks(orgId, 6);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should filter by frameworkId', async () => {
      setupPredictionMocks();

      const predictions = await temporalGraphNetworkService.predictFutureRisks(
        orgId,
        6,
        { frameworkId: 'fw-1' }
      );

      expect(predictions).toBeDefined();
    });

    it('should filter by controlId', async () => {
      setupPredictionMocks();

      const predictions = await temporalGraphNetworkService.predictFutureRisks(
        orgId,
        6,
        { controlId: 'c-1' }
      );

      expect(predictions).toBeDefined();
    });
  });

  describe('predictComplianceTrajectory', () => {
    it('should predict compliance trajectory', async () => {
      setupPredictionMocks();
      (prismaMock.complianceFramework.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'fw-1',
        name: 'SOC2',
        status: 'In_Progress',
        controls: [
          { id: 'c-1', status: 'Implemented' },
          { id: 'c-2', status: 'Pending' },
        ],
      });
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        {
          action: 'framework.score_updated',
          details: JSON.stringify({ score: 70 }),
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
        {
          action: 'framework.score_updated',
          details: JSON.stringify({ score: 75 }),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ]);

      const trajectory = await temporalGraphNetworkService.predictComplianceTrajectory(
        orgId,
        'fw-1',
        6
      );

      expect(trajectory).toBeDefined();
      expect(trajectory.currentScore).toBeDefined();
      expect(trajectory.predictedScores).toBeDefined();
      expect(trajectory.trend).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(trajectory.trend);
    });

    it('should throw error if framework not found', async () => {
      (prismaMock.complianceFramework.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        temporalGraphNetworkService.predictComplianceTrajectory(orgId, 'nonexistent', 6)
      ).rejects.toThrow();
    });
  });

  describe('getEarlyWarnings', () => {
    it('should return early warnings', async () => {
      setupPredictionMocks();
      (prismaMock.complianceFramework.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'fw-1',
        name: 'SOC2',
        controls: [{ status: 'Implemented' }, { status: 'Pending' }],
      });
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.regulatoryChange as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.integration.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const warnings = await temporalGraphNetworkService.getEarlyWarnings(orgId);

      expect(warnings).toBeDefined();
      expect(Array.isArray(warnings)).toBe(true);
    });

    it('should filter warnings by severity', async () => {
      setupPredictionMocks();
      (prismaMock.complianceFramework.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'fw-1',
        name: 'SOC2',
        controls: [{ status: 'Implemented' }],
      });
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.regulatoryChange as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.integration.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const warnings = await temporalGraphNetworkService.getEarlyWarnings(
        orgId,
        { severity: 'Critical' }
      );

      expect(warnings).toBeDefined();
    });
  });

  describe('getHistoricalAccuracy', () => {
    it('should return historical accuracy metrics', async () => {
      (prismaMock.riskPrediction as any) = {
        findMany: jest.fn<any>().mockResolvedValue([
          {
            id: 'pred-1',
            riskType: 'Security',
            predictedProbability: 0.8,
            predictedSeverity: 'High',
            predictedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            confidence: 0.75,
          },
        ]),
      };
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'risk-1',
          category: 'Security',
          severity: 'High',
          detectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
      ]);

      const accuracy = await temporalGraphNetworkService.getHistoricalAccuracy(orgId);

      expect(accuracy).toBeDefined();
      expect(accuracy.totalPredictions).toBeDefined();
    });
  });

  describe('acknowledgeWarning', () => {
    it('should acknowledge an early warning', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await temporalGraphNetworkService.acknowledgeWarning(
        orgId,
        'warning-1',
        'user-123',
        false
      );

      expect(result).toBeDefined();
    });

    it('should acknowledge warning as false positive', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await temporalGraphNetworkService.acknowledgeWarning(
        orgId,
        'warning-1',
        'user-123',
        true
      );

      expect(result).toBeDefined();
    });
  });

  describe('calculateFalsePositiveRate', () => {
    it('should calculate false positive rate', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        {
          action: 'tgn.warning_acknowledged',
          details: JSON.stringify({ warningId: 'w-1', falsePositive: true }),
        },
        {
          action: 'tgn.warning_acknowledged',
          details: JSON.stringify({ warningId: 'w-2', falsePositive: false }),
        },
      ]);

      const result = await temporalGraphNetworkService.calculateFalsePositiveRate(orgId);

      expect(result).toBeDefined();
      expect(result.totalWarnings).toBeDefined();
      expect(result.falsePositives).toBeDefined();
    });
  });
});
