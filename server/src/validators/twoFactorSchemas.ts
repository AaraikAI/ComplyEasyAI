/**
 * Joi request-body validation schemas for two-factor authentication routes.
 * Used by validateBody middleware to reject invalid input before hitting controllers.
 */
import Joi from 'joi';

// POST /verify-enable — Verify TOTP token and enable 2FA
export const verifyAndEnableSchema = Joi.object({
  token: Joi.string().required().min(4).max(10).trim(),
}).unknown(false);

// POST /verify — Verify TOTP token during login
export const verifyTokenSchema = Joi.object({
  userId: Joi.string().required().min(1).max(200).trim(),
  token: Joi.string().required().min(4).max(10).trim(),
}).unknown(false);

// POST /verify-backup — Verify backup code during login
export const verifyBackupCodeSchema = Joi.object({
  userId: Joi.string().required().min(1).max(200).trim(),
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
