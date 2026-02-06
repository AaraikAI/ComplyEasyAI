/**
 * Auth Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
const mockSendMagicLink = jest.fn<any>();
jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: mockSendMagicLink,
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

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../middleware/auth', () => ({
  generateToken: jest.fn().mockReturnValue('access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
  verifyRefreshToken: jest.fn().mockReturnValue({ userId: 'user-123' }),
}));

import AuthController from '../../../controllers/authController';
import { AppError } from '../../../middleware/errorHandler';

describe('AuthController', () => {
  let authController: typeof AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = AuthController;

    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockSendMagicLink.mockResolvedValue(true as never);
  });

  describe('requestMagicLink()', () => {
    it('should send magic link to existing user', async () => {
      const email = 'existing@example.com';
      mockRequest.body = { email };

      const mockUser = {
        id: 'user-123',
        email,
        organization: { id: 'org-123' },
      };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as any);
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({
        email,
        token: 'test-token',
        expiresAt: new Date(),
      } as any);

      await authController.requestMagicLink(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSendMagicLink).toHaveBeenCalledWith(email, expect.any(String));
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
      const email = 'newuser@example.com';
      mockRequest.body = { email };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.organization.create as jest.Mock<any>).mockResolvedValue({
        id: 'org-123',
        name: "newuser's Organization",
      } as any);
      (prismaMock.user.create as jest.Mock<any>).mockResolvedValue({
        id: 'user-123',
        email,
      } as any);
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({
        email,
        token: 'test-token',
      } as any);

      await authController.requestMagicLink(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prismaMock.organization.create).toHaveBeenCalled();
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(mockSendMagicLink).toHaveBeenCalled();
    });

    it('should throw error if email missing', async () => {
      mockRequest.body = {};

      await expect(
        authController.requestMagicLink(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should return dev token in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const email = 'test@example.com';
      mockRequest.body = { email };

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'user-123',
        email,
        organization: { id: 'org-123' },
      } as any);
      (prismaMock.magicLink.create as jest.Mock<any>).mockResolvedValue({
        email,
        token: 'dev-token',
      } as any);

      await authController.requestMagicLink(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          devToken: expect.any(String),
        })
      );
    });
  });

  describe('verifyMagicLink()', () => {
    it('should verify valid magic link and return tokens', async () => {
      const token = 'valid-token';
      mockRequest.body = { token };

      const mockMagicLink = {
        email: 'user@example.com',
        token,
        used: false,
        expiresAt: new Date(Date.now() + 60000),
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'admin',
        avatar: null,
        organizationId: 'org-123',
        twoFactorEnabled: false,
        organization: { id: 'org-123', name: 'Test Org', plan: 'Foundation' },
      };

      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(mockMagicLink as any);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as any);
      (prismaMock.magicLink.update as jest.Mock<any>).mockResolvedValue({} as any);
      (prismaMock.user.update as jest.Mock<any>).mockResolvedValue({} as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      // Re-mock auth functions since resetMocks clears them
      const { generateToken, generateRefreshToken } = require('../../../middleware/auth');
      (generateToken as jest.Mock<any>).mockReturnValue('access-token');
      (generateRefreshToken as jest.Mock<any>).mockReturnValue('refresh-token');

      await authController.verifyMagicLink(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        })
      );
    });

    it('should reject invalid token', async () => {
      mockRequest.body = { token: 'invalid-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        authController.verifyMagicLink(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject expired token', async () => {
      const expiredLink = {
        email: 'user@example.com',
        token: 'expired-token',
        used: false,
        expiresAt: new Date(Date.now() - 60000),
      };

      mockRequest.body = { token: 'expired-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(expiredLink as any);

      await expect(
        authController.verifyMagicLink(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject already used token', async () => {
      const usedLink = {
        email: 'user@example.com',
        token: 'used-token',
        used: true,
        expiresAt: new Date(Date.now() + 60000),
      };

      mockRequest.body = { token: 'used-token' };
      (prismaMock.magicLink.findUnique as jest.Mock<any>).mockResolvedValue(usedLink as any);

      await expect(
        authController.verifyMagicLink(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('refreshToken()', () => {
    it('should refresh access token with valid refresh token', async () => {
      mockRequest.body = { refreshToken: 'valid-refresh-token' };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        organizationId: 'org-123',
      };

      // Re-mock auth functions since resetMocks clears them
      const { verifyRefreshToken, generateToken } = require('../../../middleware/auth');
      (verifyRefreshToken as jest.Mock<any>).mockReturnValue('user-123');
      (generateToken as jest.Mock<any>).mockReturnValue('access-token');

      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(mockUser as any);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
        })
      );
    });

    it('should reject invalid refresh token', async () => {
      mockRequest.body = { refreshToken: 'invalid-token' };

      // verifyRefreshToken returns null/undefined by default after resetMocks,
      // which means !userId is true and throws 'Invalid refresh token'
      await expect(
        authController.refreshToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });
});
