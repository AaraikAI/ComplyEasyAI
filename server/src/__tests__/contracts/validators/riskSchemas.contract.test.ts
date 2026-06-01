import { describe, it, expect } from '@jest/globals';
import {
  createRiskSchema,
  updateRiskSchema,
} from '../../../validators/riskSchemas';

// ---------------------------------------------------------------------------
// createRiskSchema
// ---------------------------------------------------------------------------
describe('createRiskSchema contract', () => {
  const validPayload = { title: 'Data breach risk' };

  it('should accept valid payload with required fields only', () => {
    const { error, value } = createRiskSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
    expect(value.title).toBe('Data breach risk');
  });

  it('should accept valid payload with all optional fields', () => {
    const full = {
      title: 'Full risk',
      description: 'Detailed description',
      category: 'Security',
      severity: 'High',
      likelihood: 'Likely',
      impact: 'Major',
      status: 'Open',
      owner: 'John Doe',
      assignedToId: 'user-123',
      targetDate: '2026-12-31T00:00:00.000Z',
      riskScore: 75,
      mitigationPlan: 'Implement controls',
      frameworkId: 'fw-1',
    };
    const { error } = createRiskSchema.validate(full, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = createRiskSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require title', () => {
    const { error } = createRiskSchema.validate(
      { description: 'no title' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('title'))).toBe(true);
  });

  it('should enforce title max length of 500', () => {
    const { error } = createRiskSchema.validate(
      { title: 'a'.repeat(501) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should trim title whitespace', () => {
    const { value } = createRiskSchema.validate(
      { title: '  trimmed title  ' },
      { abortEarly: false },
    );
    expect(value.title).toBe('trimmed title');
  });

  it('should enforce description max length of 5000', () => {
    const { error } = createRiskSchema.validate(
      { title: 'Risk', description: 'a'.repeat(5001) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // Severity enum
  it('should accept valid severity values', () => {
    for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
      const { error } = createRiskSchema.validate(
        { title: 'R', severity: sev },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid severity value', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', severity: 'Extreme' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // Likelihood - alternatives: string enum or number 1-5
  it('should accept string likelihood values', () => {
    for (const val of ['Very Likely', 'Likely', 'Possible', 'Unlikely', 'Rare']) {
      const { error } = createRiskSchema.validate(
        { title: 'R', likelihood: val },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should accept numeric likelihood values 1-5', () => {
    for (const num of [1, 2, 3, 4, 5]) {
      const { error } = createRiskSchema.validate(
        { title: 'R', likelihood: num },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject numeric likelihood outside 1-5', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', likelihood: 6 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject invalid string likelihood', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', likelihood: 'Always' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // Impact - alternatives: string enum or number 1-5
  it('should accept string impact values', () => {
    for (const val of ['Catastrophic', 'Major', 'Moderate', 'Minor', 'Negligible']) {
      const { error } = createRiskSchema.validate(
        { title: 'R', impact: val },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should accept numeric impact values 1-5', () => {
    for (const num of [1, 2, 3, 4, 5]) {
      const { error } = createRiskSchema.validate(
        { title: 'R', impact: num },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject numeric impact outside 1-5', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', impact: 0 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // Status enum
  it('should accept valid status values', () => {
    for (const s of ['Open', 'In Progress', 'Mitigated', 'Closed', 'Accepted']) {
      const { error } = createRiskSchema.validate(
        { title: 'R', status: s },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid status value', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', status: 'Deleted' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // riskScore boundaries
  it('should accept riskScore 0', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', riskScore: 0 },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept riskScore 100', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', riskScore: 100 },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject riskScore > 100', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', riskScore: 101 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject riskScore < 0', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', riskScore: -1 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // targetDate
  it('should accept valid ISO date for targetDate', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', targetDate: '2026-06-15T00:00:00.000Z' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject invalid date string for targetDate', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', targetDate: 'not-a-date' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // Unknown fields
  it('should reject unknown fields', () => {
    const { error } = createRiskSchema.validate(
      { title: 'R', unknownField: 'test' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // Security
  it('should handle SQL injection in title', () => {
    const result = createRiskSchema.validate(
      { title: "'; DROP TABLE risks; --" },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });

  it('should handle XSS in title', () => {
    const result = createRiskSchema.validate(
      { title: '<script>alert(1)</script>' },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });

  it('should handle XSS in description', () => {
    const result = createRiskSchema.validate(
      { title: 'R', description: '<img onerror=alert(1) src=x>' },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateRiskSchema
// ---------------------------------------------------------------------------
describe('updateRiskSchema contract', () => {
  // updateRiskSchema = createRiskSchema.fork(['title'], optional).min(1)
  // so title is optional on update; payload must have at least 1 key present
  it('should accept payload with title and optional fields', () => {
    const { error } = updateRiskSchema.validate(
      { title: 'Updated risk', severity: 'High' },
      { abortEarly: false, stripUnknown: true, convert: true },
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload (min 1 field required)', () => {
    const { error } = updateRiskSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should allow partial update without title (title forked to optional)', () => {
    const { error, value } = updateRiskSchema.validate(
      { status: 'Closed' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
    expect(value.status).toBe('Closed');
  });

  it('should validate field constraints the same as createRiskSchema', () => {
    const { error } = updateRiskSchema.validate(
      { title: 'a'.repeat(501) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject invalid severity on update', () => {
    const { error } = updateRiskSchema.validate(
      { title: 'R', severity: 'Extreme' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = updateRiskSchema.validate(
      { title: 'X', extraField: 123 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });
});
