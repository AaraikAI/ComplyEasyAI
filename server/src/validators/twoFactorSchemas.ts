/**
 * Joi request-body validation schemas for two-factor authentication routes.
 * Used by validateBody middleware to reject invalid input before hitting controllers.
 */
import Joi from 'joi';

// POST /verify-enable — Verify TOTP token and enable 2FA
export const verifyAndEnableSchema = Joi.object({
  token: Joi.string().required().min(4).max(10).trim(),
}).unknown(false);

// The subject of a pre-session 2FA check is identified by the signed
// second-factor-pending token issued after the first factor. A client-supplied
// `userId` is deliberately not accepted (unknown(false) rejects it).
const twoFactorPendingToken = Joi.string().required().min(1).max(2048);

// POST /verify — Verify TOTP token during login
export const verifyTokenSchema = Joi.object({
  twoFactorToken: twoFactorPendingToken,
  token: Joi.string().required().min(4).max(10).trim(),
}).unknown(false);

// POST /verify-backup — Verify backup code during login
export const verifyBackupCodeSchema = Joi.object({
  twoFactorToken: twoFactorPendingToken,
  code: Joi.string().required().min(1).max(50).trim(),
}).unknown(false);

// POST /disable — Disable 2FA (requires current token)
export const disableTwoFactorSchema = Joi.object({
  token: Joi.string().required().min(1).max(50).trim(),
}).unknown(false);

// POST /regenerate-codes — Regenerate backup codes
export const regenerateBackupCodesSchema = Joi.object({
  token: Joi.string().required().min(4).max(10).trim(),
}).unknown(false);
