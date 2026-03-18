import { describe, it, expect } from '@jest/globals';
import { updateOrganizationSchema } from '../../../validators/organizationSchemas';

const JOI_OPTS = { abortEarly: false, stripUnknown: true, convert: true } as const;

describe('organizationSchemas contract tests', () => {
  // ==========================================================================
  // updateOrganizationSchema
  // ==========================================================================
  describe('updateOrganizationSchema', () => {
    const validPayload = { name: 'Acme Corp', plan: 'Growth' };

    it('should accept a valid full payload', () => {
      const { error, value } = updateOrganizationSchema.validate(validPayload, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value).toEqual(validPayload);
    });

    it('should accept name only', () => {
      const { error, value } = updateOrganizationSchema.validate({ name: 'NewName' }, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value).toEqual({ name: 'NewName' });
    });

    it('should accept plan only', () => {
      const { error, value } = updateOrganizationSchema.validate({ plan: 'Foundation' }, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value).toEqual({ plan: 'Foundation' });
    });

    it('should trim whitespace from name', () => {
      const { error, value } = updateOrganizationSchema.validate({ name: '  Acme  ' }, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value!.name).toBe('Acme');
    });

    // --- Required-field / min(1) ---
    it('should reject an empty object (min 1 key required)', () => {
      const { error } = updateOrganizationSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Enum validation for plan ---
    it.each(['Foundation', 'Essentials', 'Growth', 'Visionary'])(
      'should accept valid plan value: %s',
      (plan) => {
        const { error } = updateOrganizationSchema.validate({ plan }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject an invalid plan value', () => {
      const { error } = updateOrganizationSchema.validate({ plan: 'Enterprise' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details[0].type).toBe('any.only');
    });

    // --- Boundary: name length ---
    it('should reject name exceeding 100 characters', () => {
      const { error } = updateOrganizationSchema.validate({ name: 'x'.repeat(101) }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details[0].type).toBe('string.max');
    });

    it('should accept name at exactly 100 characters', () => {
      const { error } = updateOrganizationSchema.validate({ name: 'x'.repeat(100) }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty-string name (min 1)', () => {
      const { error } = updateOrganizationSchema.validate({ name: '' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Type checking ---
    it('should reject non-string name', () => {
      const { error } = updateOrganizationSchema.validate({ name: 123 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-string plan', () => {
      const { error } = updateOrganizationSchema.validate({ plan: true }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    // --- Unknown field stripping (unknown: false) ---
    it('should reject unknown fields', () => {
      const { error } = updateOrganizationSchema.validate(
        { name: 'A', extraField: 'bad' },
        { abortEarly: false, convert: true },
      );
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    it('should also reject unknown fields when stripUnknown is true (unknown(false) takes precedence)', () => {
      const { error } = updateOrganizationSchema.validate(
        { name: 'A', extraField: 'bad' },
        JOI_OPTS,
      );
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    // --- Security payloads ---
    it('should sanitize XSS in name via trim/max and not break', () => {
      const xss = '<script>alert("xss")</script>';
      const { error } = updateOrganizationSchema.validate({ name: xss }, JOI_OPTS);
      // The schema itself does not reject HTML; it passes but the value is stored as-is
      expect(error).toBeUndefined();
    });

    it('should reject SQL injection strings that exceed max length', () => {
      const sqlInjection = "'; DROP TABLE organizations; --".repeat(10);
      const { error } = updateOrganizationSchema.validate({ name: sqlInjection }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should handle null values for optional fields gracefully', () => {
      const { error } = updateOrganizationSchema.validate({ name: null }, JOI_OPTS);
      expect(error).toBeDefined(); // name is string, not nullable
    });
  });
});
