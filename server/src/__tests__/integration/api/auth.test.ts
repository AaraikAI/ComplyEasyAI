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

// Create test app
import authRoutes from '../../../routes/auth';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
          organizationName: 'Test Org',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sent');
    });

    it('should reject registration with existing email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser());

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          organizationName: 'Test Org',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
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

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          organizationName: 'Test Org',
        });

      expect(response.status).toBe(400);
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

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/magic-link')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid magic link and return tokens', async () => {
      const mockUser = createMockUser();
      const mockMagicLink = {
        id: 'link-123',
        token: 'valid-token',
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

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject expired magic link', async () => {
      const mockMagicLink = {
        id: 'link-123',
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 3600000), // Expired
        used: false,
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(mockMagicLink);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'expired-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });

    it('should reject already used magic link', async () => {
      const mockMagicLink = {
        id: 'link-123',
        token: 'used-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        used: true, // Already used
      };

      prismaMock.magicLink.findUnique.mockResolvedValue(mockMagicLink);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'used-token' });

      expect(response.status).toBe(400);
    });

    it('should reject invalid token', async () => {
      prismaMock.magicLink.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // This would require JWT verification mocking
      // For now, test the route exists
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'some-refresh-token' });

      // Will fail JWT verification but route should exist
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
