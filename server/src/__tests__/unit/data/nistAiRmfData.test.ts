/**
 * NIST AI RMF Data Unit Tests
 * Verifies the data structure and exports of nistAiRmfData
 */

import { describe, it, expect } from '@jest/globals';
import {
  NIST_AI_RMF_DATA,
  TRUSTWORTHINESS_CHARACTERISTICS,
  LIFECYCLE_STAGES,
} from '../../../data/nistAiRmfData';
import type { NISTCoreFunction, NISTCategory, NISTSubcategory } from '../../../data/nistAiRmfData';

describe('nistAiRmfData', () => {
  describe('NIST_AI_RMF_DATA', () => {
    it('should be defined and be a non-empty object', () => {
      expect(NIST_AI_RMF_DATA).toBeDefined();
      expect(typeof NIST_AI_RMF_DATA).toBe('object');
      expect(Object.keys(NIST_AI_RMF_DATA).length).toBeGreaterThan(0);
    });

    it('should contain all four core functions', () => {
      expect(NIST_AI_RMF_DATA.GOVERN).toBeDefined();
      expect(NIST_AI_RMF_DATA.MAP).toBeDefined();
      expect(NIST_AI_RMF_DATA.MEASURE).toBeDefined();
      expect(NIST_AI_RMF_DATA.MANAGE).toBeDefined();
    });

    it('should have correct function names on each core function', () => {
      expect(NIST_AI_RMF_DATA.GOVERN.functionName).toBe('GOVERN');
      expect(NIST_AI_RMF_DATA.MAP.functionName).toBe('MAP');
      expect(NIST_AI_RMF_DATA.MEASURE.functionName).toBe('MEASURE');
      expect(NIST_AI_RMF_DATA.MANAGE.functionName).toBe('MANAGE');
    });

    it('should have descriptions for each core function', () => {
      Object.values(NIST_AI_RMF_DATA).forEach((func: NISTCoreFunction) => {
        expect(typeof func.description).toBe('string');
        expect(func.description.length).toBeGreaterThan(0);
      });
    });

    it('should have categories arrays for each core function', () => {
      Object.values(NIST_AI_RMF_DATA).forEach((func: NISTCoreFunction) => {
        expect(Array.isArray(func.categories)).toBe(true);
        expect(func.categories.length).toBeGreaterThan(0);
      });
    });

    it('should have valid category structure with id, name, description, and subcategories', () => {
      Object.values(NIST_AI_RMF_DATA).forEach((func: NISTCoreFunction) => {
        func.categories.forEach((category: NISTCategory) => {
          expect(typeof category.id).toBe('string');
          expect(typeof category.name).toBe('string');
          expect(typeof category.description).toBe('string');
          expect(Array.isArray(category.subcategories)).toBe(true);
          expect(category.subcategories.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid subcategory structure with id, name, and description', () => {
      Object.values(NIST_AI_RMF_DATA).forEach((func: NISTCoreFunction) => {
        func.categories.forEach((category: NISTCategory) => {
          category.subcategories.forEach((sub: NISTSubcategory) => {
            expect(typeof sub.id).toBe('string');
            expect(typeof sub.name).toBe('string');
            expect(typeof sub.description).toBe('string');
          });
        });
      });
    });

    it('should have GOVERN with 4 categories', () => {
      expect(NIST_AI_RMF_DATA.GOVERN.categories.length).toBe(4);
    });

    it('should have MAP with 4 categories', () => {
      expect(NIST_AI_RMF_DATA.MAP.categories.length).toBe(4);
    });

    it('should have MEASURE with 4 categories', () => {
      expect(NIST_AI_RMF_DATA.MEASURE.categories.length).toBe(4);
    });

    it('should have MANAGE with 4 categories', () => {
      expect(NIST_AI_RMF_DATA.MANAGE.categories.length).toBe(4);
    });
  });

  describe('TRUSTWORTHINESS_CHARACTERISTICS', () => {
    it('should be defined and be an array', () => {
      expect(TRUSTWORTHINESS_CHARACTERISTICS).toBeDefined();
      expect(Array.isArray(TRUSTWORTHINESS_CHARACTERISTICS)).toBe(true);
    });

    it('should have 7 characteristics', () => {
      expect(TRUSTWORTHINESS_CHARACTERISTICS.length).toBe(7);
    });

    it('should have valid structure for each characteristic', () => {
      TRUSTWORTHINESS_CHARACTERISTICS.forEach((char) => {
        expect(typeof char.characteristic).toBe('string');
        expect(typeof char.name).toBe('string');
        expect(typeof char.description).toBe('string');
        expect(Array.isArray(char.keyAspects)).toBe(true);
        expect(char.keyAspects.length).toBeGreaterThan(0);
      });
    });

    it('should include expected characteristic names', () => {
      const names = TRUSTWORTHINESS_CHARACTERISTICS.map((c) => c.characteristic);
      expect(names).toContain('Valid_and_Reliable');
      expect(names).toContain('Safe');
      expect(names).toContain('Secure_and_Resilient');
      expect(names).toContain('Accountable_and_Transparent');
      expect(names).toContain('Explainable_and_Interpretable');
      expect(names).toContain('Privacy_Enhanced');
      expect(names).toContain('Fair_with_Bias_Managed');
    });
  });

  describe('LIFECYCLE_STAGES', () => {
    it('should be defined and be an array', () => {
      expect(LIFECYCLE_STAGES).toBeDefined();
      expect(Array.isArray(LIFECYCLE_STAGES)).toBe(true);
    });

    it('should have 5 stages', () => {
      expect(LIFECYCLE_STAGES.length).toBe(5);
    });

    it('should have valid structure for each stage', () => {
      LIFECYCLE_STAGES.forEach((stage) => {
        expect(typeof stage.stage).toBe('string');
        expect(typeof stage.name).toBe('string');
        expect(typeof stage.description).toBe('string');
        expect(Array.isArray(stage.keyActivities)).toBe(true);
        expect(stage.keyActivities.length).toBeGreaterThan(0);
      });
    });

    it('should include expected stage identifiers', () => {
      const stages = LIFECYCLE_STAGES.map((s) => s.stage);
      expect(stages).toContain('Plan_and_Design');
      expect(stages).toContain('Collect_and_Process');
      expect(stages).toContain('Build_and_Validate');
      expect(stages).toContain('Deploy_and_Operate');
      expect(stages).toContain('Monitor_and_Maintain');
    });
  });
});
