/**
 * Second-factor-pending token.
 *
 * Password and magic-link login respond with a short-lived signed JWT
 * (`purpose: '2fa_pending'`, 5-minute expiry) instead of a session when the
 * account has 2FA enabled. That token is the only server-verifiable evidence
 * that the first factor was satisfied, so every pre-session 2FA endpoint must
 * derive the subject user from it — never from a user id sent by the client.
 */
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppError } from '../middleware/errorHandler';

export const TWO_FACTOR_PENDING_PURPOSE = '2fa_pending';

/**
 * Verify a second-factor-pending token and return the user id it was issued
 * for. Throws AppError(400) when the token is absent and AppError(401) when it
 * is expired, forged, signed for another purpose, or carries no user id.
 */
export function resolvePendingTwoFactorUserId(twoFactorToken: unknown): string {
  if (typeof twoFactorToken !== 'string' || twoFactorToken.length === 0) {
    throw new AppError('Two-factor token is required', 400);
  }

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(twoFactorToken, config.jwt.secret, { algorithms: ['HS256'] });
  } catch (error) {
    const wrapped = new AppError('Two-factor token expired or invalid', 401);
    (wrapped as AppError & { cause?: unknown }).cause = error;
    throw wrapped;
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    decoded.purpose !== TWO_FACTOR_PENDING_PURPOSE ||
    typeof decoded.userId !== 'string' ||
    decoded.userId.length === 0
  ) {
    throw new AppError('Invalid two-factor token', 401);
  }

  return decoded.userId;
}
