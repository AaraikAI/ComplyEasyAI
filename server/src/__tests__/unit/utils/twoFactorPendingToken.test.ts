import { describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { AppError } from '../../../middleware/errorHandler';
import {
  resolvePendingTwoFactorUserId,
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

describe('resolvePendingTwoFactorUserId', () => {
  it('returns the user id from a server-signed second-factor-pending token', () => {
    const token = jwt.sign({ userId: 'user-1', purpose: TWO_FACTOR_PENDING_PURPOSE }, config.jwt.secret, { expiresIn: '5m' });
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
    const token = jwt.sign({ userId: 'user-1', purpose: TWO_FACTOR_PENDING_PURPOSE, exp: 1 }, config.jwt.secret);
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });

  it('rejects an unsigned (alg "none") token with 401', () => {
    const token = jwt.sign({ userId: 'user-1', purpose: TWO_FACTOR_PENDING_PURPOSE }, '', { algorithm: 'none' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });

  it('rejects a server-signed token issued for a different purpose with 401', () => {
    const token = jwt.sign({ userId: 'user-1', email: 'user@example.com' }, config.jwt.secret, { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid two-factor token');
  });

  it('rejects a pending token that names no user with 401', () => {
    const token = jwt.sign({ purpose: TWO_FACTOR_PENDING_PURPOSE }, config.jwt.secret, { expiresIn: '5m' });
    const err = captureError(() => resolvePendingTwoFactorUserId(token));
    expect(err.statusCode).toBe(401);
  });
});
