/**
 * Comprehensive API Endpoint Integration Tests
 */

import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../index';
import { prismaMock } from '../../mocks/prisma';

describe('API Endpoints Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let organizationId: string;

  beforeAll(async () => {
    // Setup test data
    userId = 'test-user-123';
    organizationId = 'test-org-123';

    // Mock authentication
    authToken = 'test-auth-token';
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should request magic link', async () => {
      const email = 'test@example.com';

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue({
        id: organizationId,
        name: "test's Organization",
      } as any);
      prismaMock.user.create.mockResolvedValue({
        id: userId,
        email,
      } as any);
      prismaMock.magicLink.create.mockResolvedValue({
        email,
        token: 'test-token',
      } as any);

      const response = await request(app)
        .post('/api/auth/magic-link')
        .send({ email })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should verify magic link', async () => {
      const token = 'valid-token';

      prismaMock.magicLink.findUnique.mockResolvedValue({
        email: 'test@example.com',
        token,
        used: false,
        expiresAt: new Date(Date.now() + 60000),
      } as any);
      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        organization: { id: organizationId },
      } as any);
      prismaMock.magicLink.update.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('Framework Endpoints', () => {
    it('should get frameworks', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        {
          id: 'framework-1',
          name: 'SOC 2',
          status: 'In_Progress',
          organizationId,
        },
      ] as any);

      const response = await request(app)
        .get('/api/frameworks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create framework', async () => {
      const frameworkData = {
        name: 'ISO 27001',
        description: 'Information Security Management',
      };

      prismaMock.complianceFramework.create.mockResolvedValue({
        id: 'framework-2',
        ...frameworkData,
        organizationId,
      } as any);

      const response = await request(app)
        .post('/api/frameworks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(frameworkData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', frameworkData.name);
    });
  });

  describe('Risk Management Endpoints', () => {
    it('should create risk', async () => {
      const riskData = {
        title: 'Security Vulnerability',
        description: 'Critical vulnerability found',
        severity: 'High',
        likelihood: 4,
        impact: 5,
      };

      prismaMock.riskItem.create.mockResolvedValue({
        id: 'risk-1',
        ...riskData,
        organizationId,
      } as any);

      const response = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(riskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', riskData.title);
    });

    it('should get risks', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        {
          id: 'risk-1',
          title: 'Test Risk',
          severity: 'High',
          organizationId,
        },
      ] as any);

      const response = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update risk', async () => {
      const riskId = 'risk-1';
      const updateData = {
        status: 'In Progress',
      };

      prismaMock.riskItem.update.mockResolvedValue({
        id: riskId,
        ...updateData,
      } as any);

      const response = await request(app)
        .patch(`/api/risks/${riskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('status', updateData.status);
    });
  });

  describe('AI Endpoints', () => {
    it('should generate compliance report', async () => {
      const reportData = {
        framework: 'SOC 2',
        companyName: 'Test Company',
        context: 'Annual compliance review',
      };

      // Mock Gemini service
      jest.mock('../../../services/geminiService', () => ({
        __esModule: true,
        default: {
          generateComplianceReport: jest.fn().mockResolvedValue({
            summary: 'Test report',
            score: 85,
          }),
        },
      }));

      const response = await request(app)
        .post('/api/ai/generate-report')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body).toHaveProperty('report');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      await request(app).get('/api/non-existent').expect(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app).get('/api/frameworks').expect(401);
    });

    it('should return 400 for invalid request data', async () => {
      await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required fields
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array(100)
        .fill(0)
        .map(() =>
          request(app)
            .get('/api/frameworks')
            .set('Authorization', `Bearer ${authToken}`)
        );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited (429)
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});

