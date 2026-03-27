/**
 * Two-Factor Authentication Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import * as twoFactorController from '../controllers/twoFactorController';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  verifyAndEnableSchema,
  verifyTokenSchema,
  verifyBackupCodeSchema,
  disableTwoFactorSchema,
  regenerateBackupCodesSchema,
} from '../validators/twoFactorSchemas';

const router = express.Router();

// Setup 2FA (authenticated users only, rate limited)
router.post('/setup', authenticate, authLimiter, asyncHandler(twoFactorController.setupTwoFactor));

// Verify and enable 2FA
router.post('/verify-enable', authenticate, validateBody(verifyAndEnableSchema), asyncHandler(twoFactorController.verifyAndEnable));

// Verify 2FA token during login (public - rate limited to prevent brute-force)
router.post('/verify', authLimiter, validateBody(verifyTokenSchema), asyncHandler(twoFactorController.verifyToken));

// Verify backup code during login (public - rate limited to prevent brute-force)
router.post('/verify-backup', authLimiter, validateBody(verifyBackupCodeSchema), asyncHandler(twoFactorController.verifyBackupCode));

// Disable 2FA (requires authentication, rate limited)
router.post('/disable', authenticate, authLimiter, validateBody(disableTwoFactorSchema), asyncHandler(twoFactorController.disableTwoFactor));

// Regenerate backup codes (requires authentication)
router.post('/regenerate-codes', authenticate, validateBody(regenerateBackupCodesSchema), asyncHandler(twoFactorController.regenerateBackupCodes));

// Get 2FA status (requires authentication)
router.get('/status', authenticate, asyncHandler(twoFactorController.getTwoFactorStatus));

export default router;
