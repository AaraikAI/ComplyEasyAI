/**
 * Auth Controller Unit Tests - Comprehensive Coverage
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
const mockSendMagicLink = jest.fn<any>();
const mockSendWelcomeEmail = jest.fn<any>();
const mockSendEmail = jest.fn<any>();

jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: mockSendMagicLink,
    sendWelcomeEmail: mockSendWelcomeEmail,
    sendEmail: mockSendEmail,
  },
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

const mockGenerateToken = jest.fn<any>().mockReturnValue('access-token');
const mockGenerateRefreshToken = jest.fn<any>().mockReturnValue('refresh-token');
const mockVerifyRefreshToken = jest.fn<any>().mockReturnValue('user-123');

jest.mock('../../../middleware/auth', () => ({
  generateToken: mockGenerateToken,
  generateRefreshToken: mockGenerateRefreshToken,
  verifyRefreshToken: mockVerifyRefreshToken,
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: jest.fn<any>().mockResolvedValue(true),
    hash: jest.fn<any>().mockResolvedValue('hashed-password'),
  },
}));

jest.mock('../../../services/sessionManagementService', () => ({
  __esModule: true,
  default: {
    createSession: jest.fn<any>().mockResolvedValue({ existingSessionsTerminated: 0 }),
    terminateSession: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../services/s3Service', () => ({
  __esModule: true,
  default: {
    uploadFile: jest.fn<any>().mockResolvedValue({ url: 'https://s3.example.com/avatar.jpg' }),
  },
}));

jest.mock('../../../services/twoFactorService', () => ({
  __esModule: true,
  default: {
    verifyTwoFactorToken: jest.fn<any>().mockResolvedValue(false),
    verifyBackupCode: jest.fn<any>().mockResolvedValue(false),
  },
}));

import authController from '../../../controllers/authController';
import { AppError } from '../../../middleware/errorHandler';
import bcrypt from 'bcryptjs';

describe('AuthController', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';

    mockReq = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      user: { id: 'user-1', organizationId: 'org-1' },
    };

    mockRes = {
      json: jest.fn<any>().mockReturnThis(),
      status: jest.fn<any>().mockReturnThis(),
      send: jest.fn<any>().mockReturnThis(),
    };

    mockSendMagicLink.mockResolvedValue(true as never);
    mockSendWelcomeEmail.mockResolvedValue(true as never);
    mockSendEmail.mockResolvedValue(true as never);
    mockGenerateToken.mockReturnValue('access-token');
    mockGenerateRefreshToken.mockReturnValue('refresh-token');
    mockVerifyRefreshToken.mockReturnValue('user-123');
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // ==========================================================================
  // requestMagicLink
  // ==========================================================================
  describe('requestMagicLink()', () => {
    it('should throw AppError when email is missing', async () => {
      mockReq.body = {};
      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should send magic link to existing user', async () => {
      mockReq.body = { email: 'existing@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'user-123', email: 'existing@example.com', organization: { id: 'org-1' },
      });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({
        email: 'existing@example.com', token: 'tok', expiresAt: new Date(),
      });

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);

      expect(prismaMock.user.findUnique).toHaveBeenCalled();
      expect(prismaMock.magicLink.create).toHaveBeenCalled();
      expect(mockSendMagicLink).toHaveBeenCalledWith('existing@example.com', expect.any(String));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Magic link sent to your email' }));
    });

    it('should auto-register a new user when user does not exist', async () => {
      mockReq.body = { email: 'newuser@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({ id: 'org-new', name: "newuser's Organization" });
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({ id: 'user-new', email: 'newuser@example.com' });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'newuser@example.com', token: 'tok' });

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);

      expect(prismaMock.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ plan: 'Foundation' }) })
      );
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'admin' }) })
      );
    });

    it('should return devToken in development mode', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'test@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'test@example.com', token: 'tok' });

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ devToken: expect.any(String), devMessage: expect.any(String) }));
    });

    it('should not return devToken in production mode', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'test@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'test@example.com', token: 'tok' });

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);

      const jsonCall = (mockRes.json as jest.Mock<any>).mock.calls[0][0];
      expect(jsonCall.devToken).toBeUndefined();
    });

    it('should continue even when sendMagicLink returns false (warn path)', async () => {
      mockReq.body = { email: 'test@example.com' };
      mockSendMagicLink.mockResolvedValue(false as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'test@example.com', token: 'tok' });

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle email send error in development mode', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'test@example.com' };
      mockSendMagicLink.mockRejectedValue(new Error('SMTP failed') as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'test@example.com', token: 'tok' });

      await authController.requestMagicLink(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should throw AppError when email send fails in production mode', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'test@example.com' };
      mockSendMagicLink.mockRejectedValue(new Error('SMTP failed') as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'test@example.com', token: 'tok' });

      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle P2002 Prisma error with specific message', async () => {
      mockReq.body = { email: 'test@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      const prismaError = new Error('Unique constraint') as any;
      prismaError.code = 'P2002';
      (prismaMock.magicLink.create as jest.Mock<any>).mockRejectedValue(prismaError);

      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('A magic link was already sent recently');
    });

    it('should handle P2003 Prisma error with specific message', async () => {
      mockReq.body = { email: 'test@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      const prismaError = new Error('Foreign key constraint') as any;
      prismaError.code = 'P2003';
      (prismaMock.magicLink.create as jest.Mock<any>).mockRejectedValue(prismaError);

      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Database constraint error');
    });

    it('should handle generic error with message', async () => {
      mockReq.body = { email: 'test@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'u1', email: 'test@example.com', organization: { id: 'o1' } });
      (prismaMock.magicLink.create as jest.Mock<any>).mockRejectedValue(new Error('Something broke'));

      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to send magic link: Something broke');
    });

    it('should re-throw AppError from inner catch block', async () => {
      mockReq.body = {};
      await expect(
        authController.requestMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email is required');
    });
  });

  // ==========================================================================
  // verifyMagicLink
  // ==========================================================================
  describe('verifyMagicLink()', () => {
    const validMagicLink = {
      email: 'user@example.com', token: 'valid-token', used: false,
      expiresAt: new Date(Date.now() + 60000),
    };
    const mockUser = {
      id: 'user-123', email: 'user@example.com', name: 'Test', role: 'admin',
      avatar: null, organizationId: 'org-123', twoFactorEnabled: false,
      organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
    };

    it('should throw AppError when token is missing', async () => {
      mockReq.body = {};
      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Token is required');
    });

    it('should throw AppError when magic link is not found (null)', async () => {
      mockReq.body = { token: 'invalid' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(null);
      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should throw AppError when magic link is already used', async () => {
      mockReq.body = { token: 'used-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue({
        ...validMagicLink, used: true,
      });
      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should throw AppError when token has expired', async () => {
      mockReq.body = { token: 'expired' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue({
        ...validMagicLink, expiresAt: new Date(Date.now() - 60000),
      });
      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Token has expired');
    });

    it('should throw AppError when user is not found', async () => {
      mockReq.body = { token: 'valid-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(validMagicLink);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User not found');
    });

    it('should return 2FA pending response when twoFactorEnabled is true', async () => {
      mockReq.body = { token: 'valid-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(validMagicLink);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ ...mockUser, twoFactorEnabled: true });
      (prismaMock.magicLink.update as jest.Mock<any>).mockResolvedValue({});

      await authController.verifyMagicLink(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        twoFactorRequired: true,
        userId: 'user-123',
        message: 'Two-factor authentication required',
      });
    });

    it('should verify valid magic link and return tokens and user', async () => {
      mockReq.body = { token: 'valid-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(validMagicLink);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser);
      (prismaMock.magicLink.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.verifyMagicLink(mockReq as Request, mockRes as Response);

      expect(prismaMock.magicLink.update).toHaveBeenCalledWith({ where: { token: 'valid-token' }, data: { used: true } });
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        twoFactorRequired: false,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: 'user-123', email: 'user@example.com' }),
      }));
    });

    it('should handle unexpected error and throw generic AppError', async () => {
      mockReq.body = { token: 'valid-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.verifyMagicLink(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to verify token');
    });
  });

  // ==========================================================================
  // refreshToken
  // ==========================================================================
  describe('refreshToken()', () => {
    it('should throw AppError when refreshToken is missing', async () => {
      mockReq.body = {};
      await expect(
        authController.refreshToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Refresh token is required');
    });

    it('should throw AppError when verifyRefreshToken returns falsy', async () => {
      mockReq.body = { refreshToken: 'invalid' };
      mockVerifyRefreshToken.mockReturnValue(null);

      await expect(
        authController.refreshToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw AppError when user not found', async () => {
      mockReq.body = { refreshToken: 'valid-refresh' };
      mockVerifyRefreshToken.mockReturnValue('user-123');
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        authController.refreshToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User not found');
    });

    it('should return new access token for valid refresh token', async () => {
      mockReq.body = { refreshToken: 'valid-refresh' };
      mockVerifyRefreshToken.mockReturnValue('user-123');
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'user-123', email: 'test@example.com', role: 'admin', organizationId: 'org-1',
      });
      mockGenerateToken.mockReturnValue('new-access-token');

      await authController.refreshToken(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ accessToken: 'new-access-token' });
    });

    it('should handle unexpected error and throw generic AppError', async () => {
      mockReq.body = { refreshToken: 'valid' };
      mockVerifyRefreshToken.mockReturnValue('user-123');
      (prismaMock.user.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.refreshToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to refresh token');
    });
  });

  // ==========================================================================
  // login
  // ==========================================================================
  describe('login()', () => {
    const mockUserWithPassword = {
      id: 'user-123', email: 'test@example.com', name: 'Test', role: 'admin',
      avatar: null, organizationId: 'org-123', passwordHash: 'hashed',
      twoFactorEnabled: false, twoFactorVerified: false,
      organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
    };

    it('should throw AppError when email is missing', async () => {
      mockReq.body = { password: 'pass' };
      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw AppError when password is missing', async () => {
      mockReq.body = { email: 'test@example.com' };
      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw AppError when both email and password are missing', async () => {
      mockReq.body = {};
      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw AppError when user not found', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw AppError when user has no password set', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        ...mockUserWithPassword, passwordHash: null,
      });

      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Password not set');
    });

    it('should throw AppError when password is incorrect', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrong' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(false as never);

      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should return 2FA pending response when 2FA enabled and not verified', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        ...mockUserWithPassword, twoFactorEnabled: true, twoFactorVerified: false,
      });
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true as never);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        requires2FA: true, userId: 'user-123', message: 'Two-factor authentication required',
      });
    });

    it('should login successfully with valid credentials', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true as never);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: 'user-123' }),
      }));
    });

    it('should continue login even if lastLogin update fails', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true as never);
      (prismaMock.user.update as jest.Mock<any>).mockRejectedValue(new Error('update failed'));
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.login(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should continue login even if audit log creation fails', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true as never);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockRejectedValue(new Error('audit fail'));

      await authController.login(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle unexpected error and throw generic AppError', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.login(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should skip 2FA check when twoFactorEnabled is true but twoFactorVerified is also true', async () => {
      mockReq.body = { email: 'test@example.com', password: 'pass' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        ...mockUserWithPassword, twoFactorEnabled: true, twoFactorVerified: true,
      });
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true as never);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String) }));
    });
  });

  // ==========================================================================
  // register
  // ==========================================================================
  describe('register()', () => {
    it('should throw AppError when email is missing', async () => {
      mockReq.body = { name: 'Test' };
      await expect(
        authController.register(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email and name are required');
    });

    it('should throw AppError when name is missing', async () => {
      mockReq.body = { email: 'test@example.com' };
      await expect(
        authController.register(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email and name are required');
    });

    it('should handle existing user by sending magic link and returning 200', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'existing@example.com', name: 'Existing' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'u1', email: 'existing@example.com', organization: { id: 'o1' },
      });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'existing@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        existingUser: true, devToken: expect.any(String),
      }));
    });

    it('should handle existing user in production mode without devToken', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'existing@example.com', name: 'Existing' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'u1', email: 'existing@example.com', organization: { id: 'o1' },
      });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'existing@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);

      const jsonCall = (mockRes.json as jest.Mock<any>).mock.calls[0][0];
      expect(jsonCall.devToken).toBeUndefined();
      expect(jsonCall.existingUser).toBe(true);
    });

    it('should handle email send failure for existing user in development mode', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'existing@example.com', name: 'Existing' };
      mockSendMagicLink.mockRejectedValue(new Error('SMTP fail') as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'u1', email: 'existing@example.com', organization: { id: 'o1' },
      });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'existing@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw AppError when email send fails for existing user in production', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'existing@example.com', name: 'Existing' };
      mockSendMagicLink.mockRejectedValue(new Error('SMTP fail') as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'u1', email: 'existing@example.com', organization: { id: 'o1' },
      });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'existing@example.com', token: 'tok' });

      await expect(
        authController.register(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should warn when sendMagicLink returns false for existing user', async () => {
      mockReq.body = { email: 'existing@example.com', name: 'Existing' };
      mockSendMagicLink.mockResolvedValue(false as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'u1', email: 'existing@example.com', organization: { id: 'o1' },
      });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'existing@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should register new user successfully with all fields', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = {
        email: 'new@example.com', name: 'New User', password: 'password123',
        organizationName: 'My Org', industry: 'Tech', companySize: '10-50',
        primaryComplianceGoal: 'SOC2', howDidYouHear: 'Google',
      };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({ id: 'org-new' });
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({ id: 'u-new', email: 'new@example.com', name: 'New User' });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'new@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);

      expect(prismaMock.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'My Org', industry: 'Tech' }) })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Registration successful. Check your email for login link.',
        devToken: expect.any(String),
      }));
    });

    it('should register new user without optional fields', async () => {
      mockReq.body = { email: 'new@example.com', name: 'New User' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({ id: 'org-new' });
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({ id: 'u-new', email: 'new@example.com', name: 'New User' });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'new@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);

      expect(prismaMock.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: "New User's Organization" }) })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle email send failure in new user registration (development)', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'new@example.com', name: 'New User' };
      mockSendWelcomeEmail.mockRejectedValue(new Error('SMTP down') as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({ id: 'org-new' });
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({ id: 'u-new', email: 'new@example.com', name: 'New User' });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'new@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should throw AppError when email send fails in new user registration (production)', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'new@example.com', name: 'New User' };
      mockSendWelcomeEmail.mockRejectedValue(new Error('SMTP fail') as never);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({ id: 'org-new' });
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({ id: 'u-new', email: 'new@example.com', name: 'New User' });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'new@example.com', token: 'tok' });

      await expect(
        authController.register(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to send welcome email');
    });

    it('should not return devToken in production for new user', async () => {
      process.env.NODE_ENV = 'production';
      mockReq.body = { email: 'new@example.com', name: 'New User' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({ id: 'org-new' });
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({ id: 'u-new', email: 'new@example.com', name: 'New User' });
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({ email: 'new@example.com', token: 'tok' });

      await authController.register(mockReq as Request, mockRes as Response);

      const jsonCall = (mockRes.json as jest.Mock<any>).mock.calls[0][0];
      expect(jsonCall.devToken).toBeUndefined();
    });

    it('should handle unexpected error with generic AppError', async () => {
      mockReq.body = { email: 'new@example.com', name: 'New User' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.register(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to register user');
    });
  });

  // ==========================================================================
  // completeTwoFactorLogin
  // ==========================================================================
  describe('completeTwoFactorLogin()', () => {
    const mockUser = {
      id: 'user-123', email: 'test@example.com', name: 'Test', role: 'admin',
      avatar: null, organizationId: 'org-123', twoFactorEnabled: true,
      organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
    };

    it('should throw AppError when userId is missing', async () => {
      mockReq.body = { token: '123456' };
      await expect(
        authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User ID and 2FA token are required');
    });

    it('should throw AppError when token is missing', async () => {
      mockReq.body = { userId: 'user-123' };
      await expect(
        authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User ID and 2FA token are required');
    });

    it('should throw AppError when user not found', async () => {
      mockReq.body = { userId: 'user-123', token: '123456' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User not found');
    });

    it('should throw AppError when 2FA is not enabled for user', async () => {
      mockReq.body = { userId: 'user-123', token: '123456' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ ...mockUser, twoFactorEnabled: false });

      await expect(
        authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('2FA is not enabled for this user');
    });

    it('should throw AppError when both TOTP and backup code are invalid', async () => {
      mockReq.body = { userId: 'user-123', token: 'bad-code' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser);
      const twoFactorService = (await import('../../../services/twoFactorService')).default;
      (twoFactorService.verifyTwoFactorToken as jest.Mock<any>).mockResolvedValue(false);
      (twoFactorService.verifyBackupCode as jest.Mock<any>).mockResolvedValue(false);

      await expect(
        authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid authentication code');
    });

    it('should succeed with valid TOTP token', async () => {
      mockReq.body = { userId: 'user-123', token: '123456' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser);
      const twoFactorService = (await import('../../../services/twoFactorService')).default;
      (twoFactorService.verifyTwoFactorToken as jest.Mock<any>).mockResolvedValue(true);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: expect.any(String), refreshToken: expect.any(String),
        user: expect.objectContaining({ id: 'user-123' }),
      }));
    });

    it('should succeed with valid backup code when TOTP fails', async () => {
      mockReq.body = { userId: 'user-123', token: 'backup-code' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser);
      const twoFactorService = (await import('../../../services/twoFactorService')).default;
      (twoFactorService.verifyTwoFactorToken as jest.Mock<any>).mockResolvedValue(false);
      (twoFactorService.verifyBackupCode as jest.Mock<any>).mockResolvedValue(true);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String) }));
    });

    it('should handle unexpected error with generic AppError', async () => {
      mockReq.body = { userId: 'user-123', token: '123456' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.completeTwoFactorLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to complete 2FA login');
    });
  });

  // ==========================================================================
  // updateProfile
  // ==========================================================================
  describe('updateProfile()', () => {
    it('should throw AppError when name is empty', async () => {
      mockReq.body = { name: '', email: 'test@example.com' };
      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Name is required');
    });

    it('should throw AppError when name is only whitespace', async () => {
      mockReq.body = { name: '   ', email: 'test@example.com' };
      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Name is required');
    });

    it('should throw AppError when name is too long (>100)', async () => {
      mockReq.body = { name: 'a'.repeat(101), email: 'test@example.com' };
      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Name is too long');
    });

    it('should throw AppError for invalid email format', async () => {
      mockReq.body = { name: 'Test', email: 'invalid-email' };
      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw AppError when email is missing', async () => {
      mockReq.body = { name: 'Test' };
      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw AppError when email is already in use by another user', async () => {
      mockReq.body = { name: 'Test', email: 'taken@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>)
        .mockResolvedValueOnce({ id: 'user-1', email: 'old@example.com' })
        .mockResolvedValueOnce({ id: 'user-other', email: 'taken@example.com' });

      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Email already in use');
    });

    it('should update profile without email change', async () => {
      mockReq.body = { name: 'Updated Name', email: 'same@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>)
        .mockResolvedValueOnce({ id: 'user-1', email: 'same@example.com', emailVerified: true });
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({
        id: 'user-1', name: 'Updated Name', email: 'same@example.com', role: 'admin', avatar: null, organizationId: 'org-1',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.updateProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
    });

    it('should send email notifications and reset emailVerified when email changes', async () => {
      mockReq.body = { name: 'Test', email: 'new@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>)
        .mockResolvedValueOnce({ id: 'user-1', email: 'old@example.com', emailVerified: true })
        .mockResolvedValueOnce(null); // new email not taken
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({
        id: 'user-1', name: 'Test', email: 'new@example.com', role: 'admin', avatar: null, organizationId: 'org-1',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.updateProfile(mockReq as Request, mockRes as Response);

      expect(mockSendEmail).toHaveBeenCalledTimes(2);
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ emailVerified: false }),
      }));
    });

    it('should continue profile update even when email notification fails', async () => {
      mockReq.body = { name: 'Test', email: 'new@example.com' };
      mockSendEmail.mockRejectedValue(new Error('Email service down') as never);
      (prismaMock.user.findUnique as jest.Mock<any>)
        .mockResolvedValueOnce({ id: 'user-1', email: 'old@example.com' })
        .mockResolvedValueOnce(null);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({
        id: 'user-1', name: 'Test', email: 'new@example.com', role: 'admin', avatar: null, organizationId: 'org-1',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.updateProfile(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle unexpected error with generic AppError', async () => {
      mockReq.body = { name: 'Test', email: 'test@example.com' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to update profile');
    });
  });

  // ==========================================================================
  // changePassword
  // ==========================================================================
  describe('changePassword()', () => {
    it('should throw AppError when currentPassword is missing', async () => {
      mockReq.body = { newPassword: 'newpass123' };
      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Current password and new password are required');
    });

    it('should throw AppError when newPassword is missing', async () => {
      mockReq.body = { currentPassword: 'oldpass' };
      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Current password and new password are required');
    });

    it('should throw AppError when newPassword is too short', async () => {
      mockReq.body = { currentPassword: 'oldpass', newPassword: 'short' };
      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('New password must be at least 8 characters');
    });

    it('should throw AppError when user has no password set', async () => {
      mockReq.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ passwordHash: null });

      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Password change not available');
    });

    it('should throw AppError when user is not found', async () => {
      mockReq.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Password change not available');
    });

    it('should throw AppError when current password is incorrect', async () => {
      mockReq.body = { currentPassword: 'wrong', newPassword: 'newpass123' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(false as never);

      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should change password successfully', async () => {
      mockReq.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock<any>).mockResolvedValue(true as never);
      (bcrypt.hash as jest.Mock<any>).mockResolvedValue('new-hashed' as never);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.changePassword(mockReq as Request, mockRes as Response);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { passwordHash: 'new-hashed' } })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });

    it('should handle unexpected error with generic AppError', async () => {
      mockReq.body = { currentPassword: 'old', newPassword: 'newpass123' };
      (prismaMock.user.findUnique as jest.Mock<any>).mockRejectedValue(new Error('DB crash'));

      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to change password');
    });
  });

  // ==========================================================================
  // uploadAvatar
  // ==========================================================================
  describe('uploadAvatar()', () => {
    it('should throw AppError when no file is uploaded', async () => {
      await expect(
        authController.uploadAvatar(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('No file uploaded');
    });

    it('should throw AppError for invalid file type', async () => {
      mockReq.file = { mimetype: 'application/pdf', size: 1000 };
      await expect(
        authController.uploadAvatar(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw AppError when file is too large (>1MB)', async () => {
      mockReq.file = { mimetype: 'image/jpeg', size: 2 * 1024 * 1024 };
      await expect(
        authController.uploadAvatar(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('File size must be less than 1MB');
    });

    it('should upload avatar successfully', async () => {
      mockReq.file = { mimetype: 'image/png', size: 500000 };
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({
        id: 'user-1', name: 'Test', email: 'test@example.com', role: 'admin',
        avatar: 'https://s3.example.com/avatar.jpg', organizationId: 'org-1',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.uploadAvatar(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.any(Object), avatarUrl: 'https://s3.example.com/avatar.jpg',
      }));
    });

    it('should accept image/gif files', async () => {
      mockReq.file = { mimetype: 'image/gif', size: 100000 };
      const s3Service = (await import('../../../services/s3Service')).default;
      (s3Service.uploadFile as jest.Mock<any>).mockResolvedValue({ url: 'https://s3.example.com/avatar.gif' });
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({
        id: 'user-1', name: 'Test', email: 'test@example.com', role: 'admin',
        avatar: 'https://s3.example.com/avatar.gif', organizationId: 'org-1',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await authController.uploadAvatar(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle unexpected error with generic AppError', async () => {
      mockReq.file = { mimetype: 'image/jpeg', size: 1000 };
      const s3Service = (await import('../../../services/s3Service')).default;
      (s3Service.uploadFile as jest.Mock<any>).mockRejectedValue(new Error('S3 failure'));

      await expect(
        authController.uploadAvatar(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Failed to upload avatar');
    });
  });

  // ==========================================================================
  // logout
  // ==========================================================================
  describe('logout()', () => {
    it('should logout successfully', async () => {
      await authController.logout(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle session termination with authorization header', async () => {
      mockReq.headers = { authorization: 'Bearer some-token', 'user-agent': 'test' };
      await authController.logout(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle logout without user on request', async () => {
      mockReq.user = undefined;
      await authController.logout(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle logout when session termination fails gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer some-token', 'user-agent': 'test' };
      const sessionManagement = (await import('../../../services/sessionManagementService')).default;
      (sessionManagement.terminateSession as jest.Mock<any>).mockRejectedValue(new Error('session error'));

      await authController.logout(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});
