import { describe, it, expect } from '@jest/globals';
import {
  createAISystemSchema,
  updateAISystemSchema,
} from '../../../validators/aiRmfSchemas';

const JOI_OPTS = { abortEarly: false, stripUnknown: true, convert: true } as const;
const STRICT_OPTS = { abortEarly: false, convert: true } as const;

describe('aiRmfSchemas contract tests', () => {
  // ==========================================================================
  // createAISystemSchema
  // ==========================================================================
  describe('createAISystemSchema', () => {
    const valid = { name: 'GPT-4 Internal Assistant' };

    it('should accept a minimal valid payload (name only)', () => {
      const { error, value } = createAISystemSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value!.name).toBe('GPT-4 Internal Assistant');
    });

    it('should accept a full payload with all optional fields', () => {
      const full = {
        name: 'Fraud Detection Model',
        description: 'Detects fraudulent transactions in real-time.',
        version: '2.1.0',
        vendor: 'Internal ML Team',
        purpose: 'Reduce fraud losses by 40%',
        lifecycle_stage: 'Production',
        riskLevel: 'High',
        category: 'Financial AI',
        deploymentType: 'Cloud',
        dataTypes: ['PII', 'Financial'],
        userCount: 5000,
        automationLevel: 'Semi-automated',
        status: 'Active',
      };
      const { error, value } = createAISystemSchema.validate(full, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    // --- Required fields ---
    it('should reject missing name', () => {
      const { error } = createAISystemSchema.validate({ description: 'No name' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.message.includes('name'))).toBe(true);
    });

    // --- Type checking ---
    it('should reject non-string name', () => {
      const { error } = createAISystemSchema.validate({ name: 123 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-number userCount', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', userCount: 'many' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative userCount', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', userCount: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-integer userCount', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', userCount: 3.5 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept userCount = 0', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', userCount: 0 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    // --- Boundary: name length ---
    it('should reject name exceeding 500 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'x'.repeat(501) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept name at exactly 500 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'x'.repeat(500) }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty name', () => {
      const { error } = createAISystemSchema.validate({ name: '' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Boundary: description length ---
    it('should reject description exceeding 5000 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', description: 'x'.repeat(5001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should allow empty string for description', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', description: '' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should allow null for description', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', description: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    // --- Boundary: version length ---
    it('should reject version exceeding 50 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', version: 'x'.repeat(51) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Boundary: vendor length ---
    it('should reject vendor exceeding 200 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', vendor: 'x'.repeat(201) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Boundary: purpose length ---
    it('should reject purpose exceeding 2000 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', purpose: 'x'.repeat(2001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Enum: riskLevel ---
    it.each(['Critical', 'High', 'Medium', 'Low'])('should accept riskLevel=%s', (riskLevel) => {
      const { error } = createAISystemSchema.validate({ name: 'X', riskLevel }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid riskLevel', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', riskLevel: 'Extreme' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details[0].type).toBe('any.only');
    });

    // --- Boundary: category length ---
    it('should reject category exceeding 100 chars', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', category: 'x'.repeat(101) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- dataTypes accepts any type ---
    it('should accept dataTypes as array', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', dataTypes: ['PII'] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept dataTypes as string', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', dataTypes: 'PII' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept dataTypes as object', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', dataTypes: { pii: true } }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    // --- Unknown fields ---
    it('should reject unknown fields in strict mode', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', hackerField: 'bad' }, STRICT_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    it('should reject unknown fields even with stripUnknown (unknown(false))', () => {
      const { error } = createAISystemSchema.validate({ name: 'X', hackerField: 'bad' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    // --- Trim ---
    it('should trim name whitespace', () => {
      const { value } = createAISystemSchema.validate({ name: '  Model X  ' }, JOI_OPTS);
      expect(value!.name).toBe('Model X');
    });

    // --- Security payloads ---
    it('should pass through XSS in name (schema does not sanitize HTML)', () => {
      const xss = '<img src=x onerror=alert(1)>';
      const { error, value } = createAISystemSchema.validate({ name: xss }, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value!.name).toBe(xss);
    });

    it('should pass through SQL injection in description', () => {
      const sql = "'; DROP TABLE ai_systems; --";
      const { error } = createAISystemSchema.validate({ name: 'X', description: sql }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // updateAISystemSchema (inherits from create, adds min(1))
  // ==========================================================================
  describe('updateAISystemSchema', () => {
    it('should accept partial update with name only', () => {
      const { error } = updateAISystemSchema.validate({ name: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should still require name (inherits required from create schema)', () => {
      const { error } = updateAISystemSchema.validate({ riskLevel: 'Low' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.message.includes('name'))).toBe(true);
    });

    it('should reject empty object (min 1 key)', () => {
      const { error } = updateAISystemSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject invalid riskLevel', () => {
      const { error } = updateAISystemSchema.validate({ riskLevel: 'Unknown' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields in strict mode', () => {
      const { error } = updateAISystemSchema.validate({ name: 'X', evil: true }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields even with stripUnknown (unknown(false))', () => {
      const { error } = updateAISystemSchema.validate({ name: 'X', evil: true }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    it('should accept multiple fields when name is provided', () => {
      const { error } = updateAISystemSchema.validate({
        name: 'Updated System',
        description: 'Updated desc',
        riskLevel: 'Critical',
        userCount: 100,
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject negative userCount', () => {
      const { error } = updateAISystemSchema.validate({ userCount: -5 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should enforce same max-length constraints as create', () => {
      const { error } = updateAISystemSchema.validate({ name: 'x'.repeat(501) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });
});
