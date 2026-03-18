import { describe, it, expect } from '@jest/globals';
import {
  createVendorSchema,
  createVendorAssessmentSchema,
  completeVendorAssessmentSchema,
  updateVendorSchema,
} from '../../../validators/vendorSchemas';

// ---------------------------------------------------------------------------
// createVendorSchema
// ---------------------------------------------------------------------------
describe('createVendorSchema contract', () => {
  const validPayload = { name: 'Acme Vendor' };

  it('should accept valid payload with required fields only', () => {
    const { error, value } = createVendorSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
    expect(value.name).toBe('Acme Vendor');
  });

  it('should accept valid payload with all optional fields', () => {
    const full = {
      name: 'Vendor Corp',
      website: 'https://vendor.com',
      contactName: 'John',
      contactEmail: 'john@vendor.com',
      contactPhone: '+1-555-1234',
      category: 'Cloud',
      serviceDescription: 'Hosting provider',
      contractStart: '2026-01-01T00:00:00.000Z',
      contractEnd: '2027-01-01T00:00:00.000Z',
      annualSpend: 50000,
      hasDataAccess: true,
      dataTypes: ['PII', 'Financial'],
      securityContact: 'security@vendor.com',
      soc2Report: true,
      iso27001Certified: false,
      gdprCompliant: true,
      hipaaBaa: false,
    };
    const { error } = createVendorSchema.validate(full, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = createVendorSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require name', () => {
    const { error } = createVendorSchema.validate(
      { website: 'https://x.com' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('name'))).toBe(true);
  });

  it('should enforce name max length of 500', () => {
    const { error } = createVendorSchema.validate(
      { name: 'a'.repeat(501) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should trim name', () => {
    const { value } = createVendorSchema.validate(
      { name: '  Trimmed Vendor  ' },
      { abortEarly: false },
    );
    expect(value.name).toBe('Trimmed Vendor');
  });

  it('should reject invalid website URI', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', website: 'not-a-url' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject invalid contactEmail', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', contactEmail: 'bad-email' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce contactName max length of 200', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', contactName: 'a'.repeat(201) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce contactPhone max length of 50', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', contactPhone: 'a'.repeat(51) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce serviceDescription max length of 2000', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', serviceDescription: 'a'.repeat(2001) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject negative annualSpend', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', annualSpend: -100 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should accept annualSpend of 0', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', annualSpend: 0 },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept boolean fields', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', hasDataAccess: true, soc2Report: false, iso27001Certified: true, gdprCompliant: false, hipaaBaa: true },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept array dataTypes', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', dataTypes: ['PII'] },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept object dataTypes', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', dataTypes: { type: 'PII' } },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject unknown fields', () => {
    const { error } = createVendorSchema.validate(
      { name: 'V', unknownField: 'test' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in name', () => {
    const result = createVendorSchema.validate(
      { name: "'; DROP TABLE vendors; --" },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });

  it('should handle XSS in name', () => {
    const result = createVendorSchema.validate(
      { name: '<script>alert(1)</script>' },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createVendorAssessmentSchema
// ---------------------------------------------------------------------------
describe('createVendorAssessmentSchema contract', () => {
  const validPayload = { assessmentType: 'Security Review' };

  it('should accept valid payload', () => {
    const { error, value } = createVendorAssessmentSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value.assessmentType).toBe('Security Review');
  });

  it('should reject empty payload', () => {
    const { error } = createVendorAssessmentSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require assessmentType', () => {
    const { error } = createVendorAssessmentSchema.validate({}, { abortEarly: false });
    expect(error!.details.some((d) => d.path.includes('assessmentType'))).toBe(true);
  });

  it('should enforce assessmentType max length of 100', () => {
    const { error } = createVendorAssessmentSchema.validate(
      { assessmentType: 'a'.repeat(101) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should trim assessmentType', () => {
    const { value } = createVendorAssessmentSchema.validate(
      { assessmentType: '  Trimmed  ' },
      { abortEarly: false },
    );
    expect(value.assessmentType).toBe('Trimmed');
  });

  it('should reject unknown fields', () => {
    const { error } = createVendorAssessmentSchema.validate(
      { assessmentType: 'Review', extra: true },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// completeVendorAssessmentSchema
// ---------------------------------------------------------------------------
describe('completeVendorAssessmentSchema contract', () => {
  const validPayload = {
    findings: { finding1: 'Issue found' },
    score: 85,
    riskLevel: 'Medium',
  };

  it('should accept valid payload', () => {
    const { error, value } = completeVendorAssessmentSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
  });

  it('should accept findings as array', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: ['finding1'], score: 90, riskLevel: 'Low' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = completeVendorAssessmentSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require findings', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { score: 50, riskLevel: 'High' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('findings'))).toBe(true);
  });

  it('should require score', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, riskLevel: 'High' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should require riskLevel', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, score: 50 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // riskLevel enum
  it('should accept valid riskLevel values', () => {
    for (const level of ['Critical', 'High', 'Medium', 'Low']) {
      const { error } = completeVendorAssessmentSchema.validate(
        { findings: {}, score: 50, riskLevel: level },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid riskLevel', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, score: 50, riskLevel: 'Extreme' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // score boundaries
  it('should accept score 0', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, score: 0, riskLevel: 'Critical' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept score 100', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, score: 100, riskLevel: 'Low' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject score > 100', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, score: 101, riskLevel: 'Low' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject score < 0', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { findings: {}, score: -1, riskLevel: 'Low' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce recommendations max length of 2000', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { ...validPayload, recommendations: 'a'.repeat(2001) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = completeVendorAssessmentSchema.validate(
      { ...validPayload, extra: true },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateVendorSchema
// ---------------------------------------------------------------------------
describe('updateVendorSchema contract', () => {
  it('should accept payload with at least one field', () => {
    const { error } = updateVendorSchema.validate(
      { name: 'Updated Vendor' },
      { abortEarly: false, stripUnknown: true, convert: true },
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload (min 1)', () => {
    const { error } = updateVendorSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should not require name', () => {
    const { error } = updateVendorSchema.validate(
      { category: 'Cloud' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  // riskLevel enum
  it('should accept valid riskLevel values', () => {
    for (const level of ['Critical', 'High', 'Medium', 'Low']) {
      const { error } = updateVendorSchema.validate(
        { riskLevel: level },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid riskLevel', () => {
    const { error } = updateVendorSchema.validate(
      { riskLevel: 'None' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // status enum
  it('should accept valid status values', () => {
    for (const s of ['Active', 'Onboarding', 'Offboarding', 'Suspended', 'Inactive']) {
      const { error } = updateVendorSchema.validate(
        { status: s },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid status', () => {
    const { error } = updateVendorSchema.validate(
      { status: 'Deleted' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  // riskScore boundaries
  it('should accept riskScore 0-100', () => {
    const { error: e1 } = updateVendorSchema.validate({ riskScore: 0 }, { abortEarly: false });
    const { error: e2 } = updateVendorSchema.validate({ riskScore: 100 }, { abortEarly: false });
    expect(e1).toBeUndefined();
    expect(e2).toBeUndefined();
  });

  it('should reject riskScore outside 0-100', () => {
    const { error } = updateVendorSchema.validate(
      { riskScore: 101 },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = updateVendorSchema.validate(
      { name: 'V', unknownField: 'x' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in name', () => {
    const result = updateVendorSchema.validate(
      { name: "'; DROP TABLE vendors; --" },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });

  it('should handle XSS in serviceDescription', () => {
    const result = updateVendorSchema.validate(
      { serviceDescription: '<script>alert(1)</script>' },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });
});
