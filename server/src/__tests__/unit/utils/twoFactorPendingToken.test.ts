import { describe, it, expect, jest } from '@jest/globals';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { AppError } from '../../../middleware/errorHandler';
import {
  resolvePendingTwoFactorUserId,
  signPendingTwoFactorToken,
  TWO_FACTOR_PENDING_PURPOSE,
} from '../../../utils/twoFactorPendingToken';

function captureError(fn: () => unknown): AppError {
  try {
    fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('Expected resolvePendingTwoFactorUserId to throw');
}

/** The pending-token signing key, derived the same way the helper derives it. */
function pendingKey(): Buffer {
  return crypto.createHmac('sha256', config.jwt.secret).update('complyeasy:2fa_pending:v1').digest();
}

describe('resolvePendingTwoFactorUserId', () => {
  it('returns the user id from a token issued by signPendingTwoFactorToken', () => {
    const token = signPendingTwoFactorToken('user-1');
    expect(resolvePendingTwoFactorUserId(token)).toBe('user-1');
  });

  it.each([undefined, null, '', 42, { userId: 'user-1' }])('rejects a missing or non-string token (%p) with 400', (value) => {
    const err = captureError(() => resolvePendingTwoFactorUserId(value));
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it('rejects a token signed with another secret with 401', () => {
    const token = jwt.sign({ userId: 'user-1', purpose: TWO_FACTOR_PENDING_PURPOSE }, 'a-different-signing-secret', { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });

  it('rejects an expired token with 401', () => {
    // Issue the token ten minutes in the past so its 5-minute lifetime is over.
    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() - 10 * 60 * 1000);
    const token = signPendingTwoFactorToken('user-1');
    clock.mockRestore();

    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Two-factor token expired or invalid');
  });

  it('rejects an unsigned (alg "none") token with 401', () => {
    const token = jwt.sign({ userId: 'user-1', purpose: TWO_FACTOR_PENDING_PURPOSE }, '', { algorithm: 'none' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });

  it('rejects an access token (signed with the access-token secret) with 401', () => {
    const token = jwt.sign({ userId: 'user-1', email: 'user@example.com' }, config.jwt.secret, { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });

  it('rejects a pending-shaped token signed with the access-token secret with 401', () => {
    const token = jwt.sign({ userId: 'user-1', purpose: TWO_FACTOR_PENDING_PURPOSE }, config.jwt.secret, { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });

  it('rejects a token under the pending key that was issued for a different purpose with 401', () => {
    const token = jwt.sign({ userId: 'user-1', purpose: 'password_reset' }, pendingKey(), { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid two-factor token');
  });

  it('rejects a pending token that names no user with 401', () => {
    const token = jwt.sign({ purpose: TWO_FACTOR_PENDING_PURPOSE }, pendingKey(), { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid two-factor token');
  });
});

describe('signPendingTwoFactorToken', () => {
  // Regression: the pending token used to be signed with the access-token
  // secret. The access-token verifiers check only the signature and userId, so
  // a pending token worked as a Bearer token and skipped the second factor.
  it('issues a token that does not verify under the access-token secret', () => {
    const token = signPendingTwoFactorToken('user-1');
    expect(() => jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] })).toThrow();
  });

  it('issues an HS256 token with the pending purpose and a five-minute lifetime', () => {
    const token = signPendingTwoFactorToken('user-1');
    const decoded = jwt.decode(token, { complete: true }) as jwt.Jwt & { payload: jwt.JwtPayload };
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.purpose).toBe(TWO_FACTOR_PENDING_PURPOSE);
    expect(decoded.payload.userId).toBe('user-1');
    expect((decoded.payload.exp ?? 0) - (decoded.payload.iat ?? 0)).toBe(300);
  });
});
