/**
 * Two-Factor Authentication Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import * as twoFactorController from '../controllers/twoFactorController';

const router = express.Router();

// Setup 2FA (authenticated users only)
router.post('/setup', authenticate, twoFactorController.setupTwoFactor);

// Verify and enable 2FA
router.post('/verify-enable', authenticate, twoFactorController.verifyAndEnable);

// Verify 2FA token during login (public - no auth required)
router.post('/verify', twoFactorController.verifyToken);

// Verify backup code during login (public - no auth required)
router.post('/verify-backup', twoFactorController.verifyBackupCode);

// Disable 2FA (requires authentication)
router.post('/disable', authenticate, twoFactorController.disableTwoFactor);

// Regenerate backup codes (requires authentication)
router.post('/regenerate-codes', authenticate, twoFactorController.regenerateBackupCodes);

// Get 2FA status (requires authentication)
router.get('/status', authenticate, twoFactorController.getTwoFactorStatus);

export default router;
