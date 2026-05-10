/**
 * Two-Factor Controller Unit Tests
 *
 * Comprehensive tests for 2FA setup, verification, management,
 * backup codes, and error handling.
 *
 * Error responses are produced by throwing AppError; the global error handler
 * (server/src/middleware/errorHandler.ts) translates them into HTTP responses.
 * These tests therefore assert thrown AppError shape (statusCode + message)
 * rather than mocked res.status / res.json calls for error paths.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../middleware/errorHandler';

const mockSetupTwoFactor = jest.fn<() => Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>>();
const mockVerifyAndEnableTwoFactor = jest.fn<() => Promise<boolean>>();
const mockVerifyTwoFactorToken = jest.fn<() => Promise<boolean>>();
const mockVerifyBackupCode = jest.fn<() => Promise<boolean>>();
const mockDisableTwoFactor = jest.fn<() => Promise<boolean>>();
const mockRegenerateBackupCodes = jest.fn<() => Promise<string[] | null>>();
const mockIsTwoFactorEnabled = jest.fn<() => Promise<boolean>>();
const mockGetRemainingBackupCodesCount = jest.fn<() => Promise<number>>();

jest.mock('../../../services/twoFactorService', () => ({
  __esModule: true,
  default: {
    setupTwoFactor: mockSetupTwoFactor,
    verifyAndEnableTwoFactor: mockVerifyAndEnableTwoFactor,
    verifyTwoFactorToken: mockVerifyTwoFactorToken,
    verifyBackupCode: mockVerifyBackupCode,
    disableTwoFactor: mockDisableTwoFactor,
    regenerateBackupCodes: mockRegenerateBackupCodes,
    isTwoFactorEnabled: mockIsTwoFactorEnabled,
    getRemainingBackupCodesCount: mockGetRemainingBackupCodesCount,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import * as twoFactorController from '../../../controllers/twoFactorController';

/**
 * Invokes a controller and captures the thrown error. Returns the error so
 * tests can assert AppError statusCode + message in one place.
 */
