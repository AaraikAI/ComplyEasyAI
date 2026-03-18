/**
 * Framework Template Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockFramework } from '../../mocks/prisma';

// Mock the database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock all framework data imports with minimal control templates
const mockSOC2Controls = [
  { controlId: 'CC1.1', name: 'Control Environment', description: 'Desc', category: 'Common Criteria', implementationGuidance: 'Guide', evidenceRequirements: ['Ev'], testProcedures: ['Test'], status: 'Not Started' },
  { controlId: 'CC1.2', name: 'Board Oversight', description: 'Desc', category: 'Common Criteria', implementationGuidance: 'Guide', evidenceRequirements: ['Ev'], testProcedures: ['Test'], status: 'Not Started' },
];

const mockISO27001Controls = [
  { controlId: 'A.5.1', name: 'Policies', description: 'Info sec policies', category: 'Organizational', implementationGuidance: 'Guide', evidenceRequirements: ['Ev'], testProcedures: ['Test'] },
];

jest.mock('../../../data/frameworks/soc2Controls', () => ({
  SOC2_CONTROLS: mockSOC2Controls,
}));
jest.mock('../../../data/frameworks/iso27001Controls', () => ({
  ISO27001_CONTROLS: mockISO27001Controls,
}));
jest.mock('../../../data/frameworks/hipaaControls', () => ({ HIPAA_CONTROLS: [{ controlId: 'H1', name: 'HIPAA Control', description: 'D', category: 'Administrative' }] }));
jest.mock('../../../data/frameworks/gdprControls', () => ({ GDPR_CONTROLS: [{ controlId: 'G1', name: 'GDPR Control', description: 'D', category: 'Data Subject Rights' }] }));
jest.mock('../../../data/frameworks/pciDssControls', () => ({ PCI_DSS_CONTROLS: [{ controlId: 'P1', name: 'PCI Control', description: 'D', category: 'Network Security' }] }));
jest.mock('../../../data/frameworks/nist80053Controls', () => ({ NIST_800_53_CONTROLS: [{ controlId: 'N1', name: 'NIST Control', description: 'D', category: 'Access Control' }] }));
jest.mock('../../../data/frameworks/ccpaControls', () => ({ CCPA_CONTROLS: [{ controlId: 'C1', name: 'CCPA Control', description: 'D', category: 'Consumer Rights' }] }));
jest.mock('../../../data/frameworks/soxControls', () => ({ SOX_CONTROLS: [{ controlId: 'S1', name: 'SOX Control', description: 'D', category: 'ITGC' }] }));
jest.mock('../../../data/frameworks/nistCsfControls', () => ({ NIST_CSF_CONTROLS: [{ controlId: 'CSF1', name: 'CSF Control', description: 'D', category: 'Govern' }] }));
jest.mock('../../../data/frameworks/fedRampControls', () => ({ FEDRAMP_CONTROLS: [{ controlId: 'FR1', name: 'FedRAMP Control', description: 'D', category: 'Access Control' }] }));
jest.mock('../../../data/frameworks/cmmcControls', () => ({ CMMC_CONTROLS: [{ controlId: 'CM1', name: 'CMMC Control', description: 'D', category: 'Access Control' }] }));
jest.mock('../../../data/frameworks/hitrustControls', () => ({ HITRUST_CONTROLS: [{ controlId: 'HT1', name: 'HITRUST Control', description: 'D', category: 'Information Protection' }] }));
jest.mock('../../../data/frameworks/cisControls', () => ({ CIS_CONTROLS: [{ controlId: 'CIS1', name: 'CIS Control', description: 'D', category: 'Inventory' }] }));

// Import after mocking
import frameworkTemplateService from '../../../services/frameworkTemplateService';

// Also add createMany mock to frameworkControl
const createMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;
(prismaMock.frameworkControl as any).createMany = createMockFn();

describe('FrameworkTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================================
  // getTemplatesForFramework
  // ======================================================================
  describe('getTemplatesForFramework()', () => {
    it('should return controls for SOC 2 Type II', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('SOC 2 Type II');

      expect(result).toHaveLength(2);
      expect(result[0].controlId).toBe('CC1.1');
    });

    it('should resolve aliases (SOC2 -> SOC 2 Type II)', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('SOC2');

      expect(result).toHaveLength(2);
    });

    it('should resolve aliases case-insensitively', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('soc2');

      expect(result).toHaveLength(2);
    });

    it('should return ISO 27001 controls', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('ISO 27001');

      expect(result).toHaveLength(1);
      expect(result[0].controlId).toBe('A.5.1');
    });

    it('should return empty array for unknown framework', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('Unknown Framework');

      expect(result).toEqual([]);
    });

    it('should return controls for HIPAA', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('HIPAA');

      expect(result).toHaveLength(1);
    });

    it('should return controls for GDPR', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('GDPR');

      expect(result).toHaveLength(1);
    });

    it('should return controls for PCI DSS', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('PCI DSS');

      expect(result).toHaveLength(1);
    });

    it('should return controls for NIST 800-53', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('NIST 800-53');

      expect(result).toHaveLength(1);
    });

    it('should return controls for NIST CSF', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('NIST CSF');

      expect(result).toHaveLength(1);
    });

    it('should return controls for FedRAMP via alias', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('fedramp');

      expect(result).toHaveLength(1);
    });

    it('should return controls for CMMC', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('CMMC');

      expect(result).toHaveLength(1);
    });

    it('should return controls for HITRUST CSF', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('HITRUST CSF');

      expect(result).toHaveLength(1);
    });

    it('should return controls for CIS Controls', () => {
      const result = frameworkTemplateService.getTemplatesForFramework('CIS Controls');

      expect(result).toHaveLength(1);
    });
  });

  // ======================================================================
  // getAvailableTemplates
  // ======================================================================
  describe('getAvailableTemplates()', () => {
    it('should return all available templates with metadata', () => {
      const result = frameworkTemplateService.getAvailableTemplates();

      expect(result.length).toBeGreaterThanOrEqual(13); // At least 13 frameworks
      expect(result[0]).toHaveProperty('frameworkType');
      expect(result[0]).toHaveProperty('displayName');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('controlCount');
      expect(result[0]).toHaveProperty('categories');
    });

    it('should include correct control counts', () => {
      const result = frameworkTemplateService.getAvailableTemplates();

      const soc2 = result.find(t => t.frameworkType === 'SOC 2 Type II');
      expect(soc2?.controlCount).toBe(2);
    });

    it('should include unique categories', () => {
      const result = frameworkTemplateService.getAvailableTemplates();

      const soc2 = result.find(t => t.frameworkType === 'SOC 2 Type II');
      expect(soc2?.categories).toEqual(['Common Criteria']);
    });
  });

  // ======================================================================
  // getTemplateCategories
  // ======================================================================
  describe('getTemplateCategories()', () => {
    it('should return categories with control counts', () => {
      const result = frameworkTemplateService.getTemplateCategories('SOC 2 Type II');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Common Criteria');
      expect(result[0].controlCount).toBe(2);
      expect(result[0].controls).toHaveLength(2);
    });

    it('should return empty array for unknown framework', () => {
      const result = frameworkTemplateService.getTemplateCategories('Unknown');

      expect(result).toEqual([]);
    });
  });

  // ======================================================================
  // applyTemplateToFramework
  // ======================================================================
  describe('applyTemplateToFramework()', () => {
    it('should apply template controls to a framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(
        createMockFramework({ controls: [] }) as any
      );
      (prismaMock.frameworkControl as any).createMany.mockResolvedValue({ count: 2 });
      prismaMock.frameworkControl.findMany.mockResolvedValue([
        { status: 'Not Started' },
        { status: 'Not Started' },
      ] as any);
      prismaMock.complianceFramework.update.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await frameworkTemplateService.applyTemplateToFramework(
        'org-123', 'framework-123', 'SOC 2 Type II', 'user-123'
      );

      expect(result.applied).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.total).toBe(2);
      expect((prismaMock.frameworkControl as any).createMany).toHaveBeenCalledTimes(1);
    });

    it('should skip existing controls by name', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(
        createMockFramework({
          controls: [{ name: 'CC1.1: Control Environment' }],
        }) as any
      );
      (prismaMock.frameworkControl as any).createMany.mockResolvedValue({ count: 1 });
      prismaMock.frameworkControl.findMany.mockResolvedValue([
        { status: 'Not Started' },
      ] as any);
      prismaMock.complianceFramework.update.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await frameworkTemplateService.applyTemplateToFramework(
        'org-123', 'framework-123', 'SOC 2 Type II', 'user-123'
      );

      expect(result.skipped).toBe(1);
      expect(result.applied).toBe(1);
    });

    it('should return zeros for unknown framework', async () => {
      const result = await frameworkTemplateService.applyTemplateToFramework(
        'org-123', 'framework-123', 'Unknown Framework'
      );

      expect(result).toEqual({ applied: 0, skipped: 0, total: 0 });
    });

    it('should throw when framework not found', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      await expect(
        frameworkTemplateService.applyTemplateToFramework('org-123', 'bad-id', 'SOC 2 Type II')
      ).rejects.toThrow('Framework not found or does not belong to this organization');
    });

    it('should recalculate framework progress after applying', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(
        createMockFramework({ controls: [] }) as any
      );
      (prismaMock.frameworkControl as any).createMany.mockResolvedValue({ count: 2 });
      prismaMock.frameworkControl.findMany.mockResolvedValue([
        { status: 'Not Started' },
        { status: 'Compliant' },
      ] as any);
      (prismaMock as any).$executeRaw.mockResolvedValue(1);

      await frameworkTemplateService.applyTemplateToFramework(
        'org-123', 'framework-123', 'SOC 2 Type II'
      );

      // Service now uses $executeRaw to update progress
      expect((prismaMock as any).$executeRaw).toHaveBeenCalled();
    });

    it('should create audit log when userId provided', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(
        createMockFramework({ controls: [] }) as any
      );
      (prismaMock.frameworkControl as any).createMany.mockResolvedValue({ count: 2 });
      prismaMock.frameworkControl.findMany.mockResolvedValue([] as any);
      prismaMock.complianceFramework.update.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await frameworkTemplateService.applyTemplateToFramework(
        'org-123', 'framework-123', 'SOC 2 Type II', 'user-123'
      );

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should not create audit log when userId is not provided', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(
        createMockFramework({ controls: [] }) as any
      );
      (prismaMock.frameworkControl as any).createMany.mockResolvedValue({ count: 2 });
      prismaMock.frameworkControl.findMany.mockResolvedValue([] as any);
      prismaMock.complianceFramework.update.mockResolvedValue({} as any);

      await frameworkTemplateService.applyTemplateToFramework(
        'org-123', 'framework-123', 'SOC 2 Type II'
      );

      expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
    });
  });

  // ======================================================================
  // hasTemplate
  // ======================================================================
  describe('hasTemplate()', () => {
    it('should return true for known frameworks', () => {
      expect(frameworkTemplateService.hasTemplate('SOC 2 Type II')).toBe(true);
      expect(frameworkTemplateService.hasTemplate('ISO 27001')).toBe(true);
      expect(frameworkTemplateService.hasTemplate('HIPAA')).toBe(true);
      expect(frameworkTemplateService.hasTemplate('GDPR')).toBe(true);
    });

    it('should return true for aliases', () => {
      expect(frameworkTemplateService.hasTemplate('SOC2')).toBe(true);
      expect(frameworkTemplateService.hasTemplate('iso27001')).toBe(true);
      expect(frameworkTemplateService.hasTemplate('hipaa')).toBe(true);
    });

    it('should return false for unknown frameworks', () => {
      expect(frameworkTemplateService.hasTemplate('Unknown')).toBe(false);
      expect(frameworkTemplateService.hasTemplate('Random Framework')).toBe(false);
    });
  });

  // ======================================================================
  // getControlCount
  // ======================================================================
  describe('getControlCount()', () => {
    it('should return correct count for known frameworks', () => {
      expect(frameworkTemplateService.getControlCount('SOC 2 Type II')).toBe(2);
      expect(frameworkTemplateService.getControlCount('ISO 27001')).toBe(1);
    });

    it('should return 0 for unknown frameworks', () => {
      expect(frameworkTemplateService.getControlCount('Unknown')).toBe(0);
    });
  });
});
