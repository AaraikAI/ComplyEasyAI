/**
 * Monitoring Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue({}),
  },
}));

import { MonitoringService } from '../../../services/monitoringService';

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    monitoringService = new MonitoringService();
  });

  describe('createMonitor()', () => {
    it('should create a new monitor', async () => {
      const monitorData = {
        organizationId: 'org-123',
        name: 'Infrastructure Monitor',
        monitorType: 'Infrastructure',
        configuration: { endpoint: 'https://api.example.com' },
        userId: 'user-123',
      };

      const mockMonitor = {
        id: 'monitor-123',
        ...monitorData,
        status: 'Unknown',
        active: true,
        frequency: 'Daily',
      };

      prismaMock.continuousMonitor.create.mockResolvedValue(mockMonitor as any);

      const result = await monitoringService.createMonitor(monitorData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', monitorData.name);
      expect(result).toHaveProperty('monitorType', monitorData.monitorType);
      expect(prismaMock.continuousMonitor.create).toHaveBeenCalled();
    });

    it('should set default frequency to Daily', async () => {
      const monitorData = {
        organizationId: 'org-123',
        name: 'Test Monitor',
        monitorType: 'Cloud',
        configuration: {},
        userId: 'user-123',
      };

      prismaMock.continuousMonitor.create.mockResolvedValue({} as any);

      await monitoringService.createMonitor(monitorData);

      expect(prismaMock.continuousMonitor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            frequency: 'Daily',
          }),
        })
      );
    });
  });

  describe('executeMonitor()', () => {
    it('should execute monitor and create result', async () => {
      const monitorId = 'monitor-123';
      const userId = 'user-123';
      const organizationId = 'org-123';

      const mockMonitor = {
        id: monitorId,
        monitorType: 'Infrastructure',
        frequency: 'Daily',
        configuration: {},
      };

      const mockResult = {
        id: 'result-123',
        monitorId,
        status: 'Passing',
        passedTests: 4,
        failedTests: 0,
      };

      prismaMock.continuousMonitor.findUnique.mockResolvedValue(mockMonitor as any);
      prismaMock.monitorResult.create.mockResolvedValue(mockResult as any);
      prismaMock.continuousMonitor.update.mockResolvedValue({} as any);

      const result = await monitoringService.executeMonitor(monitorId, userId, organizationId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(prismaMock.monitorResult.create).toHaveBeenCalled();
      expect(prismaMock.continuousMonitor.update).toHaveBeenCalled();
    });

    it('should throw error if monitor not found', async () => {
      prismaMock.continuousMonitor.findUnique.mockResolvedValue(null);

      await expect(
        monitoringService.executeMonitor('invalid-id', 'user-123', 'org-123')
      ).rejects.toThrow('Monitor not found');
    });

    it('should update monitor status after execution', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        monitorType: 'Cloud',
        frequency: 'Daily',
        configuration: {},
      };

      prismaMock.continuousMonitor.findUnique.mockResolvedValue(mockMonitor as any);
      prismaMock.monitorResult.create.mockResolvedValue({
        id: 'result-123',
        status: 'Passing',
      } as any);
      prismaMock.continuousMonitor.update.mockResolvedValue({} as any);

      await monitoringService.executeMonitor('monitor-123', 'user-123', 'org-123');

      expect(prismaMock.continuousMonitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'monitor-123' },
          data: expect.objectContaining({
            status: expect.any(String),
            lastRun: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('getMonitors()', () => {
    it('should get all monitors for organization', async () => {
      const organizationId = 'org-123';
      const mockMonitors = [
        { id: 'monitor-1', name: 'Monitor 1', active: true },
        { id: 'monitor-2', name: 'Monitor 2', active: true },
      ];

      prismaMock.continuousMonitor.findMany.mockResolvedValue(mockMonitors as any);

      const result = await monitoringService.getMonitors(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(prismaMock.continuousMonitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId },
        })
      );
    });

    it('should filter by active status', async () => {
      prismaMock.continuousMonitor.findMany.mockResolvedValue([] as any);

      await monitoringService.getMonitors('org-123', { active: true });

      expect(prismaMock.continuousMonitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
          }),
        })
      );
    });
  });

  describe('getMonitorResults()', () => {
    it('should get monitor results', async () => {
      const monitorId = 'monitor-123';
      const mockResults = [
        { id: 'result-1', status: 'Passing', passedTests: 4 },
        { id: 'result-2', status: 'Warning', passedTests: 3 },
      ];

      prismaMock.monitorResult.findMany.mockResolvedValue(mockResults as any);

      const result = await monitoringService.getMonitorResults(monitorId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should limit results when limit provided', async () => {
      prismaMock.monitorResult.findMany.mockResolvedValue([] as any);

      await monitoringService.getMonitorResults('monitor-123', { limit: 10 });

      expect(prismaMock.monitorResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });
});

