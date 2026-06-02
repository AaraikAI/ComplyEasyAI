/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management endpoints
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import twoFactorService from '../services/twoFactorService';
import { logControllerAction } from '../services/auditLogService';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Setup 2FA - Generate secret and QR code
 */
export const setupTwoFactor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const userEmail = authReq.user!.email;

    const setup = await twoFactorService.setupTwoFactor(userId, userEmail);

    await logControllerAction(req, '2fa.setup_initiated', {
      backupCodeCount: setup.backupCodes.length,
    });

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
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to setup two-factor authentication', 500);
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
      throw new AppError('Token is required', 400);
    }

    const verified = await twoFactorService.verifyAndEnableTwoFactor(userId, token);

    if (!verified) {
      throw new AppError('Invalid verification code', 400);
    }

    await logControllerAction(req, '2fa.enabled', { ip: req.ip });

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error: any) {
    logger.error('Error in verifyAndEnable controller', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to enable two-factor authentication', 500);
  }
};

/**
 * Verify 2FA token during login
 */
export const verifyToken: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      throw new AppError('User ID and token are required', 400);
    }

    const verified = await twoFactorService.verifyTwoFactorToken(userId, token);

    if (!verified) {
      throw new AppError('Invalid authentication code', 401);
    }

    res.json({
      success: true,
      message: 'Token verified successfully',
    });
  } catch (error: any) {
    logger.error('Error in verifyToken controller', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to verify token', 500);
  }
};

/**
 * Verify backup code
 */
export const verifyBackupCode: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      throw new AppError('User ID and backup code are required', 400);
    }

    const verified = await twoFactorService.verifyBackupCode(userId, code);

    if (!verified) {
      throw new AppError('Invalid backup code', 401);
    }

    res.json({
      success: true,
      message: 'Backup code verified successfully',
    });
  } catch (error: any) {
    logger.error('Error in verifyBackupCode controller', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to verify backup code', 500);
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
      throw new AppError('Token or backup code is required to disable 2FA', 400);
    }

    const disabled = await twoFactorService.disableTwoFactor(userId, token);

    if (!disabled) {
      throw new AppError('Invalid token or backup code', 401);
    }

    await logControllerAction(req, '2fa.disabled', { ip: req.ip });

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error: any) {
    logger.error('Error in disableTwoFactor controller', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to disable two-factor authentication', 500);
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
      throw new AppError('Token is required to regenerate backup codes', 400);
    }

    const backupCodes = await twoFactorService.regenerateBackupCodes(userId, token);

    if (!backupCodes) {
      throw new AppError('Invalid token', 401);
    }

    await logControllerAction(req, '2fa.backup_codes_regenerated', {
      backupCodeCount: backupCodes.length,
    });

    res.json({
      success: true,
      data: {
        backupCodes,
      },
      message: 'Backup codes regenerated successfully. Save these codes securely.',
    });
  } catch (error: any) {
    logger.error('Error in regenerateBackupCodes controller', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to regenerate backup codes', 500);
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
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get 2FA status', 500);
  }
};
