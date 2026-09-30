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
  // ======================================================================
  // AIUC-1 and India DPDPA (real control modules — not mocked above)
  // ======================================================================
  const requireComplete = (controls: any[]) => {
    const ids = controls.map(c => c.controlId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of controls) {
      expect(c.name).toBeTruthy();
      expect(c.description.length).toBeGreaterThan(40);
      expect(c.category).toBeTruthy();
      expect(c.implementationGuidance.length).toBeGreaterThan(40);
      expect(c.evidenceRequirements.length).toBeGreaterThanOrEqual(3);
      expect(c.testProcedures.length).toBeGreaterThanOrEqual(3);
    }
  };

  describe('AIUC-1 and India DPDPA templates', () => {
    it('registers AIUC-1 with complete controls across all six pillars', () => {
      const controls = frameworkTemplateService.getTemplatesForFramework('AIUC-1');
      expect(controls.length).toBeGreaterThanOrEqual(40);
      expect(controls[0].controlId).toBe('AIUC1-A.1');
      expect(new Set(controls.map(c => c.category))).toEqual(
        new Set(['Data and Privacy', 'Security', 'Safety', 'Reliability', 'Accountability', 'Society'])
      );
      requireComplete(controls);
    });

    it('maps AIUC-1 control ids one-to-one onto the published requirement ids (July 15 2026 release)', () => {
      // Verified against https://www.aiuc-1.com/evidence and the per-requirement pages on 2026-09-07.
      // 51 live requirements: A001-A008, B001-B010, C001-C012, D001-D004, E001-E017 less the two
      // retired ids (E007 merged into E004, E014 merged into E017), F001-F002.
      const range = (pillar: string, count: number, skip: number[] = []) =>
        Array.from({ length: count }, (_, i) => i + 1)
          .filter(n => !skip.includes(n))
          .map(n => `AIUC1-${pillar}.${n}`);
      const expected = [
        ...range('A', 8),
        ...range('B', 10),
        ...range('C', 12),
        ...range('D', 4),
        ...range('E', 17, [7, 14]),
        ...range('F', 2),
      ];
      const controls = frameworkTemplateService.getTemplatesForFramework('AIUC-1');
      expect(controls.map(c => c.controlId)).toEqual(expected);
      expect(controls).toHaveLength(51);

      // Mandatory/optional status as published: exactly these eight are optional for certification.
      const optional = controls.filter(c => c.description.startsWith('(Optional for certification)')).map(c => c.controlId);
      expect(optional).toEqual(['AIUC1-B.2', 'AIUC1-B.3', 'AIUC1-B.5', 'AIUC1-C.7', 'AIUC1-C.8', 'AIUC1-C.9', 'AIUC1-E.13', 'AIUC1-E.17']);

      // Names are the official requirement titles so controls can be matched to the standard.
      const byId = new Map(controls.map(c => [c.controlId, c.name]));
      expect(byId.get('AIUC1-A.8')).toBe('Prevent leakage of credentials and secrets');
      expect(byId.get('AIUC1-B.10')).toBe('Promote secure patterns in generated code');
      expect(byId.get('AIUC1-C.5')).toBe('Prevent agent-specific high risk outputs');
      expect(byId.get('AIUC1-E.4')).toBe('Assign accountability');
      expect(byId.get('AIUC1-F.2')).toBe('Prevent catastrophic misuse');
    });

    it('resolves AIUC-1 aliases', () => {
      for (const alias of ['AIUC1', 'AIUC 1', 'aiuc-1', 'AIUC', 'aiuc']) {
        expect(frameworkTemplateService.getTemplatesForFramework(alias)[0]?.controlId).toBe('AIUC1-A.1');
      }
    });

    it('registers India DPDPA (Act 2023) with complete controls', () => {
      const controls = frameworkTemplateService.getTemplatesForFramework('India DPDPA');
      expect(controls.length).toBeGreaterThanOrEqual(35);
      expect(controls[0].controlId).toBe('IN-DPDPA-1.1');
      requireComplete(controls);
    });

    it('keeps the old PDPB key and India phrasings resolving to India DPDPA', () => {
      for (const alias of ['PDPB', 'pdpb', 'PDPB India', 'India Privacy', 'DPDP Act', 'DPDPA India', 'Digital Personal Data Protection Act']) {
        expect(frameworkTemplateService.getTemplatesForFramework(alias)[0]?.controlId).toBe('IN-DPDPA-1.1');
      }
    });

    it('leaves the bare "DPDPA" key pointing at the Delaware act (existing customer frameworks depend on it)', () => {
      expect(frameworkTemplateService.getTemplatesForFramework('DPDPA')[0]?.controlId).toBe('DPDPA-CR-1');
    });
  });

  // ======================================================================
  // ISO 27017:2026 (real control module — not mocked above)
  // ======================================================================
  describe('ISO 27017:2026 template', () => {
    const range = (theme: number, count: number) =>
      Array.from({ length: count }, (_, i) => `ISO27017-2026-${theme}.${i + 1}`);
    const CLOUD_SPECIFIC = ['ISO27017-2026-5.38', 'ISO27017-2026-5.39', 'ISO27017-2026-8.35', 'ISO27017-2026-8.36'];
    const controls = () => frameworkTemplateService.getTemplatesForFramework('ISO 27017:2026');

    it('has one control per ISO/IEC 27002:2022 control plus the four cloud-specific controls, in standard order', () => {
      // 5.1-5.37 + 5.38/5.39, 6.1-6.8, 7.1-7.14, 8.1-8.34 + 8.35/8.36 (IEC webstore table of contents, 2026-09-27)
      expect(controls().map(c => c.controlId)).toEqual([...range(5, 39), ...range(6, 8), ...range(7, 14), ...range(8, 36)]);
      expect(controls()).toHaveLength(97);
    });

    it('has unique, colon-free ids and complete content for every control', () => {
      requireComplete(controls());
      for (const c of controls()) {
        // Stored names are "<controlId>: <name>"; the id is read back up to the first colon.
        expect(c.controlId).toMatch(/^[A-Za-z0-9.-]+$/);
        expect(c.status).toBe('Not Started');
        expect(c.evidenceRequirements.every(e => e.trim().length > 0)).toBe(true);
        expect(c.testProcedures.every(t => t.trim().length > 0)).toBe(true);
      }
    });

    it('gives guidance for both the cloud service customer and the cloud service provider', () => {
      for (const c of controls()) {
        expect(c.implementationGuidance.startsWith('Cloud service customer: ')).toBe(true);
        const [customer, provider] = c.implementationGuidance.slice('Cloud service customer: '.length).split(' Cloud service provider: ');
        expect(customer.length).toBeGreaterThan(20);
        expect(provider?.length).toBeGreaterThan(20);
      }
    });

    it('marks exactly the four cloud-specific controls', () => {
      const marked = controls().filter(c => c.description.startsWith('Cloud-specific control (ISO/IEC 27017:2026 addition).'));
      expect(marked.map(c => c.controlId)).toEqual(CLOUD_SPECIFIC);
    });

    it('groups controls under the four ISO/IEC 27002:2022 themes', () => {
      const categories = frameworkTemplateService.getTemplateCategories('ISO 27017:2026');
      expect(categories.map(c => [c.category, c.controlCount])).toEqual([
        ['Organizational Controls', 39],
        ['People Controls', 8],
        ['Physical Controls', 14],
        ['Technological Controls', 36],
      ]);
    });

    it('resolves the 2026 spellings to the 2026 template', () => {
      for (const alias of ['ISO 27017:2026', 'ISO/IEC 27017:2026', 'ISO27017:2026', 'ISO 27017 2026', 'iso 27017 2026', 'ISO 27017 (2026)', 'iso-27017-2026', 'ISO/IEC 27017 Edition 2']) {
        expect(frameworkTemplateService.getTemplatesForFramework(alias)[0]?.controlId).toBe('ISO27017-2026-5.1');
      }
    });

    it('keeps bare "ISO 27017" and the 2015 spellings on the withdrawn 2015 template (existing customer frameworks depend on it)', () => {
      for (const alias of ['ISO 27017', 'iso 27017', 'ISO27017', 'ISO 27017:2015', 'iso-27017', 'ISO/IEC 27017', 'ISO/IEC 27017:2015', 'ISO 27017:2015 (withdrawn)']) {
        const resolved = frameworkTemplateService.getTemplatesForFramework(alias);
        expect(resolved[0]?.controlId).toBe('ISO27017-5.1.1');
        expect(resolved.some(c => c.controlId.startsWith('ISO27017-2026-'))).toBe(false);
      }
    });

    it('lists both editions, with the 2015 edition labelled withdrawn', () => {
      const templates = frameworkTemplateService.getAvailableTemplates();
      const legacy = templates.find(t => t.frameworkType === 'ISO 27017');
      const current = templates.find(t => t.frameworkType === 'ISO 27017:2026');
      expect(legacy?.displayName).toBe('ISO 27017:2015 (withdrawn)');
      expect(legacy?.controlCount).toBe(44);
      expect(current?.displayName).toBe('ISO 27017:2026');
      expect(current?.controlCount).toBe(97);
      expect(current?.aliases).toContain('ISO/IEC 27017:2026');
      expect(legacy?.aliases).toContain('ISO/IEC 27017');
      expect(legacy?.aliases.some(a => a.includes('2026'))).toBe(false);
    });
  });

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

    it('should include each template\'s aliases so clients can match names the way the server does', () => {
      const result = frameworkTemplateService.getAvailableTemplates();

      const soc2 = result.find(t => t.frameworkType === 'SOC 2 Type II');
      expect(soc2?.aliases).toEqual(expect.arrayContaining(['SOC2', 'SOC 2', 'soc2']));
      expect(result.every(t => Array.isArray(t.aliases))).toBe(true);
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
