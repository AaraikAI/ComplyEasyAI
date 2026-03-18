import { describe, it, expect } from '@jest/globals';
import {
  inviteSchema,
  bulkInviteSchema,
  updateMemberSchema,
} from '../../../validators/teamSchemas';

const opts = { abortEarly: false, stripUnknown: true, convert: true };

// ---------------------------------------------------------------------------
// inviteSchema
// ---------------------------------------------------------------------------
describe('inviteSchema contract', () => {
  const valid = { email: 'newuser@example.com', role: 'editor' };

  it('should accept valid payload', () => {
    const { error, value } = inviteSchema.validate(valid, opts);
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
    expect(value.email).toBe('newuser@example.com');
    expect(value.role).toBe('editor');
  });

  it('should accept optional name', () => {
    const { error } = inviteSchema.validate(
      { ...valid, name: 'Jane Doe' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should accept null name', () => {
    const { error } = inviteSchema.validate(
      { ...valid, name: null }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should accept empty name', () => {
    const { error } = inviteSchema.validate(
      { ...valid, name: '' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = inviteSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require email', () => {
    const { error } = inviteSchema.validate({ role: 'admin' }, opts);
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('email'))).toBe(true);
  });

  it('should require role', () => {
    const { error } = inviteSchema.validate({ email: 'a@b.com' }, opts);
    expect(error).toBeDefined();
    expect(error!.details.some((d) => d.path.includes('role'))).toBe(true);
  });

  it('should reject invalid email format', () => {
    const { error } = inviteSchema.validate(
      { email: 'not-email', role: 'admin' }, opts,
    );
    expect(error).toBeDefined();
  });

  // role enum
  it('should accept valid role values', () => {
    for (const role of ['admin', 'editor', 'viewer']) {
      const { error } = inviteSchema.validate(
        { email: 'a@b.com', role }, opts,
      );
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid role value', () => {
    const { error } = inviteSchema.validate(
      { email: 'a@b.com', role: 'superadmin' }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce name max length of 200', () => {
    const { error } = inviteSchema.validate(
      { ...valid, name: 'a'.repeat(201) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = inviteSchema.validate(
      { ...valid, department: 'Engineering' }, { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in email', () => {
    const { error } = inviteSchema.validate(
      { email: "'; DROP TABLE users; --", role: 'admin' }, opts,
    );
    expect(error).toBeDefined(); // Not a valid email
  });

  it('should handle XSS in name', () => {
    const r = inviteSchema.validate(
      { ...valid, name: '<script>alert(1)</script>' }, opts,
    );
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// bulkInviteSchema
// ---------------------------------------------------------------------------
describe('bulkInviteSchema contract', () => {
  const valid = {
    invitations: [
      { email: 'user1@example.com', role: 'editor' },
      { email: 'user2@example.com', role: 'viewer' },
    ],
  };

  it('should accept valid payload', () => {
    const { error, value } = bulkInviteSchema.validate(valid, opts);
    expect(error).toBeUndefined();
    expect(value.invitations).toHaveLength(2);
  });

  it('should accept invitations with optional name', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ email: 'a@b.com', role: 'admin', name: 'John' }] }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = bulkInviteSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require invitations', () => {
    const { error } = bulkInviteSchema.validate({}, opts);
    expect(error!.details.some((d) => d.path.includes('invitations'))).toBe(true);
  });

  it('should require at least 1 invitation', () => {
    const { error } = bulkInviteSchema.validate({ invitations: [] }, opts);
    expect(error).toBeDefined();
  });

  it('should reject more than 50 invitations', () => {
    const invitations = Array.from({ length: 51 }, (_, i) => ({
      email: `user${i}@example.com`,
      role: 'viewer' as const,
    }));
    const { error } = bulkInviteSchema.validate({ invitations }, opts);
    expect(error).toBeDefined();
  });

  it('should validate email in nested invitation objects', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ email: 'bad', role: 'admin' }] }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should validate role enum in nested invitation objects', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ email: 'a@b.com', role: 'superadmin' }] }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should require email in each invitation', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ role: 'admin' }] }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should require role in each invitation', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ email: 'a@b.com' }] }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce name max length in nested objects', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ email: 'a@b.com', role: 'admin', name: 'a'.repeat(201) }] }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = bulkInviteSchema.validate(
      { invitations: [{ email: 'a@b.com', role: 'admin' }], extra: true },
      { abortEarly: false },
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateMemberSchema
// ---------------------------------------------------------------------------
describe('updateMemberSchema contract', () => {
  it('should accept payload with role', () => {
    const { error, value } = updateMemberSchema.validate({ role: 'admin' }, opts);
    expect(error).toBeUndefined();
    expect(value.role).toBe('admin');
  });

  it('should accept payload with active', () => {
    const { error } = updateMemberSchema.validate({ active: false }, opts);
    expect(error).toBeUndefined();
  });

  it('should accept payload with both fields', () => {
    const { error } = updateMemberSchema.validate(
      { role: 'viewer', active: true }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload (min 1 field required)', () => {
    const { error } = updateMemberSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  // role enum
  it('should accept valid role values', () => {
    for (const role of ['admin', 'editor', 'viewer']) {
      const { error } = updateMemberSchema.validate({ role }, opts);
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid role value', () => {
    const { error } = updateMemberSchema.validate({ role: 'owner' }, opts);
    expect(error).toBeDefined();
  });

  it('should reject unknown fields', () => {
    const { error } = updateMemberSchema.validate(
      { role: 'admin', permissions: ['all'] }, { abortEarly: false },
    );
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in role', () => {
    const { error } = updateMemberSchema.validate(
      { role: "'; DROP TABLE members; --" }, opts,
    );
    expect(error).toBeDefined(); // Not a valid enum value
  });
});
