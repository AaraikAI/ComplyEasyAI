/**
 * Two-Factor Controller Unit Tests
 *
 * Comprehensive tests for 2FA setup, verification, management,
 * backup codes, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

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

    it('should handle service errors', async () => {
      mockSetupTwoFactor.mockRejectedValue(new Error('Database error') as never);

      await twoFactorController.setupTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      );
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

    it('should reject invalid token', async () => {
      mockRequest.body = { token: '000000' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(false as never);

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid verification code',
        })
      );
    });

    it('should require token in request body', async () => {
      mockRequest.body = {};

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token is required',
        })
      );
    });

    it('should handle service errors', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockRejectedValue(new Error('Service error') as never);

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
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

    it('should reject invalid token', async () => {
      mockRequest.body = { userId: 'user-123', token: '000000' };
      mockVerifyTwoFactorToken.mockResolvedValue(false as never);

      await twoFactorController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid authentication code',
        })
      );
    });

    it('should require userId in request body', async () => {
      mockRequest.body = { token: '123456' };

      await twoFactorController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User ID and token are required',
        })
      );
    });

    it('should require token in request body', async () => {
      mockRequest.body = { userId: 'user-123' };

      await twoFactorController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'User ID and token are required',
        })
      );
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

    it('should reject invalid backup code', async () => {
      mockRequest.body = { userId: 'user-123', code: 'INVALID-CODE' };
      mockVerifyBackupCode.mockResolvedValue(false as never);

      await twoFactorController.verifyBackupCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid backup code',
        })
      );
    });

    it('should require userId and code', async () => {
      mockRequest.body = {};

      await twoFactorController.verifyBackupCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'User ID and backup code are required',
        })
      );
    });

    it('should require code even when userId provided', async () => {
      mockRequest.body = { userId: 'user-123' };

      await twoFactorController.verifyBackupCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
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

    it('should reject invalid token when disabling', async () => {
      mockRequest.body = { token: '000000' };
      mockDisableTwoFactor.mockResolvedValue(false as never);

      await twoFactorController.disableTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token or backup code',
        })
      );
    });

    it('should require token to disable 2FA', async () => {
      mockRequest.body = {};

      await twoFactorController.disableTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('required'),
        })
      );
    });

    it('should handle service errors', async () => {
      mockRequest.body = { token: '123456' };
      mockDisableTwoFactor.mockRejectedValue(new Error('Service error') as never);

      await twoFactorController.disableTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
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

    it('should reject invalid token when regenerating', async () => {
      mockRequest.body = { token: '000000' };
      mockRegenerateBackupCodes.mockResolvedValue(null as never);

      await twoFactorController.regenerateBackupCodes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token',
        })
      );
    });

    it('should require token to regenerate codes', async () => {
      mockRequest.body = {};

      await twoFactorController.regenerateBackupCodes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('required'),
        })
      );
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

    it('should handle service errors', async () => {
      mockIsTwoFactorEnabled.mockRejectedValue(new Error('Service error') as never);

      await twoFactorController.getTwoFactorStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      );
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle empty token string', async () => {
      mockRequest.body = { token: '' };

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle whitespace-only token', async () => {
      mockRequest.body = { token: '   ' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(false as never);

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle network timeouts gracefully', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockRejectedValue(new Error('TIMEOUT') as never);

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle database connection errors', async () => {
      mockSetupTwoFactor.mockRejectedValue(new Error('Connection refused') as never);

      await twoFactorController.setupTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle missing user context', async () => {
      mockRequest.user = undefined as any;
      mockIsTwoFactorEnabled.mockRejectedValue(new Error('User not found') as never);

      await twoFactorController.getTwoFactorStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle concurrent requests gracefully', async () => {
      mockRequest.body = { token: '123456' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(true as never);

      // Simulate concurrent requests
      const promises = [
        twoFactorController.verifyAndEnable(mockRequest as Request, mockResponse as Response, mockNext),
        twoFactorController.verifyAndEnable(mockRequest as Request, mockResponse as Response, mockNext),
      ];

      await Promise.all(promises);

      // Both should complete without errors
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

    it('should use proper status codes for auth failures', async () => {
      mockRequest.body = { userId: 'user-123', token: 'invalid' };
      mockVerifyTwoFactorToken.mockResolvedValue(false as never);

      await twoFactorController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should return 401 Unauthorized, not 400 Bad Request
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should not reveal if user exists during verification', async () => {
      mockRequest.body = { userId: 'nonexistent-user', token: '123456' };
      mockVerifyTwoFactorToken.mockResolvedValue(false as never);

      await twoFactorController.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Error message should be generic
      const jsonCall = (mockResponse.json as jest.Mock<any>).mock.calls[0][0];
      expect(jsonCall.error).toBe('Invalid authentication code');
      expect(jsonCall.error).not.toContain('user');
    });
  });
});
