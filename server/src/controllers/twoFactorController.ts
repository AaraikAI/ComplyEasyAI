/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management endpoints
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import twoFactorService from '../services/twoFactorService';
import logger from '../config/logger';

/**
 * Setup 2FA - Generate secret and QR code
 */
export const setupTwoFactor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const userEmail = authReq.user!.email;

    const setup = await twoFactorService.setupTwoFactor(userId, userEmail);

    res.json({
      success: true,
      data: {
        secret: setup.secret,
        qrCode: setup.qrCodeUrl,
        backupCodes: setup.backupCodes,
      },
      message: 'Scan the QR code with your authenticator app and save the backup codes',
    });
  } catch (error: any) {
    logger.error('Error in setupTwoFactor controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to setup two-factor authentication',
    });
  }
};

/**
 * Verify 2FA token and enable 2FA
 */
export const verifyAndEnable: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    const verified = await twoFactorService.verifyAndEnableTwoFactor(userId, token);

    if (!verified) {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error: any) {
    logger.error('Error in verifyAndEnable controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enable two-factor authentication',
    });
  }
};

/**
 * Verify 2FA token during login
 */
export const verifyToken: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      res.status(400).json({
        success: false,
        error: 'User ID and token are required',
      });
      return;
    }

    const verified = await twoFactorService.verifyTwoFactorToken(userId, token);

    if (!verified) {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication code',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Token verified successfully',
    });
  } catch (error: any) {
    logger.error('Error in verifyToken controller', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify token',
    });
  }
};

/**
 * Verify backup code
 */
export const verifyBackupCode: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      res.status(400).json({
        success: false,
        error: 'User ID and backup code are required',
      });
      return;
    }

    const verified = await twoFactorService.verifyBackupCode(userId, code);

    if (!verified) {
      res.status(401).json({
        success: false,
        error: 'Invalid backup code',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Backup code verified successfully',
    });
  } catch (error: any) {
    logger.error('Error in verifyBackupCode controller', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify backup code',
    });
  }
};

/**
 * Disable 2FA
 */
export const disableTwoFactor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token or backup code is required to disable 2FA',
      });
      return;
    }

    const disabled = await twoFactorService.disableTwoFactor(userId, token);

    if (!disabled) {
      res.status(401).json({
        success: false,
        error: 'Invalid token or backup code',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error: any) {
    logger.error('Error in disableTwoFactor controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disable two-factor authentication',
    });
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required to regenerate backup codes',
      });
      return;
    }

    const backupCodes = await twoFactorService.regenerateBackupCodes(userId, token);

    if (!backupCodes) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        backupCodes,
      },
      message: 'Backup codes regenerated successfully. Save these codes securely.',
    });
  } catch (error: any) {
    logger.error('Error in regenerateBackupCodes controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to regenerate backup codes',
    });
  }
};

/**
 * Get 2FA status
 */
export const getTwoFactorStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const enabled = await twoFactorService.isTwoFactorEnabled(userId);
    const remainingCodes = enabled
      ? await twoFactorService.getRemainingBackupCodesCount(userId)
      : 0;

    res.json({
      success: true,
      data: {
        enabled,
        remainingBackupCodes: remainingCodes,
      },
    });
  } catch (error: any) {
    logger.error('Error in getTwoFactorStatus controller', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get 2FA status',
    });
  }
};
