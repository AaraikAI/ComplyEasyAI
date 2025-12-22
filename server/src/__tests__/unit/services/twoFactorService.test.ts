/**
 * Two-Factor Authentication Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock speakeasy
const mockGenerateSecret = jest.fn();
const mockTotpVerify = jest.fn();
const mockTotpGenerate = jest.fn();

jest.mock('speakeasy', () => ({
  __esModule: true,
  default: {
    generateSecret: mockGenerateSecret,
    totp: {
      verify: mockTotpVerify,
      generate: mockTotpGenerate,
    },
  },
}));

// Mock QRCode
const mockToDataURL = jest.fn();
jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: mockToDataURL,
  },
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import twoFactorService from '../../../services/twoFactorService';

describe('TwoFactorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateSecret.mockReturnValue({
      ascii: 'test-secret',
      hex: '746573742d736563726574',
      base32: 'MFRGG43FMZQXIZLS',
      otpauth_url: 'otpauth://totp/ComplyEasy%20AI?secret=MFRGG43FMZQXIZLS',
    });
    mockToDataURL.mockResolvedValue('data:image/png;base64,test-qr-code');
    mockTotpVerify.mockReturnValue(true);
    mockTotpGenerate.mockReturnValue('123456');
  });

  describe('setupTwoFactor()', () => {
    it('should setup 2FA for user', async () => {
      const userId = 'user-123';
      const userEmail = 'user@example.com';

      prismaMock.user.update.mockResolvedValue({
        id: userId,
        email: userEmail,
        twoFactorSecret: 'encrypted-secret',
        twoFactorVerified: false,
      } as any);

      prismaMock.twoFactorBackupCode.createMany.mockResolvedValue({ count: 8 } as any);

      const result = await twoFactorService.setupTwoFactor(userId, userEmail);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(8);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('should throw error if secret generation fails', async () => {
      mockGenerateSecret.mockReturnValue({
        base32: 'MFRGG43FMZQXIZLS',
        // Missing otpauth_url
      });

      await expect(
        twoFactorService.setupTwoFactor('user-123', 'user@example.com')
      ).rejects.toThrow('Failed to generate OTP auth URL');
    });

    it('should encrypt secret before storing', async () => {
      const userId = 'user-123';
      const userEmail = 'user@example.com';

      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.twoFactorBackupCode.createMany.mockResolvedValue({ count: 8 } as any);

      await twoFactorService.setupTwoFactor(userId, userEmail);

      const updateCall = prismaMock.user.update.mock.calls[0];
      expect(updateCall[0].data.twoFactorSecret).toBeDefined();
      expect(updateCall[0].data.twoFactorSecret).not.toBe('MFRGG43FMZQXIZLS');
    });
  });

  describe('verifyAndEnableTwoFactor()', () => {
    it('should verify token and enable 2FA', async () => {
      const userId = 'user-123';
      const token = '123456';

      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorSecret: 'encrypted-secret',
        twoFactorEnabled: false,
      } as any);

      prismaMock.user.update.mockResolvedValue({
        id: userId,
        twoFactorEnabled: true,
      } as any);

      const result = await twoFactorService.verifyAndEnableTwoFactor(userId, token);

      expect(result).toBe(true);
      expect(mockTotpVerify).toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            twoFactorEnabled: true,
            twoFactorVerified: true,
          }),
        })
      );
    });

    it('should reject if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        twoFactorService.verifyAndEnableTwoFactor('user-123', '123456')
      ).rejects.toThrow('2FA not set up for this user');
    });

    it('should reject if 2FA already enabled', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        twoFactorSecret: 'encrypted-secret',
        twoFactorEnabled: true,
      } as any);

      await expect(
        twoFactorService.verifyAndEnableTwoFactor('user-123', '123456')
      ).rejects.toThrow('2FA already enabled');
    });

    it('should reject invalid token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        twoFactorSecret: 'encrypted-secret',
        twoFactorEnabled: false,
      } as any);

      mockTotpVerify.mockReturnValue(false);

      const result = await twoFactorService.verifyAndEnableTwoFactor('user-123', 'invalid');

      expect(result).toBe(false);
    });
  });

  describe('verifyToken()', () => {
    it('should verify valid TOTP token', async () => {
      const userId = 'user-123';
      const token = '123456';

      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorSecret: 'encrypted-secret',
        twoFactorEnabled: true,
      } as any);

      const result = await twoFactorService.verifyToken(userId, token);

      expect(result).toBe(true);
      expect(mockTotpVerify).toHaveBeenCalled();
    });

    it('should verify backup code', async () => {
      const userId = 'user-123';
      const backupCode = 'BACKUP123';

      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorEnabled: true,
      } as any);

      prismaMock.twoFactorBackupCode.findFirst.mockResolvedValue({
        id: 'code-123',
        code: 'hashed-code',
        used: false,
      } as any);

      prismaMock.twoFactorBackupCode.update.mockResolvedValue({} as any);

      const result = await twoFactorService.verifyToken(userId, backupCode);

      expect(result).toBe(true);
    });

    it('should reject invalid token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        twoFactorSecret: 'encrypted-secret',
        twoFactorEnabled: true,
      } as any);

      mockTotpVerify.mockReturnValue(false);
      prismaMock.twoFactorBackupCode.findFirst.mockResolvedValue(null);

      const result = await twoFactorService.verifyToken('user-123', 'invalid');

      expect(result).toBe(false);
    });
  });

  describe('disableTwoFactor()', () => {
    it('should disable 2FA for user', async () => {
      const userId = 'user-123';

      prismaMock.user.update.mockResolvedValue({
        id: userId,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as any);

      prismaMock.twoFactorBackupCode.deleteMany.mockResolvedValue({ count: 8 } as any);

      await twoFactorService.disableTwoFactor(userId);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            twoFactorEnabled: false,
            twoFactorSecret: null,
          }),
        })
      );
      expect(prismaMock.twoFactorBackupCode.deleteMany).toHaveBeenCalled();
    });
  });

  describe('generateBackupCodes()', () => {
    it('should generate 8 backup codes', () => {
      const codes = (twoFactorService as any).generateBackupCodes(8);

      expect(codes).toHaveLength(8);
      codes.forEach((code: string) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should generate unique backup codes', () => {
      const codes = (twoFactorService as any).generateBackupCodes(10);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });
});

