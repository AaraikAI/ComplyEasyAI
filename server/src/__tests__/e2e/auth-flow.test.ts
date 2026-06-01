/**
 * E2E Tests - Authentication Flow
 * Tests the complete authentication flow from registration to login
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockUser, createMockOrganization } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  },
}));

// Mock rate limiter to prevent rate limiting during tests
jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

import authRoutes from '../../routes/auth';
import { errorHandler } from '../../middleware/errorHandler';

// Create self-contained Express app for testing (avoids side effects of importing index.ts)
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('E2E: Authentication Flow', () => {
  beforeEach(() => {
    // Re-setup email service mocks (resetMocks: true clears implementations)
    const emailService = require('../../services/emailService').default;
    emailService.sendMagicLink.mockResolvedValue(true);
    emailService.sendWelcomeEmail.mockResolvedValue(true);
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete full registration and authentication flow', async () => {
      const mockOrg = createMockOrganization();
      const mockUser = createMockUser();

      // Step 1: Register new user
      // The global resetMocks clears mock implementations between tests, including the
      // shared prismaMock.$transaction passthrough. Re-establish it so register's
      // prisma.$transaction(async (tx) => {...}) executes against the mocked models.
      (prismaMock as any).$transaction.mockImplementation((arg: any) =>
        typeof arg === 'function' ? arg(prismaMock) : Promise.all(arg)
      );
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue(mockOrg);
      prismaMock.user.create.mockResolvedValue(mockUser);
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-1',
        email: 'test@example.com',
        token: 'reg-token',
        expiresAt: new Date(Date.now() + 900000),
        used: false,
      } as any);

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
          organizationName: 'Test Org',
        })
        .expect(201);

      expect(registerResponse.body).toHaveProperty('message');
      expect(registerResponse.body.message).toContain('Registration successful');

      // Step 2: Verify magic link
      const magicLink = {
        id: 'link-1',
        email: 'test@example.com',
        token: 'verify-token',
        used: false,
        expiresAt: new Date(Date.now() + 900000),
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(magicLink as any);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organization: mockOrg,
      } as any);
      prismaMock.magicLink.update.mockResolvedValue({ ...magicLink, used: true } as any);
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'verify-token' })
        .expect(200);

      // Tokens are issued via httpOnly cookies (not the JSON body) for security.
      const setCookies = verifyResponse.headers['set-cookie'] as unknown as string[];
      expect(setCookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(setCookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
      expect(setCookies.some((c) => c.startsWith('access_token=') && /HttpOnly/i.test(c))).toBe(true);
      expect(verifyResponse.body).toHaveProperty('twoFactorRequired', false);
      expect(verifyResponse.body).toHaveProperty('user');
      expect(verifyResponse.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Magic Link Authentication Flow', () => {
    it('should handle magic link request and verification', async () => {
      const mockUser = createMockUser({ email: 'existing@example.com' });
      const mockOrg = createMockOrganization();

      // Setup mocks for requesting magic link
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organization: mockOrg,
      } as any);
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-2',
        email: 'existing@example.com',
        token: 'magic-token',
        expiresAt: new Date(Date.now() + 900000),
        used: false,
      } as any);

      // Request magic link
      const requestResponse = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'existing@example.com',
        })
        .expect(200);

      expect(requestResponse.body).toHaveProperty('message');
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token using refresh token', async () => {
      const mockUser = createMockUser();
      const mockOrg = createMockOrganization();

      // First, get tokens through verify
      const magicLink = {
        id: 'link-3',
        email: 'test@example.com',
        token: 'refresh-test-token',
        used: false,
        expiresAt: new Date(Date.now() + 900000),
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(magicLink as any);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organization: mockOrg,
      } as any);
      prismaMock.magicLink.update.mockResolvedValue({ ...magicLink, used: true } as any);
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'refresh-test-token' })
        .expect(200);

      // The refresh token is delivered as an httpOnly cookie; extract it to drive refresh.
      const setCookies = verifyResponse.headers['set-cookie'] as unknown as string[];
      const refreshCookie = setCookies.find((c) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();
      const refreshToken = decodeURIComponent(refreshCookie!.split(';')[0].split('=')[1]);

      // Setup mock for refresh flow (refresh looks up the user by id from the token)
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Refresh access token (token accepted from body for backward compatibility)
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('message', 'Token refreshed successfully');
      const refreshSetCookies = refreshResponse.headers['set-cookie'] as unknown as string[];
      expect(refreshSetCookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(refreshSetCookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });
  });
});
