/**
 * Two-Factor Authentication Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock speakeasy
const mockGenerateSecret = jest.fn() as jest.Mock<any>;
const mockTotpVerify = jest.fn() as jest.Mock<any>;
const mockTotpGenerate = jest.fn() as jest.Mock<any>;

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
const mockToDataURL = jest.fn() as jest.Mock<any>;
jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: mockToDataURL,
  },
}));

// Mock bcryptjs
const mockBcryptCompare = jest.fn() as jest.Mock<any>;
const mockBcryptHash = jest.fn() as jest.Mock<any>;
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
  compare: mockBcryptCompare,
  hash: mockBcryptHash,
}));

// Mock fipsPasswordHashing (service now uses this instead of bcrypt)
const mockFipsVerifyPassword = jest.fn() as jest.Mock<any>;
const mockFipsHashPassword = jest.fn() as jest.Mock<any>;
jest.mock('../../../utils/fipsPasswordHashing', () => ({
  __esModule: true,
  verifyPassword: mockFipsVerifyPassword,
  hashPassword: mockFipsHashPassword,
  needsRehash: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
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

    // Re-establish fipsPasswordHashing mocks (cleared by resetMocks)
    mockFipsVerifyPassword.mockResolvedValue(false);
    mockFipsHashPassword.mockResolvedValue('hashed-code');
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
      ).rejects.toThrow('Failed to setup two-factor authentication');
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
    // Helper to mock crypto for decryptSecret
    function withMockedCrypto(fn: () => Promise<void>) {
      return async () => {
        const cryptoMod = require('crypto');
        const origScrypt = cryptoMod.scryptSync;
        const origDecipher = cryptoMod.createDecipheriv;
        cryptoMod.scryptSync = jest.fn().mockReturnValue(Buffer.alloc(32, 0));
        const mockDecipher = {
          update: jest.fn().mockReturnValue(Buffer.from('MYSECRETBASE32')),
          final: jest.fn().mockReturnValue(Buffer.alloc(0)),
        };
        cryptoMod.createDecipheriv = jest.fn().mockReturnValue(mockDecipher);
        try {
          await fn();
        } finally {
          cryptoMod.scryptSync = origScrypt;
          cryptoMod.createDecipheriv = origDecipher;
        }
      };
    }

    it('should verify token and enable 2FA', withMockedCrypto(async () => {
      const userId = 'user-123';
      const token = '123456';

      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorSecret: '0000000000000000:encrypted',
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
    }));

    it('should reject if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        twoFactorService.verifyAndEnableTwoFactor('user-123', '123456')
      ).rejects.toThrow('Failed to verify two-factor authentication');
    });

    it('should reject if 2FA already enabled', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        twoFactorSecret: '0000000000000000:encrypted',
        twoFactorEnabled: true,
      } as any);

      await expect(
        twoFactorService.verifyAndEnableTwoFactor('user-123', '123456')
      ).rejects.toThrow('Failed to verify two-factor authentication');
    });

    it('should reject invalid token', withMockedCrypto(async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        twoFactorSecret: '0000000000000000:encrypted',
        twoFactorEnabled: false,
      } as any);

      mockTotpVerify.mockReturnValue(false);

      const result = await twoFactorService.verifyAndEnableTwoFactor('user-123', 'invalid');

      expect(result).toBe(false);
    }));
  });

  describe('verifyToken()', () => {
    it('should verify valid TOTP token', async () => {
      const userId = 'user-123';
      const token = '123456';

      mockTotpVerify.mockReturnValue(true);
      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorSecret: '0000000000000000:encrypted',
        twoFactorEnabled: true,
        twoFactorVerified: true,
      } as any);

      // Mock crypto for decryptSecret
      const crypto = require('crypto');
      const originalScryptSync = crypto.scryptSync;
      const originalCreateDecipheriv = crypto.createDecipheriv;
      crypto.scryptSync = jest.fn().mockReturnValue(Buffer.alloc(32, 0));
      const mockDecipher = {
        update: jest.fn().mockReturnValue(Buffer.from('MYSECRETBASE32')),
        final: jest.fn().mockReturnValue(Buffer.alloc(0)),
      };
      crypto.createDecipheriv = jest.fn().mockReturnValue(mockDecipher);

      try {
        const result = await twoFactorService.verifyToken(userId, token);
        expect(result).toBe(true);
        expect(mockTotpVerify).toHaveBeenCalled();
      } finally {
        crypto.scryptSync = originalScryptSync;
        crypto.createDecipheriv = originalCreateDecipheriv;
      }
    });

    it('should verify backup code', async () => {
      const userId = 'user-123';
      const backupCode = 'BACKUP123';

      // Mock verifyTwoFactorToken to return false (so it tries backup code)
      mockTotpVerify.mockReturnValue(false);
      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorSecret: 'encrypted-secret',
        twoFactorEnabled: true,
      } as any);
      
      // Mock verifyBackupCode - uses findMany, not findFirst
      prismaMock.twoFactorBackupCode.findMany.mockResolvedValue([
        {
          id: 'code-123',
          code: 'hashed-code',
          used: false,
        } as any,
      ]);
      
      // Mock fipsPasswordHashing.verifyPassword (service uses fips instead of bcrypt)
      mockFipsVerifyPassword.mockResolvedValue(true);
      
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
      // Mock verifyBackupCode to return empty array (no matching codes)
      prismaMock.twoFactorBackupCode.findMany.mockResolvedValue([]);

      const result = await twoFactorService.verifyToken('user-123', 'invalid');

      expect(result).toBe(false);
    });
  });

  describe('disableTwoFactor()', () => {
    it('should disable 2FA for user', async () => {
      const userId = 'user-123';
      const token = '123456';

      // Mock verifyTwoFactorToken to return true
      mockTotpVerify.mockReturnValue(true);
      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        twoFactorSecret: '0000000000000000:encrypted',
        twoFactorEnabled: true,
        twoFactorVerified: true,
      } as any);

      prismaMock.user.update.mockResolvedValue({
        id: userId,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as any);

      prismaMock.twoFactorBackupCode.deleteMany.mockResolvedValue({ count: 8 } as any);

      // Mock crypto for decryptSecret
      const crypto = require('crypto');
      const originalScryptSync = crypto.scryptSync;
      const originalCreateDecipheriv = crypto.createDecipheriv;
      crypto.scryptSync = jest.fn().mockReturnValue(Buffer.alloc(32, 0));
      const mockDecipher = {
        update: jest.fn().mockReturnValue(Buffer.from('MYSECRETBASE32')),
        final: jest.fn().mockReturnValue(Buffer.alloc(0)),
      };
      crypto.createDecipheriv = jest.fn().mockReturnValue(mockDecipher);

      try {
        const result = await twoFactorService.disableTwoFactor(userId, token);

        expect(result).toBe(true);
        expect(prismaMock.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ id: userId }),
            data: expect.objectContaining({
              twoFactorEnabled: false,
              twoFactorSecret: null,
            }),
          })
        );
        expect(prismaMock.twoFactorBackupCode.deleteMany).toHaveBeenCalled();
      } finally {
        crypto.scryptSync = originalScryptSync;
        crypto.createDecipheriv = originalCreateDecipheriv;
      }
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