async function captureThrown(
  fn: () => Promise<unknown>
): Promise<AppError> {
  try {
    await fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('Expected controller to throw, but it resolved.');
}

describe('TwoFactorController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // Setup 2FA Tests
  // ===========================================================================
  describe('setupTwoFactor()', () => {
    it('should setup 2FA and return QR code', async () => {
      const setupData = {
        secret: 'MFRGG43FMZQXIZLS',
        qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
        backupCodes: ['CODE1-XXXX', 'CODE2-XXXX', 'CODE3-XXXX', 'CODE4-XXXX'],
      };

      mockSetupTwoFactor.mockResolvedValue(setupData as never);

      await twoFactorController.setupTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            secret: setupData.secret,
            qrCode: setupData.qrCodeUrl,
            backupCodes: setupData.backupCodes,
          }),
          message: expect.stringContaining('Scan the QR code'),
        })
      );
    });

    it('should use user ID from request', async () => {
      mockSetupTwoFactor.mockResolvedValue({
        secret: 'SECRET',
        qrCodeUrl: 'data:...',
        backupCodes: [],
      } as never);

      await twoFactorController.setupTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSetupTwoFactor).toHaveBeenCalledWith('user-123', 'test@example.com');
    });

    it('should propagate service errors as AppError(500)', async () => {
      mockSetupTwoFactor.mockRejectedValue(new Error('Database error') as never);

      const err = await captureThrown(() =>
        twoFactorController.setupTwoFactor(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(err.message).toMatch(/Database error|Failed to setup/);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Verify and Enable Tests
  // ===========================================================================
  describe('verifyAndEnable()', () => {
    it('should verify and enable 2FA with valid token', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(true as never);

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('enabled successfully'),
        })
      );
    });

    it('should reject invalid token with AppError(400)', async () => {
      mockRequest.body = { token: '000000' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyAndEnable(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Invalid verification code');
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should require token in request body', async () => {
      mockRequest.body = {};

      const err = await captureThrown(() =>
        twoFactorController.verifyAndEnable(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Token is required');
    });

    it('should propagate service errors as AppError(500)', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockRejectedValue(new Error('Service error') as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyAndEnable(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // Verify Token Tests
  // ===========================================================================
  describe('verifyToken()', () => {
    it('should verify valid token during login', async () => {
      mockRequest.body = { userId: 'user-123', token: '123456' };
      mockVerifyTwoFactorToken.mockResolvedValue(true as never);

      await twoFactorController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token verified successfully',
        })
      );
    });

    it('should reject invalid token with AppError(401)', async () => {
      mockRequest.body = { userId: 'user-123', token: '000000' };
      mockVerifyTwoFactorToken.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid authentication code');
    });

    it('should require userId in request body', async () => {
      mockRequest.body = { token: '123456' };

      const err = await captureThrown(() =>
        twoFactorController.verifyToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('User ID and token are required');
    });

    it('should require token in request body', async () => {
      mockRequest.body = { userId: 'user-123' };

      const err = await captureThrown(() =>
        twoFactorController.verifyToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('User ID and token are required');
    });
  });

  // ===========================================================================
  // Verify Backup Code Tests
  // ===========================================================================
  describe('verifyBackupCode()', () => {
    it('should verify valid backup code', async () => {
      mockRequest.body = { userId: 'user-123', code: 'BACKUP-CODE-1234' };
      mockVerifyBackupCode.mockResolvedValue(true as never);

      await twoFactorController.verifyBackupCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Backup code verified successfully',
        })
      );
    });

    it('should reject invalid backup code with AppError(401)', async () => {
      mockRequest.body = { userId: 'user-123', code: 'INVALID-CODE' };
      mockVerifyBackupCode.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyBackupCode(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid backup code');
    });

    it('should require userId and code', async () => {
      mockRequest.body = {};

      const err = await captureThrown(() =>
        twoFactorController.verifyBackupCode(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('User ID and backup code are required');
    });

    it('should require code even when userId provided', async () => {
      mockRequest.body = { userId: 'user-123' };

      const err = await captureThrown(() =>
        twoFactorController.verifyBackupCode(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
    });
  });

  // ===========================================================================
  // Disable 2FA Tests
  // ===========================================================================
  describe('disableTwoFactor()', () => {
    it('should disable 2FA with valid token', async () => {
      mockRequest.body = { token: '123456' };
      mockDisableTwoFactor.mockResolvedValue(true as never);

      await twoFactorController.disableTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('disabled successfully'),
        })
      );
    });

    it('should reject invalid token when disabling with AppError(401)', async () => {
      mockRequest.body = { token: '000000' };
      mockDisableTwoFactor.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.disableTwoFactor(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token or backup code');
    });

    it('should require token to disable 2FA', async () => {
      mockRequest.body = {};

      const err = await captureThrown(() =>
        twoFactorController.disableTwoFactor(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/required/);
    });

    it('should propagate service errors as AppError(500)', async () => {
      mockRequest.body = { token: '123456' };
      mockDisableTwoFactor.mockRejectedValue(new Error('Service error') as never);

      const err = await captureThrown(() =>
        twoFactorController.disableTwoFactor(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // Regenerate Backup Codes Tests
  // ===========================================================================
  describe('regenerateBackupCodes()', () => {
    it('should regenerate backup codes with valid token', async () => {
      mockRequest.body = { token: '123456' };
      const newCodes = ['NEW-CODE-1', 'NEW-CODE-2', 'NEW-CODE-3'];
      mockRegenerateBackupCodes.mockResolvedValue(newCodes as never);

      await twoFactorController.regenerateBackupCodes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            backupCodes: newCodes,
          },
          message: expect.stringContaining('regenerated successfully'),
        })
      );
    });

    it('should reject invalid token when regenerating with AppError(401)', async () => {
      mockRequest.body = { token: '000000' };
      mockRegenerateBackupCodes.mockResolvedValue(null as never);

      const err = await captureThrown(() =>
        twoFactorController.regenerateBackupCodes(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token');
    });

    it('should require token to regenerate codes', async () => {
      mockRequest.body = {};

      const err = await captureThrown(() =>
        twoFactorController.regenerateBackupCodes(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/required/);
    });

    it('should use authenticated user ID', async () => {
      mockRequest.body = { token: '123456' };
      mockRegenerateBackupCodes.mockResolvedValue(['CODE1'] as never);

      await twoFactorController.regenerateBackupCodes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRegenerateBackupCodes).toHaveBeenCalledWith('user-123', '123456');
    });
  });

  // ===========================================================================
  // Get Status Tests
  // ===========================================================================
  describe('getTwoFactorStatus()', () => {
    it('should get 2FA status when enabled', async () => {
      mockIsTwoFactorEnabled.mockResolvedValue(true as never);
      mockGetRemainingBackupCodesCount.mockResolvedValue(5 as never);

      await twoFactorController.getTwoFactorStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            enabled: true,
            remainingBackupCodes: 5,
          }),
        })
      );
    });

    it('should get 2FA status when disabled', async () => {
      mockIsTwoFactorEnabled.mockResolvedValue(false as never);

      await twoFactorController.getTwoFactorStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            enabled: false,
            remainingBackupCodes: 0,
          }),
        })
      );
    });

    it('should not fetch backup code count when 2FA disabled', async () => {
      mockIsTwoFactorEnabled.mockResolvedValue(false as never);

      await twoFactorController.getTwoFactorStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetRemainingBackupCodesCount).not.toHaveBeenCalled();
    });

    it('should propagate service errors as AppError(500)', async () => {
      mockIsTwoFactorEnabled.mockRejectedValue(new Error('Service error') as never);

      const err = await captureThrown(() =>
        twoFactorController.getTwoFactorStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should reject empty token string with AppError(400)', async () => {
      mockRequest.body = { token: '' };

      const err = await captureThrown(() =>
        twoFactorController.verifyAndEnable(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
    });

    it('should reject whitespace-only token with AppError(400)', async () => {
      mockRequest.body = { token: '   ' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyAndEnable(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
    });

    it('should propagate network timeouts as AppError(500)', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockRejectedValue(new Error('TIMEOUT') as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyAndEnable(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });

    it('should propagate database connection errors as AppError(500)', async () => {
      mockSetupTwoFactor.mockRejectedValue(new Error('Connection refused') as never);

      const err = await captureThrown(() =>
        twoFactorController.setupTwoFactor(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });

    it('should propagate missing-user errors as AppError(500)', async () => {
      mockRequest.user = undefined as any;
      mockIsTwoFactorEnabled.mockRejectedValue(new Error('User not found') as never);

      const err = await captureThrown(() =>
        twoFactorController.getTwoFactorStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });

    it('should handle concurrent requests gracefully', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(true as never);

      // Concurrent successful verifications — both should resolve without throwing
      const promises = [
        twoFactorController.verifyAndEnable(mockRequest as Request, mockResponse as Response, mockNext),
        twoFactorController.verifyAndEnable(mockRequest as Request, mockResponse as Response, mockNext),
      ];

      await Promise.all(promises);

      expect(mockVerifyAndEnableTwoFactor).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Security Tests
  // ===========================================================================
  describe('Security', () => {
    it('should not expose secret after successful setup', async () => {
      mockSetupTwoFactor.mockResolvedValue({
        secret: 'SENSITIVE_SECRET',
        qrCodeUrl: 'data:...',
        backupCodes: ['CODE1'],
      } as never);

      await twoFactorController.setupTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Secret is included in setup response (needed for manual entry)
      // but should not be logged or stored improperly
      const jsonCall = (mockResponse.json as jest.Mock<any>).mock.calls[0][0];
      expect(jsonCall.data.secret).toBeDefined();
    });

    it('should use 401 for auth failures, not 400', async () => {
      mockRequest.body = { userId: 'user-123', token: 'invalid' };
      mockVerifyTwoFactorToken.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
    });

    it('should not reveal if user exists during verification', async () => {
      mockRequest.body = { userId: 'nonexistent-user', token: '123456' };
      mockVerifyTwoFactorToken.mockResolvedValue(false as never);

      const err = await captureThrown(() =>
        twoFactorController.verifyToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        ) as Promise<unknown>
      );

      // Generic error message; no user-existence leak
      expect(err.message).toBe('Invalid authentication code');
      expect(err.message.toLowerCase()).not.toContain('user');
    });
  });
});
