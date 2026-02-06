/**
 * Frameworks API Integration Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockUser, createMockOrganization } from '../../mocks/prisma';

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

// Mock auth middleware so the router's built-in authenticate/authorize work
jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) {
      next();
      return;
    }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

// Mock rate limiter to prevent rate limiting during tests
jest.mock('../../../middleware/rateLimiter', () => ({
  frameworkLimiter: (req: any, res: any, next: any) => next(),
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock tier middleware
jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: () => (req: any, res: any, next: any) => next(),
}));

import frameworksRoutes from '../../../routes/frameworks';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
    email: 'test@example.com',
    name: 'Test User',
  };
  next();
});

app.use('/api/frameworks', frameworksRoutes);
app.use(errorHandler);

describe('Frameworks API', () => {
  it('should list frameworks', async () => {
    const mockFrameworks = [
      {
        id: 'fw-1',
        name: 'SOC2',
        organizationId: 'org-123',
        status: 'Active',
      },
    ];

    prismaMock.complianceFramework.findMany.mockResolvedValue(mockFrameworks);

    const response = await request(app)
      .get('/api/frameworks')
      .expect(200);

    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get framework by ID', async () => {
    const mockFramework = {
      id: 'fw-1',
      name: 'SOC2',
      organizationId: 'org-123',
      status: 'Active',
    };

    // Controller uses findFirst, not findUnique
    prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
    prismaMock.frameworkControl.findMany.mockResolvedValue([]);
    prismaMock.frameworkControl.count.mockResolvedValue(0);

    const response = await request(app)
      .get('/api/frameworks/fw-1')
      .expect(200);

    expect(response.body).toHaveProperty('id', 'fw-1');
  });

  it('should create framework', async () => {
    const newFramework = {
      name: 'ISO27001',
      nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createdFramework = {
      id: 'fw-2',
      ...newFramework,
      organizationId: 'org-123',
      status: 'Active',
      createdAt: new Date(),
    };

    prismaMock.complianceFramework.create.mockResolvedValue(createdFramework);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    const response = await request(app)
      .post('/api/frameworks')
      .send(newFramework)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'ISO27001');
  });
});
