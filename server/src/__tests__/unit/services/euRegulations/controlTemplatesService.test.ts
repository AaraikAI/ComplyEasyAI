/**
 * EU Regulations Control Templates Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import controlTemplatesService, {
  EURegulationsControlTemplatesService,
} from '../../../../services/euRegulations/controlTemplatesService';
import type { ControlTemplate } from '../../../../services/euRegulations/controlTemplatesService';

describe('EURegulationsControlTemplatesService', () => {
  let service: EURegulationsControlTemplatesService;

  beforeEach(() => {
    service = new EURegulationsControlTemplatesService();
  });

  // ---------------------------------------------------------------
  // Default export (singleton)
  // ---------------------------------------------------------------
  describe('default export', () => {
    it('should export a singleton instance of EURegulationsControlTemplatesService', () => {
      expect(controlTemplatesService).toBeDefined();
      expect(controlTemplatesService).toBeInstanceOf(EURegulationsControlTemplatesService);
    });
  });

  // ---------------------------------------------------------------
  // getEUAIActControls()
  // ---------------------------------------------------------------
  describe('getEUAIActControls()', () => {
    let controls: ControlTemplate[];

    beforeEach(() => {
      controls = service.getEUAIActControls();
    });

    it('should return 20 EU AI Act controls', () => {
      expect(controls).toHaveLength(20);
    });

    it('should return controls with the required shape', () => {
      for (const ctrl of controls) {
        expect(ctrl).toHaveProperty('name');
        expect(ctrl).toHaveProperty('description');
        expect(ctrl).toHaveProperty('category');
        expect(ctrl).toHaveProperty('evidenceRequired');
        expect(ctrl).toHaveProperty('status');
      }
    });

    it('should have evidenceRequired set to true for all controls', () => {
      for (const ctrl of controls) {
        expect(ctrl.evidenceRequired).toBe(true);
      }
    });

    it('should have status set to Pending for all controls', () => {
      for (const ctrl of controls) {
        expect(ctrl.status).toBe('Pending');
      }
    });

    it('should include control names starting with AI-ACT- prefix', () => {
      for (const ctrl of controls) {
        expect(ctrl.name).toMatch(/^AI-ACT-\d{3}:/);
      }
    });

    it('should cover expected categories', () => {
      const categories = new Set(controls.map((c) => c.category));
      expect(categories).toContain('Risk Classification');
      expect(categories).toContain('Prohibited Practices');
      expect(categories).toContain('Registration');
      expect(categories).toContain('Risk Management');
      expect(categories).toContain('Data Governance');
      expect(categories).toContain('Documentation');
      expect(categories).toContain('Transparency');
      expect(categories).toContain('Human Oversight');
      expect(categories).toContain('Monitoring');
    });

    it('should have unique control names', () => {
      const names = controls.map((c) => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  // ---------------------------------------------------------------
  // getDMAControls()
  // ---------------------------------------------------------------
  describe('getDMAControls()', () => {
    let controls: ControlTemplate[];

    beforeEach(() => {
      controls = service.getDMAControls();
    });

    it('should return 20 DMA controls', () => {
      expect(controls).toHaveLength(20);
    });

    it('should return controls with the required shape', () => {
      for (const ctrl of controls) {
        expect(ctrl).toHaveProperty('name');
        expect(ctrl).toHaveProperty('description');
        expect(ctrl).toHaveProperty('category');
        expect(ctrl.evidenceRequired).toBe(true);
        expect(ctrl.status).toBe('Pending');
      }
    });

    it('should include control names starting with DMA- prefix', () => {
      for (const ctrl of controls) {
        expect(ctrl.name).toMatch(/^DMA-\d{3}:/);
      }
    });

    it('should cover expected DMA categories', () => {
      const categories = new Set(controls.map((c) => c.category));
      expect(categories).toContain('Gatekeeper Designation');
      expect(categories).toContain('Core Platform Services');
      expect(categories).toContain('Data Portability');
      expect(categories).toContain('Interoperability');
      expect(categories).toContain('Fair Access');
      expect(categories).toContain('Prohibited Practices');
      expect(categories).toContain('Transparency');
      expect(categories).toContain('Compliance');
      expect(categories).toContain('Reporting');
    });

    it('should have unique control names', () => {
      const names = controls.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  // ---------------------------------------------------------------
  // getDSAControls()
  // ---------------------------------------------------------------
  describe('getDSAControls()', () => {
    let controls: ControlTemplate[];

    beforeEach(() => {
      controls = service.getDSAControls();
    });

    it('should return 31 DSA controls', () => {
      expect(controls).toHaveLength(31);
    });

    it('should return controls with the required shape', () => {
      for (const ctrl of controls) {
        expect(ctrl).toHaveProperty('name');
        expect(ctrl).toHaveProperty('description');
        expect(ctrl).toHaveProperty('category');
        expect(ctrl.evidenceRequired).toBe(true);
        expect(ctrl.status).toBe('Pending');
      }
    });

    it('should include control names starting with DSA- prefix', () => {
      for (const ctrl of controls) {
        expect(ctrl.name).toMatch(/^DSA-\d{3}:/);
      }
    });

    it('should cover expected DSA categories', () => {
      const categories = new Set(controls.map((c) => c.category));
      expect(categories).toContain('Platform Classification');
      expect(categories).toContain('Content Moderation');
      expect(categories).toContain('User Rights');
      expect(categories).toContain('Illegal Content');
      expect(categories).toContain('Protection of Minors');
      expect(categories).toContain('Ad Transparency');
      expect(categories).toContain('Dark Patterns');
      expect(categories).toContain('Transparency Reporting');
      expect(categories).toContain('Marketplace Requirements');
    });

    it('should have unique control names', () => {
      const names = controls.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  // ---------------------------------------------------------------
  // getControlsForFramework()
  // ---------------------------------------------------------------
  describe('getControlsForFramework()', () => {
    it('should return EU AI Act controls for "EU AI Act"', () => {
      const controls = service.getControlsForFramework('EU AI Act');
      expect(controls).toHaveLength(20);
      expect(controls[0].name).toMatch(/^AI-ACT-/);
    });

    it('should return DMA controls for "Digital Markets Act (DMA)"', () => {
      const controls = service.getControlsForFramework('Digital Markets Act (DMA)');
      expect(controls).toHaveLength(20);
      expect(controls[0].name).toMatch(/^DMA-/);
    });

    it('should return DSA controls for "Digital Services Act (DSA)"', () => {
      const controls = service.getControlsForFramework('Digital Services Act (DSA)');
      expect(controls).toHaveLength(31);
      expect(controls[0].name).toMatch(/^DSA-/);
    });

    it('should return an empty array for unsupported frameworks', () => {
      expect(service.getControlsForFramework('SOC 2 Type II')).toEqual([]);
      expect(service.getControlsForFramework('GDPR')).toEqual([]);
      expect(service.getControlsForFramework('Unknown')).toEqual([]);
      expect(service.getControlsForFramework('')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // getControlCount()
  // ---------------------------------------------------------------
  describe('getControlCount()', () => {
    it('should return 20 for EU AI Act', () => {
      expect(service.getControlCount('EU AI Act')).toBe(20);
    });

    it('should return 20 for DMA', () => {
      expect(service.getControlCount('Digital Markets Act (DMA)')).toBe(20);
    });

    it('should return 31 for DSA', () => {
      expect(service.getControlCount('Digital Services Act (DSA)')).toBe(31);
    });

    it('should return 0 for unsupported frameworks', () => {
      expect(service.getControlCount('HIPAA')).toBe(0);
      expect(service.getControlCount('')).toBe(0);
    });
  });
});
