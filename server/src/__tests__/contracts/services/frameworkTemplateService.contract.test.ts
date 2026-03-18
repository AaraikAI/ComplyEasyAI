/**
 * Framework Template Service Contract Tests
 *
 * Verifies the contract between the service layer and Prisma ORM for
 * framework template retrieval, template application, and control mappings.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockFramework, createMockControl } from '../../mocks/prisma';

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

import frameworkTemplateService from '../../../services/frameworkTemplateService';

describe('FrameworkTemplateService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getTemplatesForFramework
  // ---------------------------------------------------------------------------
  describe('getTemplatesForFramework', () => {
    it('should return controls for a known framework', () => {
      const controls = frameworkTemplateService.getTemplatesForFramework('SOC 2 Type II');

      expect(Array.isArray(controls)).toBe(true);
      expect(controls.length).toBeGreaterThan(0);
    });

    it('should return empty array for an unknown framework', () => {
      const controls = frameworkTemplateService.getTemplatesForFramework('NonexistentFramework_xyz');

      expect(Array.isArray(controls)).toBe(true);
      expect(controls).toHaveLength(0);
    });

    it('should return controls with expected template shape', () => {
      const controls = frameworkTemplateService.getTemplatesForFramework('SOC 2 Type II');

      if (controls.length > 0) {
        const first = controls[0];
        expect(first).toHaveProperty('name');
        expect(typeof first.name).toBe('string');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // applyTemplateToFramework
  // ---------------------------------------------------------------------------
  describe('applyTemplateToFramework', () => {
    it('should verify framework ownership before applying', async () => {
      const mockFramework = {
        ...createMockFramework({ id: 'fw-1', name: 'SOC 2 Type II' }),
        controls: [],
      };
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.create.mockResolvedValue(createMockControl());
      prismaMock.frameworkControl.createMany.mockResolvedValue({ count: 1 });
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);
      prismaMock.frameworkControl.findMany.mockResolvedValue([]);

      await frameworkTemplateService.applyTemplateToFramework(
        'org-123',
        'fw-1',
        'SOC 2 Type II'
      );

      expect(prismaMock.complianceFramework.findFirst).toHaveBeenCalledWith({
        where: { id: 'fw-1', organizationId: 'org-123' },
        include: { controls: { select: { name: true } } },
      });
    });

    it('should throw when framework is not found', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      await expect(
        frameworkTemplateService.applyTemplateToFramework('org-123', 'nonexistent', 'SOC 2 Type II')
      ).rejects.toThrow(/Framework not found/);
    });

    it('should return applied and skipped counts', async () => {
      const mockFramework = {
        ...createMockFramework({ id: 'fw-1' }),
        controls: [],
      };
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.create.mockResolvedValue(createMockControl());
      prismaMock.frameworkControl.createMany.mockResolvedValue({ count: 1 });
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);
      prismaMock.frameworkControl.findMany.mockResolvedValue([]);

      const result = await frameworkTemplateService.applyTemplateToFramework(
        'org-123',
        'fw-1',
        'SOC 2 Type II'
      );

      expect(result).toHaveProperty('applied');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('total');
      expect(typeof result.applied).toBe('number');
    });

    it('should return zero counts for unknown framework type', async () => {
      const result = await frameworkTemplateService.applyTemplateToFramework(
        'org-123',
        'fw-1',
        'TotallyFakeFramework_999'
      );

      expect(result).toEqual({ applied: 0, skipped: 0, total: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // regenerateControlMappings
  // ---------------------------------------------------------------------------
  describe('regenerateControlMappings', () => {
    it('should call prisma to find framework and its controls', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(
        createMockFramework({ id: 'fw-1', name: 'SOC 2 Type II' })
      );
      prismaMock.frameworkControl.findMany.mockResolvedValue([
        createMockControl({ id: 'ctrl-1' }),
      ]);
      (prismaMock as any).controlMapping = { deleteMany: jest.fn() as any };
      (prismaMock as any).controlMapping.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);

      await frameworkTemplateService.regenerateControlMappings('org-123', 'fw-1');

      expect(prismaMock.complianceFramework.findFirst).toHaveBeenCalledWith({
        where: { id: 'fw-1', organizationId: 'org-123' },
      });
    });

    it('should throw when framework is not found', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      await expect(
        frameworkTemplateService.regenerateControlMappings('org-123', 'nonexistent')
      ).rejects.toThrow('Framework not found');
    });
  });
});
