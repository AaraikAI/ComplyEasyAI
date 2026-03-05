/**
 * Two-Factor Authentication Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import * as twoFactorController from '../controllers/twoFactorController';
import { asyncHandler } from '../types/express';

const router = express.Router();

// Setup 2FA (authenticated users only)
router.post('/setup', authenticate, asyncHandler(twoFactorController.setupTwoFactor));

// Verify and enable 2FA
router.post('/verify-enable', authenticate, asyncHandler(twoFactorController.verifyAndEnable));

// Verify 2FA token during login (public - rate limited to prevent brute-force)
router.post('/verify', authLimiter, asyncHandler(twoFactorController.verifyToken));

// Verify backup code during login (public - rate limited to prevent brute-force)
router.post('/verify-backup', authLimiter, asyncHandler(twoFactorController.verifyBackupCode));

// Disable 2FA (requires authentication)
router.post('/disable', authenticate, asyncHandler(twoFactorController.disableTwoFactor));

// Regenerate backup codes (requires authentication)
router.post('/regenerate-codes', authenticate, asyncHandler(twoFactorController.regenerateBackupCodes));

// Get 2FA status (requires authentication)
router.get('/status', authenticate, asyncHandler(twoFactorController.getTwoFactorStatus));

export default router;
