/**
 * Auth Controller Contract Tests
 *
 * Validates the contract (request/response shapes, status codes, error handling)
 * for all auth controller endpoints.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

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

jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: jest.fn<any>().mockResolvedValue(true as never),
    sendEmail: jest.fn<any>().mockResolvedValue(true as never),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  __esModule: true,
  generateToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: jest.fn().mockReturnValue('user-123'),
  AuthRequest: {},
}));

jest.mock('../../../services/tokenBlacklistService', () => ({
  __esModule: true,
  default: {
    isRevoked: jest.fn<any>().mockResolvedValue(false as never),
    revoke: jest.fn<any>().mockResolvedValue(undefined as never),
    // refreshToken() consults the per-user revoke-all timestamp so a token
    // issued before a password reset cannot mint new access tokens.
    isRevokedByUserReset: jest.fn<any>().mockResolvedValue(false as never),
    revokeAllForUser: jest.fn<any>().mockResolvedValue(undefined as never),
  },
}));

jest.mock('../../../utils/fipsPasswordHashing', () => ({
  __esModule: true,
  hashPassword: jest.fn<any>().mockResolvedValue('hashed-password' as never),
  verifyPassword: jest.fn<any>().mockResolvedValue(true as never),
  needsRehash: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../utils/securityEventLogger', () => ({
  __esModule: true,
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    AUTHENTICATION_SUCCESS: 'AUTHENTICATION_SUCCESS',
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  },
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    jwt: { secret: 'test-secret' },
    server: { clientUrl: 'http://localhost:3000' },
  },
}));

jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((input: string) => input),
  },
}));

import authController from '../../../controllers/authController';
import { AppError } from '../../../middleware/errorHandler';

describe('AuthController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations cleared by resetMocks: true in jest config
    const emailService = require('../../../services/emailService').default;
    emailService.sendMagicLink.mockResolvedValue(true);
    emailService.sendEmail.mockResolvedValue(true);

    const auth = require('../../../middleware/auth');
    auth.generateToken.mockReturnValue('mock-access-token');
    auth.generateRefreshToken.mockReturnValue('mock-refresh-token');
    auth.verifyRefreshToken.mockReturnValue('user-123');

    // jest.config sets resetMocks, which wipes implementations declared in the
    // factory above, so they must be re-established here every test.
    const tokenBlacklist = require('../../../services/tokenBlacklistService').default;
    tokenBlacklist.isRevoked.mockResolvedValue(false);
    tokenBlacklist.revoke.mockResolvedValue(undefined);
    tokenBlacklist.isRevokedByUserReset.mockResolvedValue(false);
    tokenBlacklist.revokeAllForUser.mockResolvedValue(undefined);

    const fipsHashing = require('../../../utils/fipsPasswordHashing');
    fipsHashing.hashPassword.mockResolvedValue('hashed-password');
    fipsHashing.verifyPassword.mockResolvedValue(true);
    fipsHashing.needsRehash.mockReturnValue(false);

    const DOMPurify = require('isomorphic-dompurify').default;
    DOMPurify.sanitize.mockImplementation((input: string) => input);

    (prismaMock.$transaction as jest.Mock<any>).mockImplementation(
      (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)
    );

    mockReq = {
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {},
      method: 'POST',
      originalUrl: '/api/auth/magic-link',
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
      cookie: jest.fn().mockReturnThis() as any,
      clearCookie: jest.fn().mockReturnThis() as any,
    };
  });

  // ===========================================================================
  // requestMagicLink
  // ===========================================================================
  describe('requestMagicLink()', () => {
    it('should return 400 when email is missing', async () => {
      mockReq.body = {};

      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should send magic link for existing user', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        avatar: null,
        organizationId: 'org-123',
        twoFactorEnabled: false,
        organization: { id: 'org-123', name: 'Test Org' },
      };

      (prismaMock.user.findUnique as jest.Mock<any>)
        .mockResolvedValueOnce({ id: 'user-123' } as never)
        .mockResolvedValueOnce(mockUser as never);
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({
        token: 'mock-token',
        email: 'test@example.com',
        expiresAt: new Date(),
      } as never);

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          email: 'test@example.com',
        })
      );
      expect(prismaMock.magicLink.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            token: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        })
      );
    });
  });

  // ===========================================================================
  // verifyMagicLink
  // ===========================================================================
  describe('verifyMagicLink()', () => {
    it('should return 400 when token is missing', async () => {
      mockReq.body = {};

      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return 401 for invalid token', async () => {
      mockReq.body = { token: 'invalid-token' };

      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return 401 for expired token', async () => {
      mockReq.body = { token: 'expired-token' };

      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue({
        token: 'expired-token',
        email: 'test@example.com',
        used: false,
        expiresAt: new Date(Date.now() - 1000), // expired
      } as never);

      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return tokens and user on successful verification', async () => {
      mockReq.body = { token: 'valid-token' };

      const mockMagicLink = {
        token: 'valid-token',
        email: 'test@example.com',
        used: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        avatar: null,
        organizationId: 'org-123',
        twoFactorEnabled: false,
        organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
      };

      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(mockMagicLink as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as never);
      (prismaMock.magicLink.update as jest.Mock<any>).mockResolvedValue({} as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      // Mock $executeRaw for lastLogin update
      (prismaMock as any).$executeRaw = jest.fn<any>().mockResolvedValue(1 as never);

      await authController.verifyMagicLink(mockReq as Request, mockRes as Response);

      // Tokens are now set via httpOnly cookies, not in JSON body
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          twoFactorRequired: false,
          user: expect.objectContaining({
            id: 'user-123',
            email: 'test@example.com',
            organization: expect.objectContaining({
              id: 'org-123',
            }),
          }),
        })
      );
    });
  });

  // ===========================================================================
  // refreshToken
  // ===========================================================================
  describe('refreshToken()', () => {
    it('should return 400 when refresh token is missing', async () => {
      mockReq.body = {};
      mockReq.cookies = {};

      await expect(
        authController.refreshToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return new tokens on valid refresh', async () => {
      mockReq.body = { refreshToken: 'valid-refresh-token' };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org-123',
        // refreshToken() rejects inactive accounts; an ordinary user is active.
        active: true,
      };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as never);

      await authController.refreshToken(mockReq as Request, mockRes as Response);

      // Tokens are set via httpOnly cookies
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
    });
  });

  // ===========================================================================
  // login
  // ===========================================================================
  describe('login()', () => {
    it('should return 400 when email or password is missing', async () => {
      mockReq.body = { email: 'test@example.com' };

      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return 401 for non-existent user', async () => {
      mockReq.body = { email: 'unknown@example.com', password: 'pass123' };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return tokens on successful login', async () => {
      mockReq.body = { email: 'test@example.com', password: 'correct-pass' };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        avatar: null,
        organizationId: 'org-123',
        passwordHash: 'hashed-password',
        twoFactorEnabled: false,
        twoFactorVerified: false,
        organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
      };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as never);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue(mockUser as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await authController.login(mockReq as Request, mockRes as Response);

      // Tokens are set via httpOnly cookies
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should return 2FA prompt when 2FA enabled', async () => {
      mockReq.body = { email: 'test@example.com', password: 'correct-pass' };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        avatar: null,
        organizationId: 'org-123',
        passwordHash: 'hashed-password',
        twoFactorEnabled: true,
        twoFactorVerified: false,
        organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
      };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as never);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requires2FA: true,
          twoFactorToken: expect.any(String),
          message: 'Two-factor authentication required',
        })
      );
    });
  });
});
