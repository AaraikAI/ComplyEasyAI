/**
 * SOX Service Contract Tests
 *
 * Verifies the contract for SOX compliance including control CRUD,
 * test results, and assessment management.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockSOXControl } from '../../mocks/prisma';

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

import soxService from '../../../services/soxService';

describe('SOXService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createSOXControl
  // ---------------------------------------------------------------------------
  describe('createSOXControl', () => {
    it('should call prisma.sOXControl.create with correct shape', async () => {
      prismaMock.sOXControl.create.mockResolvedValue(createMockSOXControl());

      await soxService.createSOXControl({
        organizationId: 'org-123',
        title: 'Access Management',
        description: 'User access provisioning and deprovisioning',
        category: 'ITGC',
        processArea: 'ITOperations',
        frequency: 'Quarterly',
        controlType: 'Preventive',
        owner: 'user-1',
      });

      expect(prismaMock.sOXControl.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          title: 'Access Management',
          description: 'User access provisioning and deprovisioning',
          category: 'ITGC',
          processArea: 'ITOperations',
          frequency: 'Quarterly',
          controlType: 'Preventive',
          owner: 'user-1',
          status: 'NotTested',
          keyControl: false,
          automationType: 'Manual',
        }),
      });
    });

    it('should default status to NotTested', async () => {
      prismaMock.sOXControl.create.mockResolvedValue(createMockSOXControl());

      await soxService.createSOXControl({
        organizationId: 'org-123',
        title: 'Test Control',
        description: 'Test',
        category: 'ITGC',
        processArea: 'ITOperations',
        frequency: 'Monthly',
        controlType: 'Detective',
        owner: 'user-1',
      });

      expect(prismaMock.sOXControl.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'NotTested',
        }),
      });
    });

    it('should default keyControl to false', async () => {
      prismaMock.sOXControl.create.mockResolvedValue(createMockSOXControl());

      await soxService.createSOXControl({
        organizationId: 'org-123',
        title: 'Control',
        description: 'Desc',
        category: 'ITGC',
        processArea: 'Payroll',
        frequency: 'Annual',
        controlType: 'Preventive',
        owner: 'user-1',
      });

      expect(prismaMock.sOXControl.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          keyControl: false,
        }),
      });
    });

    it('should default automationType to Manual', async () => {
      prismaMock.sOXControl.create.mockResolvedValue(createMockSOXControl());

      await soxService.createSOXControl({
        organizationId: 'org-123',
        title: 'Control',
        description: 'Desc',
        category: 'ITGC',
        processArea: 'ITOperations',
        frequency: 'Daily',
        controlType: 'Detective',
        owner: 'user-1',
      });

      expect(prismaMock.sOXControl.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          automationType: 'Manual',
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.sOXControl.create.mockRejectedValue(new Error('Constraint failed'));

      await expect(
        soxService.createSOXControl({
          organizationId: 'org-123',
          title: 'Control',
          description: 'Desc',
          category: 'ITGC',
          processArea: 'ITOperations',
          frequency: 'Monthly',
          controlType: 'Preventive',
          owner: 'user-1',
        })
      ).rejects.toThrow('Constraint failed');
    });
  });

  // ---------------------------------------------------------------------------
  // getSOXControls
  // ---------------------------------------------------------------------------
  describe('getSOXControls', () => {
    it('should call prisma.sOXControl.findMany with org filter', async () => {
      prismaMock.sOXControl.findMany.mockResolvedValue([]);

      await soxService.getSOXControls('org-123');

      expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply category filter', async () => {
      prismaMock.sOXControl.findMany.mockResolvedValue([]);

      await soxService.getSOXControls('org-123', { category: 'EntityLevel' });

      expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: 'EntityLevel',
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply processArea filter', async () => {
      prismaMock.sOXControl.findMany.mockResolvedValue([]);

      await soxService.getSOXControls('org-123', { processArea: 'FinancialClose' });

      expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          processArea: 'FinancialClose',
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getSOXControlById
  // ---------------------------------------------------------------------------
  describe('getSOXControlById', () => {
    it('should call prisma.sOXControl.findFirst with id and org filter', async () => {
      prismaMock.sOXControl.findFirst.mockResolvedValue(createMockSOXControl());

      await soxService.getSOXControlById('sox-control-123', 'org-123');

      expect(prismaMock.sOXControl.findFirst).toHaveBeenCalledWith({
        where: { id: 'sox-control-123', organizationId: 'org-123' },
      });
    });

    it('should return null when control is not found', async () => {
      prismaMock.sOXControl.findFirst.mockResolvedValue(null);

      const result = await soxService.getSOXControlById('nonexistent', 'org-123');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updateSOXControl
  // ---------------------------------------------------------------------------
  describe('updateSOXControl', () => {
    it('should verify control existence before updating', async () => {
      prismaMock.sOXControl.findFirst.mockResolvedValue(createMockSOXControl());
      prismaMock.sOXControl.update.mockResolvedValue(
        createMockSOXControl({ status: 'Effective' })
      );

      await soxService.updateSOXControl('sox-control-123', 'user-1', 'org-123', {
        status: 'Effective',
      });

      expect(prismaMock.sOXControl.findFirst).toHaveBeenCalled();
      expect(prismaMock.sOXControl.update).toHaveBeenCalled();
    });

    it('should return null if control does not exist', async () => {
      prismaMock.sOXControl.findFirst.mockResolvedValue(null);

      const result = await soxService.updateSOXControl(
        'nonexistent',
        'user-1',
        'org-123',
        { status: 'Effective' }
      );

      expect(result).toBeNull();
      expect(prismaMock.sOXControl.update).not.toHaveBeenCalled();
    });
  });
});
