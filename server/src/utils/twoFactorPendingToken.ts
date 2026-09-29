/**
 * Second-factor-pending token.
 *
 * Password and magic-link login respond with a short-lived signed JWT
 * (`purpose: '2fa_pending'`, 5-minute expiry) instead of a session when the
 * account has 2FA enabled. That token is the only server-verifiable evidence
 * that the first factor was satisfied, so every pre-session 2FA endpoint must
 * derive the subject user from it — never from a user id sent by the client.
 *
 * The token is signed with its own key, derived from the access-token secret.
 * The access-token verifiers (middleware/auth.ts, graphql/index.ts,
 * services/websocketService.ts, services/advanced/webrtcSignalingService.ts)
 * check only the signature and then load the user named by `userId`. Signed
 * with the access-token secret itself, a pending token therefore passed those
 * checks as a Bearer token, so the password alone gave a full session and the
 * second factor was never asked for. A separate key makes that impossible.
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppError } from '../middleware/errorHandler';

export const TWO_FACTOR_PENDING_PURPOSE = '2fa_pending';

const TWO_FACTOR_PENDING_TTL = '5m';
const TWO_FACTOR_PENDING_KEY_LABEL = 'complyeasy:2fa_pending:v1';

/**
 * HMAC-SHA256 of a fixed label under the access-token secret. Deterministic,
 * so every server instance derives the same key, and never equal to the
 * access-token secret, so a pending token cannot verify as an access token
 * (or the reverse).
 */
function pendingTokenKey(): Buffer {
  return crypto
    .createHmac('sha256', config.jwt.secret)
    .update(TWO_FACTOR_PENDING_KEY_LABEL)
    .digest();
}

/**
 * Issue a second-factor-pending token for a user who has passed the first
 * factor. Valid for five minutes and only accepted by
 * resolvePendingTwoFactorUserId.
 */
export function signPendingTwoFactorToken(userId: string): string {
  return jwt.sign(
    { userId, purpose: TWO_FACTOR_PENDING_PURPOSE },
    pendingTokenKey(),
    { algorithm: 'HS256', expiresIn: TWO_FACTOR_PENDING_TTL }
  );
}

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
    decoded = jwt.verify(twoFactorToken, pendingTokenKey(), { algorithms: ['HS256'] });
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
