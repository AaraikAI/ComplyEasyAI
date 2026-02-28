/**
 * Organization Routes Integration Tests
 *
 * Tests for organization management and team operations.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
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
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/rateLimiter', () => ({
  apiLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock data factories
const createMockOrganization = (overrides: Record<string, unknown> = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  industry: 'Technology',
  size: '50-200',
  billingEmail: 'billing@test.org',
  stripeCustomerId: 'cus_test123',
  subscriptionTier: 'Growth',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());

  const orgRoutes = (await import('../../../routes/organization')).default;
  app.use('/api/organization', orgRoutes);
});

describe('Organization Routes Integration', () => {
  describe('GET /api/organization', () => {
    it('should return organization details', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      const response = await request(app)
        .get('/api/organization')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Organization');
    });

    it('should return 404 for non-existent organization', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await request(app)
        .get('/api/organization')
        .expect(404);
    });
  });

  describe('PATCH /api/organization', () => {
    it('should update organization details', async () => {
      const mockOrg = createMockOrganization();
      const updatedOrg = { ...mockOrg, name: 'Updated Organization' };

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      prismaMock.organization.update.mockResolvedValue(updatedOrg as any);

      const response = await request(app)
        .patch('/api/organization')
        .send({ name: 'Updated Organization' })
        .expect(200);

      expect(response.body.name).toBe('Updated Organization');
    });

    it('should update organization industry', async () => {
      const mockOrg = createMockOrganization();
      const updatedOrg = { ...mockOrg, industry: 'Healthcare' };

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      prismaMock.organization.update.mockResolvedValue(updatedOrg as any);

      const response = await request(app)
        .patch('/api/organization')
        .send({ industry: 'Healthcare' })
        .expect(200);

      expect(response.body.industry).toBe('Healthcare');
    });

    it('should update organization size', async () => {
      const mockOrg = createMockOrganization();
      const updatedOrg = { ...mockOrg, size: '200-500' };

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      prismaMock.organization.update.mockResolvedValue(updatedOrg as any);

      const response = await request(app)
        .patch('/api/organization')
        .send({ size: '200-500' })
        .expect(200);

      expect(response.body.size).toBe('200-500');
    });
  });
});
