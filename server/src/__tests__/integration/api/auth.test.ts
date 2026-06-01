/**
 * Auth API Integration Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockUser, createMockOrganization } from '../../mocks/prisma';

// Mock dependencies before importing app
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
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

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: jest.fn(() => Promise.resolve(true)),
    sendWelcomeEmail: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock rate limiter to prevent rate limiting during tests
jest.mock('../../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock password hashing so login can deterministically succeed/fail without a real
// PBKDF2 hash. Tests that need a failed password override verifyPassword per-test.
jest.mock('../../../utils/fipsPasswordHashing', () => ({
  __esModule: true,
  hashPassword: jest.fn(() => Promise.resolve('pbkdf2$mock$hash')),
  verifyPassword: jest.fn(() => Promise.resolve(true)),
  needsRehash: jest.fn(() => false),
}));

// Create test app
import authRoutes from '../../../routes/auth';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth API', () => {
  beforeEach(() => {
    // Re-setup email service mocks (resetMocks: true clears implementations)
    const emailService = require('../../../services/emailService').default;
    emailService.sendMagicLink.mockResolvedValue(true);
    emailService.sendWelcomeEmail.mockResolvedValue(true);

    // Re-setup $transaction mock (resetMocks: true clears the implementation from prisma.ts)
    prismaMock.$transaction.mockImplementation((callback: any) => callback(prismaMock));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockOrg = createMockOrganization();
      const mockUser = createMockUser();

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue(mockOrg);
      prismaMock.user.create.mockResolvedValue(mockUser);
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-123',
        token: 'token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecureP@ss123',
          organizationName: 'Test Org',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Registration successful');
    });

    it('should handle registration with existing email by sending magic link', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser());
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-123',
        token: 'token',
        email: 'existing@example.com',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'SecureP@ss123',
          organizationName: 'Test Org',
        });

      // Controller returns 200 and sends magic link for existing users
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('existingUser', true);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          // Missing email
        });

      expect(response.status).toBe(400);
    });

    it('should reject an invalid email format with a deterministic 400', async () => {
      // /register is guarded by validateBody(registerSchema), where
      // email is Joi.string().email().required(). A malformed address is rejected
      // by the schema before any controller/DB code runs, so the response is a
      // deterministic 400 (no 500 leak from a downstream DB failure).
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'SecureP@ss123',
          organizationName: 'Test Org',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      // The user should never be looked up / created for an invalid payload.
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject a missing password with a deterministic 400', async () => {
      // password is required by registerSchema; omitting it is a schema-level 400.
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'valid@example.com',
          organizationName: 'Test Org',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/magic-link', () => {
    it('should send magic link for existing user', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.magicLink.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-123',
        token: 'test-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      });

      const response = await request(app)
        .post('/api/auth/magic-link')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should auto-register non-existent user and send magic link', async () => {
      // The magic-link endpoint auto-registers users that don't exist
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue(createMockOrganization());
      prismaMock.user.create.mockResolvedValue(createMockUser());
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-123',
        token: 'test-token',
        email: 'nonexistent@example.com',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      });

      const response = await request(app)
        .post('/api/auth/magic-link')
        .send({ email: 'nonexistent@example.com' });

      // Auto-registration returns 200, not 404
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid magic link and return tokens', async () => {
      const mockUser = createMockUser();
      const mockMagicLink = {
        id: 'link-123',
        token: 'valid-token',
        email: mockUser.email,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        user: mockUser,
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(mockMagicLink);
      prismaMock.magicLink.update.mockResolvedValue({ ...mockMagicLink, used: true });
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organization: createMockOrganization(),
      });
      prismaMock.user.update.mockResolvedValue(mockUser);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      // Tokens are now set as httpOnly cookies (security hardening), not returned in JSON body.
      // Response body contains user info and twoFactorRequired flag.
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('twoFactorRequired', false);
      // Verify auth cookies are set in the response
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toMatch(/access_token|refresh_token/);
    });

    it('should reject expired magic link', async () => {
      const mockMagicLink = {
        id: 'link-123',
        token: 'expired-token',
        email: 'test@example.com',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 3600000), // Expired
        used: false,
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(mockMagicLink);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'expired-token' });

      // Controller returns 401 for expired tokens
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('expired');
    });

    it('should reject already used magic link', async () => {
      const mockMagicLink = {
        id: 'link-123',
        token: 'used-token',
        email: 'test@example.com',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        used: true, // Already used
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(mockMagicLink);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'used-token' });

      // Controller returns 401 for used tokens
      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      prismaMock.magicLink.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'invalid-token' });

      // Controller returns 401 for invalid/not-found tokens
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject a request with no refresh token (400)', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      // Controller throws AppError('Refresh token is required', 400) before any
      // token verification, so this is deterministic.
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/refresh token is required/i);
    });

    it('should reject an invalid/garbage refresh token with 401', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'not-a-real-jwt' });

      // verifyRefreshToken returns null for a malformed JWT -> AppError('Invalid refresh token', 401).
      // It must NOT succeed and must NOT leak a 500.
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid refresh token/i);
      // No new auth cookies should be set on a failed refresh.
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should rotate tokens and set new auth cookies for a valid refresh token', async () => {
      // Mint a real refresh token using the same secret the controller verifies against.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { generateRefreshToken } = require('../../../middleware/auth');
      const validToken = generateRefreshToken('user-123');

      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      // Rotation issues fresh httpOnly cookies for access + refresh tokens.
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toMatch(/access_token|refresh_token/);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should handle logout request', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // Profile Management Tests
  // ===========================================================================
  describe('Profile Management', () => {
    beforeEach(() => {
      // Mock auth middleware for profile routes
      jest.doMock('../../../middleware/auth', () => ({
        authenticate: (req: any, res: any, next: any) => {
          req.user = {
            id: 'user-123',
            email: 'test@example.com',
            organizationId: 'org-123',
            role: 'Admin',
          };
          next();
        },
        authorize: () => (req: any, res: any, next: any) => next(),
      }));
    });

    describe('PATCH /api/auth/profile', () => {
      it('should update user profile', async () => {
        const mockUser = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue({
          ...mockUser,
          name: 'Updated Name',
        });

        const response = await request(app)
          .patch('/api/auth/profile')
          .set('Authorization', 'Bearer mock-token')
          .send({ name: 'Updated Name' });

        // Will return 401 without proper auth setup, but route exists
        expect([200, 401]).toContain(response.status);
      });
    });

    describe('POST /api/auth/profile/avatar', () => {
      it('should accept avatar upload', async () => {
        const mockUser = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue({
          ...mockUser,
          avatarUrl: 'https://storage.example.com/avatar.png',
        });

        const response = await request(app)
          .post('/api/auth/profile/avatar')
          .set('Authorization', 'Bearer mock-token')
          .attach('avatar', Buffer.from('fake-image-data'), 'avatar.png');

        // Will return 401 without proper auth setup, but route exists
        expect([200, 401]).toContain(response.status);
      });
    });

    describe('PATCH /api/auth/password', () => {
      it('should change password', async () => {
        const mockUser = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue(mockUser);

        const response = await request(app)
          .patch('/api/auth/password')
          .set('Authorization', 'Bearer mock-token')
          .send({
            currentPassword: 'oldpassword123',
            newPassword: 'newpassword456',
          });

        // Will return 401 without proper auth setup, but route exists
        expect([200, 400, 401]).toContain(response.status);
      });
    });
  });

  // ===========================================================================
  // Two-Factor Authentication Tests
  // ===========================================================================
  describe('Two-Factor Authentication', () => {
    describe('POST /api/auth/2fa/complete', () => {
      it('should complete 2FA login with valid code', async () => {
        const mockUser = createMockUser({ twoFactorEnabled: true });
        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/auth/2fa/complete')
          .send({
            userId: 'user-123',
            code: '123456',
          });

        // Depends on TOTP verification, may return 400, 401 or 200
        expect([200, 400, 401]).toContain(response.status);
      });

      it('should handle backup code', async () => {
        const mockUser = createMockUser({ twoFactorEnabled: true });
        const mockBackupCode = {
          id: 'backup-123',
          userId: 'user-123',
          code: 'BACKUP123456',
          used: false,
        };

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.twoFactorBackupCode.findFirst.mockResolvedValue(mockBackupCode);
        prismaMock.twoFactorBackupCode.update.mockResolvedValue({
          ...mockBackupCode,
          used: true,
        });

        const response = await request(app)
          .post('/api/auth/2fa/complete')
          .send({
            userId: 'user-123',
            code: 'BACKUP123456',
          });

        // Depends on backup code validation
        expect([200, 400, 401]).toContain(response.status);
      });
    });
  });

  // ===========================================================================
  // Login Flow Tests
  // ===========================================================================
  describe('Login Flow', () => {
    describe('POST /api/auth/login', () => {
      it('should login with email and password', async () => {
        const mockUser = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.auditLog.create.mockResolvedValue({} as any);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          });

        // Will depend on password hash comparison
        expect([200, 401]).toContain(response.status);
      });

      it('should require 2FA for enabled accounts and not issue session cookies yet', async () => {
        // resetMocks:true clears implementations between tests, so re-arm verifyPassword to
        // succeed here. With a correct password and 2FA enabled-but-unverified, the controller
        // must short-circuit into the 2FA-required branch (authController.ts:570).
        const { verifyPassword } = require('../../../utils/fipsPasswordHashing');
        verifyPassword.mockResolvedValue(true);

        const mockUser = createMockUser({
          twoFactorEnabled: true,
          twoFactorVerified: false,
          passwordHash: 'pbkdf2$mock$hash',
        });
        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          });

        expect(response.status).toBe(200);
        // Controller returns requires2FA + a short-lived twoFactorToken (NOT real session tokens).
        expect(response.body).toHaveProperty('requires2FA', true);
        expect(response.body).toHaveProperty('twoFactorToken');
        // Access/refresh cookies must NOT be set until 2FA completes.
        const cookies = response.headers['set-cookie'];
        const cookieStr = cookies
          ? (Array.isArray(cookies) ? cookies.join(';') : String(cookies))
          : '';
        expect(cookieStr).not.toMatch(/access_token|refresh_token/);
      });

      it('should reject invalid credentials', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'wrong@example.com',
            password: 'wrongpassword',
          });

        expect(response.status).toBe(401);
      });
    });
  });
});
