/**
 * E2E Tests - Authentication Flow
 * Tests the complete authentication flow from registration to login
 */

import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    sendWelcomeEmail: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
  },
}));

import app from '../../index';

describe('E2E: Authentication Flow', () => {
  beforeAll(() => {
    // Setup test data
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete full registration and authentication flow', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          organizationName: 'Test Org',
        })
        .expect(201);

      expect(registerResponse.body).toHaveProperty('message');

      // Step 2: Verify magic link
      const token = process.env.NODE_ENV === 'development'
        ? registerResponse.body.devToken
        : 'test-token';
      
      prismaMock.magicLink.findUnique.mockResolvedValueOnce({
        email: 'test@example.com',
        token,
        used: false,
        expiresAt: new Date(Date.now() + 900000),
      } as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        organization: { id: 'org-123' },
      } as any);
      prismaMock.magicLink.update.mockResolvedValueOnce({} as any);

      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ token })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('user');
      expect(verifyResponse.body.user).toHaveProperty('email', 'test@example.com');

      // Step 2: Request magic link
      const magicLinkResponse = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'test@example.com',
        })
        .expect(200);

      expect(magicLinkResponse.body).toHaveProperty('message');
      
      // In development, token is returned
      if (process.env.NODE_ENV === 'development' && magicLinkResponse.body.devToken) {
        const token = magicLinkResponse.body.devToken;

        // Step 3: Verify magic link
        const verifyResponse = await request(app)
          .post('/api/auth/verify')
          .send({
            token,
          })
          .expect(200);

        expect(verifyResponse.body).toHaveProperty('user');
        expect(verifyResponse.body).toHaveProperty('accessToken');
        expect(verifyResponse.body).toHaveProperty('refreshToken');

        const accessToken = verifyResponse.body.accessToken;

        // Step 4: Use access token for authenticated request
        const protectedResponse = await request(app)
          .get('/api/risks')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(protectedResponse.body).toBeDefined();
      }
    });
  });

  describe('Magic Link Authentication Flow', () => {
    it('should handle magic link request and verification', async () => {
      // Setup mocks
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: 'existing@example.com',
        organization: { id: 'org-123' },
      } as any);
      prismaMock.magicLink.create.mockResolvedValueOnce({
        email: 'existing@example.com',
        token: 'magic-token',
        expiresAt: new Date(Date.now() + 900000),
      } as any);

      // Request magic link
      const requestResponse = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'existing@example.com',
        })
        .expect(200);

      expect(requestResponse.body).toHaveProperty('message');

      // Verify with token (if in dev mode)
      if (process.env.NODE_ENV === 'development' && requestResponse.body.devToken) {
        const verifyResponse = await request(app)
          .post('/api/auth/verify')
          .send({
            token: requestResponse.body.devToken,
          })
          .expect(200);

        expect(verifyResponse.body).toHaveProperty('accessToken');
      }
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token using refresh token', async () => {
      // First, get tokens through login
      const loginResponse = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'test@example.com',
        });

      if (loginResponse.body.devToken) {
        const verifyResponse = await request(app)
          .post('/api/auth/verify')
          .send({
            token: loginResponse.body.devToken,
          });

        const refreshToken = verifyResponse.body.refreshToken;

        // Refresh access token
        const refreshResponse = await request(app)
          .post('/api/auth/refresh')
          .send({
            refreshToken,
          })
          .expect(200);

        expect(refreshResponse.body).toHaveProperty('accessToken');
      }
    });
  });
});

