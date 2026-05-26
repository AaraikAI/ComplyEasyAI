/**
 * Monitoring Service Contract Tests
 *
 * Verifies the contract for continuous monitor CRUD, execution,
 * result recording, and issue creation from failures.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../../services/geminiService', () => ({
  __esModule: true,
  default: { generateContent: jest.fn().mockResolvedValue('AI analysis result') },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import monitoringService from '../../../services/monitoringService';

describe('MonitoringService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createMonitor
  // ---------------------------------------------------------------------------
  describe('createMonitor', () => {
    it('should call prisma.continuousMonitor.create with correct shape', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        organizationId: 'org-123',
        name: 'SSL Certificate Check',
        monitorType: 'Security',
        status: 'Unknown',
        active: true,
      };
      prismaMock.continuousMonitor.create.mockResolvedValue(mockMonitor);

      await monitoringService.createMonitor({
        organizationId: 'org-123',
        name: 'SSL Certificate Check',
        monitorType: 'Security',
        configuration: { endpoint: 'https://api.example.com' },
        userId: 'user-1',
      });

      expect(prismaMock.continuousMonitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'SSL Certificate Check',
          monitorType: 'Security',
          configuration: { endpoint: 'https://api.example.com' },
          status: 'Unknown',
          active: true,
          frequency: 'Daily',
        }),
      });
    });

    it('should default frequency to Daily when not provided', async () => {
      prismaMock.continuousMonitor.create.mockResolvedValue({ id: 'monitor-1' });

      await monitoringService.createMonitor({
        organizationId: 'org-123',
        name: 'Test Monitor',
        monitorType: 'Compliance',
        configuration: {},
        userId: 'user-1',
      });

      expect(prismaMock.continuousMonitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          frequency: 'Daily',
        }),
      });
    });

    it('should use custom frequency when provided', async () => {
      prismaMock.continuousMonitor.create.mockResolvedValue({ id: 'monitor-1' });

      await monitoringService.createMonitor({
        organizationId: 'org-123',
        name: 'Hourly Check',
        monitorType: 'Infrastructure',
        configuration: {},
        frequency: 'Hourly',
        userId: 'user-1',
      });

      expect(prismaMock.continuousMonitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          frequency: 'Hourly',
        }),
      });
    });

    it('should default status to Unknown and active to true', async () => {
      prismaMock.continuousMonitor.create.mockResolvedValue({ id: 'monitor-1' });

      await monitoringService.createMonitor({
        organizationId: 'org-123',
        name: 'Monitor',
        monitorType: 'Security',
        configuration: {},
        userId: 'user-1',
      });

      expect(prismaMock.continuousMonitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'Unknown',
          active: true,
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.continuousMonitor.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        monitoringService.createMonitor({
          organizationId: 'org-123',
          name: 'Monitor',
          monitorType: 'Security',
          configuration: {},
          userId: 'user-1',
        })
      ).rejects.toThrow('Database error');
    });
  });

  // ---------------------------------------------------------------------------
  // executeMonitor
  // ---------------------------------------------------------------------------
  describe('executeMonitor', () => {
    it('should find monitor first then record results', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        organizationId: 'org-123',
        name: 'SSL Check',
        monitorType: 'Security',
        configuration: {},
        frequency: 'Daily',
        status: 'Passing',
        active: true,
      };
      // Multi-tenant pre-check: service now uses findFirst({ id, organizationId }).
      prismaMock.continuousMonitor.findFirst.mockResolvedValue(mockMonitor);
      prismaMock.monitorResult.create.mockResolvedValue({ id: 'result-1' });
      prismaMock.continuousMonitor.update.mockResolvedValue(mockMonitor);

      await monitoringService.executeMonitor('monitor-1', 'user-1', 'org-123');

      expect(prismaMock.continuousMonitor.findFirst).toHaveBeenCalledWith({
        where: { id: 'monitor-1', organizationId: 'org-123' },
      });
      expect(prismaMock.monitorResult.create).toHaveBeenCalled();
      expect(prismaMock.continuousMonitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'monitor-1' },
          data: expect.objectContaining({
            status: expect.any(String),
            lastRun: expect.any(Date),
          }),
        })
      );
    });

    it('should throw when monitor not found', async () => {
      prismaMock.continuousMonitor.findFirst.mockResolvedValue(null);

      await expect(
        monitoringService.executeMonitor('nonexistent', 'user-1', 'org-123')
      ).rejects.toThrow('Monitor not found');
    });

    it('should record monitor result with required fields', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        organizationId: 'org-123',
        name: 'Check',
        monitorType: 'Security',
        configuration: {},
        frequency: 'Daily',
        status: 'Unknown',
        active: true,
      };
      prismaMock.continuousMonitor.findFirst.mockResolvedValue(mockMonitor);
      prismaMock.monitorResult.create.mockResolvedValue({ id: 'result-1' });
      prismaMock.continuousMonitor.update.mockResolvedValue(mockMonitor);

      await monitoringService.executeMonitor('monitor-1', 'user-1', 'org-123');

      expect(prismaMock.monitorResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          monitorId: 'monitor-1',
          status: expect.any(String),
          passedTests: expect.any(Number),
          failedTests: expect.any(Number),
        }),
      });
    });
  });
});
