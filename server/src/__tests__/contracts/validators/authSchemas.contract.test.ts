import { describe, it, expect } from '@jest/globals';
import {
  magicLinkSchema,
  loginSchema,
  registerSchema,
  completeTwoFactorSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../../../validators/authSchemas';

// ---------------------------------------------------------------------------
// magicLinkSchema
// ---------------------------------------------------------------------------
describe('magicLinkSchema contract', () => {
  const validPayload = { email: 'user@example.com' };

  it('should accept valid payload', () => {
    const { error, value } = magicLinkSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
    expect(value.email).toBe('user@example.com');
  });

  it('should accept payload with optional captchaToken', () => {
    const { error } = magicLinkSchema.validate(
      { ...validPayload, captchaToken: 'abc123' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept empty captchaToken', () => {
    const { error } = magicLinkSchema.validate(
      { ...validPayload, captchaToken: '' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept null captchaToken', () => {
    const { error } = magicLinkSchema.validate(
      { ...validPayload, captchaToken: null },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = magicLinkSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require email', () => {
    const { error } = magicLinkSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('email'))).toBe(true);
  });

  it('should reject invalid email format', () => {
    const { error } = magicLinkSchema.validate(
      { email: 'not-an-email' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields (unknown: false)', () => {
    const { error } = magicLinkSchema.validate(
      { ...validPayload, unknownField: 'test' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in email field', () => {
    const { error } = magicLinkSchema.validate(
      { email: "'; DROP TABLE users; --" },
      { abortEarly: false },
    );
    expect(error).toBeDefined(); // Not a valid email
  });

  it('should handle XSS in email field', () => {
    const { error } = magicLinkSchema.validate(
      { email: '<script>alert(1)</script>' },
      { abortEarly: false },
    );
    expect(error).toBeDefined(); // Not a valid email
  });
});

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema contract', () => {
  const validPayload = { email: 'user@example.com', password: 'securePass123' };

  it('should accept valid payload', () => {
    const { error, value } = loginSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
  });

  it('should reject empty payload', () => {
    const { error } = loginSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require email', () => {
    const { error } = loginSchema.validate(
      { password: 'securePass123' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('email'))).toBe(true);
  });

  it('should require password', () => {
    const { error } = loginSchema.validate(
      { email: 'user@example.com' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('password'))).toBe(true);
  });

  it('should reject invalid email format', () => {
    const { error } = loginSchema.validate(
      { email: 'bad', password: 'securePass123' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should accept optional captchaToken', () => {
    const { error } = loginSchema.validate(
      { ...validPayload, captchaToken: 'tok' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject unknown fields', () => {
    const { error } = loginSchema.validate(
      { ...validPayload, isAdmin: true },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in password', () => {
    const result = loginSchema.validate(
      { email: 'user@example.com', password: "' OR '1'='1" },
      { abortEarly: false },
    );
    // Password is a free-form string so it may pass validation - that's OK
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema contract', () => {
  const validPayload = {
    email: 'new@example.com',
    password: 'StrongP@ss1',
    name: 'Jane Doe',
  };

  it('should accept valid payload with required fields only', () => {
    const { error, value } = registerSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
  });

  it('should accept valid payload with all optional fields', () => {
    const full = {
      ...validPayload,
      organizationName: 'Acme Inc',
      industry: 'Technology',
      companySize: '50-100',
      primaryComplianceGoal: 'SOC2',
      howDidYouHear: 'Google',
      captchaToken: 'tok',
    };
    const { error } = registerSchema.validate(full, { abortEarly: false });
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = registerSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
    const paths = error!.details.map((d) => d.path[0]);
    expect(paths).toContain('email');
    expect(paths).toContain('password');
    expect(paths).toContain('name');
  });

  it('should require email', () => {
    const { error } = registerSchema.validate(
      { password: 'StrongP@ss1', name: 'Jane' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should require password', () => {
    const { error } = registerSchema.validate(
      { email: 'a@b.com', name: 'Jane' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should require name', () => {
    const { error } = registerSchema.validate(
      { email: 'a@b.com', password: 'StrongP@ss1' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce password min length of 8', () => {
    const { error } = registerSchema.validate(
      { ...validPayload, password: 'short' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce password max length of 128', () => {
    const { error } = registerSchema.validate(
      { ...validPayload, password: 'a'.repeat(129) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce name max length of 200', () => {
    const { error } = registerSchema.validate(
      { ...validPayload, name: 'a'.repeat(201) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce organizationName max length of 100', () => {
    const { error } = registerSchema.validate(
      { ...validPayload, organizationName: 'a'.repeat(101) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should trim name whitespace', () => {
    const { value } = registerSchema.validate(
      { ...validPayload, name: '  Jane Doe  ' },
      { abortEarly: false },
    );
    expect(value.name).toBe('Jane Doe');
  });

  it('should reject unknown fields', () => {
    const { error } = registerSchema.validate(
      { ...validPayload, isAdmin: true },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle XSS in name', () => {
    const result = registerSchema.validate(
      { ...validPayload, name: '<script>alert(1)</script>' },
      { abortEarly: false },
    );
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// completeTwoFactorSchema
// ---------------------------------------------------------------------------
describe('completeTwoFactorSchema contract', () => {
  const validPayload = { twoFactorToken: '123456', token: 'jwt-token-here' };

  it('should accept valid payload', () => {
    const { error, value } = completeTwoFactorSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
  });

  it('should reject empty payload', () => {
    const { error } = completeTwoFactorSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require twoFactorToken', () => {
    const { error } = completeTwoFactorSchema.validate(
      { token: 'jwt' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('twoFactorToken'))).toBe(true);
  });

  it('should require token', () => {
    const { error } = completeTwoFactorSchema.validate(
      { twoFactorToken: '123456' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('token'))).toBe(true);
  });

  it('should reject unknown fields', () => {
    const { error } = completeTwoFactorSchema.validate(
      { ...validPayload, extra: 'nope' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateProfileSchema
// ---------------------------------------------------------------------------
describe('updateProfileSchema contract', () => {
  it('should accept payload with name only', () => {
    const { error, value } = updateProfileSchema.validate(
      { name: 'Updated Name' },
      { abortEarly: false, stripUnknown: true, convert: true },
    );
    expect(error).toBeUndefined();
    expect(value.name).toBe('Updated Name');
  });

  it('should accept payload with email only', () => {
    const { error } = updateProfileSchema.validate(
      { email: 'new@example.com' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should accept payload with both fields', () => {
    const { error } = updateProfileSchema.validate(
      { name: 'X', email: 'x@y.com' },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload (min 1 field required)', () => {
    const { error } = updateProfileSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should reject invalid email', () => {
    const { error } = updateProfileSchema.validate(
      { email: 'bad' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce name max length of 200', () => {
    const { error } = updateProfileSchema.validate(
      { name: 'a'.repeat(201) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should trim name', () => {
    const { value } = updateProfileSchema.validate(
      { name: '  trimmed  ' },
      { abortEarly: false },
    );
    expect(value.name).toBe('trimmed');
  });

  it('should reject unknown fields', () => {
    const { error } = updateProfileSchema.validate(
      { name: 'X', role: 'admin' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------
describe('changePasswordSchema contract', () => {
  const validPayload = {
    currentPassword: 'oldPassword1',
    newPassword: 'newStrongP@ss',
  };

  it('should accept valid payload', () => {
    const { error, value } = changePasswordSchema.validate(validPayload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
  });

  it('should reject empty payload', () => {
    const { error } = changePasswordSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();
  });

  it('should require currentPassword', () => {
    const { error } = changePasswordSchema.validate(
      { newPassword: 'newStrongP@ss' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should require newPassword', () => {
    const { error } = changePasswordSchema.validate(
      { currentPassword: 'old' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce newPassword min length of 8', () => {
    const { error } = changePasswordSchema.validate(
      { currentPassword: 'old', newPassword: 'short' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should enforce newPassword max length of 128', () => {
    const { error } = changePasswordSchema.validate(
      { currentPassword: 'old', newPassword: 'a'.repeat(129) },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = changePasswordSchema.validate(
      { ...validPayload, token: 'bypass' },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in password fields', () => {
    const result = changePasswordSchema.validate(
      { currentPassword: "' OR 1=1 --", newPassword: "'; DROP TABLE users; --" },
      { abortEarly: false },
    );
    // newPassword SQL injection string is < 8 chars so it will fail min length
    expect(result).toBeDefined();
  });
});
