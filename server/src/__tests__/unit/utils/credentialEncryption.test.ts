process.env.ENCRYPTION_KEY = 'a'.repeat(64);

import crypto from 'crypto';
import { encryptField, decryptField } from '../../../utils/credentialEncryption';

describe('credentialEncryption', () => {
  const secret = 'super-secret-oauth-token-value';

  it('round-trips through the v2 envelope', () => {
    const enc = encryptField(secret);
    expect(enc.startsWith('enc_v2:')).toBe(true);
    expect(decryptField(enc)).toBe(secret);
  });

  it('uses a fresh salt per record, so identical plaintexts differ', () => {
    const a = encryptField(secret);
    const b = encryptField(secret);
    expect(a.split(':')[1]).not.toBe(b.split(':')[1]); // salts
    expect(a).not.toBe(b);
    expect(decryptField(a)).toBe(secret);
    expect(decryptField(b)).toBe(secret);
  });

  it('is idempotent — never double-encrypts', () => {
    const enc = encryptField(secret);
    expect(encryptField(enc)).toBe(enc);
  });

  it('still reads legacy v1 values written with the fixed-salt PBKDF2 key', () => {
    // Reproduce the v1 writer exactly.
    const key = crypto.pbkdf2Sync(
      'a'.repeat(64), 'complyeasy-credential-salt', 100000, 32, 'sha256',
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(secret, 'utf8', 'base64');
    ct += cipher.final('base64');
    const v1 = `enc_v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${ct}`;
    expect(decryptField(v1)).toBe(secret);
  });

  it('passes through values that are not encrypted', () => {
    expect(decryptField('plain')).toBe('plain');
    expect(encryptField('')).toBe('');
  });
});
