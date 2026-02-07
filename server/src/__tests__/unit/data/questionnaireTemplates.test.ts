/**
 * Questionnaire Templates Data Unit Tests
 * Verifies the data structure and exports of questionnaireTemplates
 */

import { describe, it, expect } from '@jest/globals';
import { questionnaireTemplates } from '../../../data/questionnaireTemplates';

describe('questionnaireTemplates', () => {
  it('should be defined and be an array', () => {
    expect(questionnaireTemplates).toBeDefined();
    expect(Array.isArray(questionnaireTemplates)).toBe(true);
  });

  it('should contain 6 templates', () => {
    expect(questionnaireTemplates.length).toBe(6);
  });

  it('should have unique IDs for each template', () => {
    const ids = questionnaireTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include expected template IDs', () => {
    const ids = questionnaireTemplates.map((t) => t.id);
    expect(ids).toContain('sig-lite');
    expect(ids).toContain('vendor-due-diligence');
    expect(ids).toContain('pia');
    expect(ids).toContain('soc2-readiness');
    expect(ids).toContain('hipaa');
    expect(ids).toContain('itgc');
  });

  it('should have valid structure for each template', () => {
    questionnaireTemplates.forEach((template) => {
      expect(typeof template.id).toBe('string');
      expect(typeof template.title).toBe('string');
      expect(typeof template.description).toBe('string');
      expect(typeof template.type).toBe('string');
      expect(typeof template.questionCount).toBe('number');
      expect(Array.isArray(template.categories)).toBe(true);
      expect(Array.isArray(template.questions)).toBe(true);
      expect(template.categories.length).toBeGreaterThan(0);
      expect(template.questions.length).toBeGreaterThan(0);
    });
  });

  it('should have valid question structure', () => {
    questionnaireTemplates.forEach((template) => {
      template.questions.forEach((question) => {
        expect(typeof question.questionText).toBe('string');
        expect(typeof question.questionType).toBe('string');
        expect(typeof question.category).toBe('string');
        expect(typeof question.required).toBe('boolean');
      });
    });
  });

  it('should have question types of either Yes/No or Text', () => {
    questionnaireTemplates.forEach((template) => {
      template.questions.forEach((question) => {
        expect(['Yes/No', 'Text']).toContain(question.questionType);
      });
    });
  });

  it('should have question categories that match template categories', () => {
    questionnaireTemplates.forEach((template) => {
      template.questions.forEach((question) => {
        expect(template.categories).toContain(question.category);
      });
    });
  });

  it('should have SIG Lite with 30 questions', () => {
    const sigLite = questionnaireTemplates.find((t) => t.id === 'sig-lite');
    expect(sigLite).toBeDefined();
    expect(sigLite!.questions.length).toBe(30);
    expect(sigLite!.questionCount).toBe(30);
  });

  it('should have HIPAA template with correct type', () => {
    const hipaa = questionnaireTemplates.find((t) => t.id === 'hipaa');
    expect(hipaa).toBeDefined();
    expect(hipaa!.type).toBe('Compliance Assessment');
  });
});
