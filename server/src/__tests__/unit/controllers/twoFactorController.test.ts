/**
 * Two-Factor Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

const mockSetupTwoFactor = jest.fn<() => Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>>();
const mockVerifyAndEnableTwoFactor = jest.fn<() => Promise<boolean>>();
const mockVerifyTwoFactorToken = jest.fn<() => Promise<boolean>>();
const mockVerifyBackupCode = jest.fn<() => Promise<boolean>>();
const mockDisableTwoFactor = jest.fn<() => Promise<boolean>>();
const mockRegenerateBackupCodes = jest.fn<() => Promise<string[]>>();
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
      },
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  describe('setupTwoFactor()', () => {
    it('should setup 2FA and return QR code', async () => {
      mockSetupTwoFactor.mockResolvedValue({
        secret: 'MFRGG43FMZQXIZLS',
        qrCodeUrl: 'data:image/png;base64,...',
        backupCodes: ['CODE1', 'CODE2'],
      } as never);

      await twoFactorController.setupTwoFactor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            secret: expect.any(String),
            qrCode: expect.any(String),
            backupCodes: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('verifyAndEnable()', () => {
    it('should verify and enable 2FA', async () => {
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
        })
      );
    });

    it('should reject invalid token', async () => {
      mockRequest.body = { token: 'invalid' };
      mockVerifyAndEnableTwoFactor.mockResolvedValue(false as never);

      await twoFactorController.verifyAndEnable(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('disableTwoFactor()', () => {
    it('should disable 2FA', async () => {
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
        })
      );
    });
  });

  describe('getTwoFactorStatus()', () => {
    it('should get 2FA status', async () => {
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
  });
});
