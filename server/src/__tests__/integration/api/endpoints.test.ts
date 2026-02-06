/**
 * Comprehensive API Endpoint Integration Tests
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockUser, createMockOrganization, createMockRiskItem } from '../../mocks/prisma';

// Mock dependencies before importing routes
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
    sendMagicLink: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  },
}));

jest.mock('../../../services/geminiService', () => ({
  __esModule: true,
  default: {
    generateComplianceReport: jest.fn(),
    prioritizeRisks: jest.fn(),
    generateRemediationPlan: jest.fn(),
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
  generateToken: jest.fn().mockReturnValue('mock-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: jest.fn(),
  AuthRequest: {},
}));

// Mock rate limiters
jest.mock('../../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock tier middleware
jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: () => (req: any, res: any, next: any) => next(),
}));

import authRoutes from '../../../routes/auth';
import frameworksRoutes from '../../../routes/frameworks';
import risksRoutes from '../../../routes/risks';
import { errorHandler } from '../../../middleware/errorHandler';

// Create self-contained Express app (avoids side effects of importing index.ts)
const app = express();
app.use(express.json());

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no auth middleware needed)
app.use('/api/auth', authRoutes);

// Protected routes middleware
const authMiddleware = (req: any, _res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    (req as any).user = {
      id: 'test-user-123',
      organizationId: 'test-org-123',
      role: 'admin',
      email: 'test@example.com',
      name: 'Test User',
    };
  }
  next();
};

app.use(authMiddleware);
app.use('/api/frameworks', frameworksRoutes);
app.use('/api/risks', risksRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

describe('API Endpoints Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let organizationId: string;

  beforeAll(async () => {
    userId = 'test-user-123';
    organizationId = 'test-org-123';
    authToken = 'test-auth-token';
  });

  beforeEach(() => {
    // Re-setup service mocks (resetMocks: true clears implementations)
    const emailService = require('../../../services/emailService').default;
    emailService.sendMagicLink.mockResolvedValue(true);
    emailService.sendWelcomeEmail.mockResolvedValue(true);

    const geminiService = require('../../../services/geminiService').default;
    geminiService.generateComplianceReport.mockResolvedValue({
      summary: 'Test report',
      score: 85,
    });
    geminiService.prioritizeRisks.mockResolvedValue([]);
    geminiService.generateRemediationPlan.mockResolvedValue('Plan');

    // Re-setup auth token generation mocks (resetMocks: true clears implementations)
    const auth = require('../../../middleware/auth');
    auth.generateToken.mockReturnValue('mock-access-token');
    auth.generateRefreshToken.mockReturnValue('mock-refresh-token');
    auth.verifyRefreshToken.mockReturnValue('test-user-123');
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
      const mockUser = createMockUser();
      const mockOrg = createMockOrganization();

      prismaMock.magicLink.findUnique.mockResolvedValue({
        email: 'test@example.com',
        token,
        used: false,
        expiresAt: new Date(Date.now() + 60000),
      } as any);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organization: mockOrg,
      } as any);
      prismaMock.magicLink.update.mockResolvedValue({} as any);
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

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
        nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      };

      prismaMock.complianceFramework.create.mockResolvedValue({
        id: 'framework-2',
        ...frameworkData,
        organizationId,
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

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
        category: 'Security',
        severity: 'High',
        likelihood: 4,
        impact: 5,
      };

      prismaMock.riskItem.create.mockResolvedValue({
        id: 'risk-1',
        ...riskData,
        organizationId,
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

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

      prismaMock.riskItem.findFirst.mockResolvedValue(createMockRiskItem({ id: riskId }));
      prismaMock.riskItem.update.mockResolvedValue({
        id: riskId,
        ...updateData,
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .patch(`/api/risks/${riskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('status', updateData.status);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      await request(app).get('/api/non-existent').expect(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Without auth header, the route's authenticate middleware returns 401
      await request(app).get('/api/frameworks').expect(401);
    });

    it('should return 400 for invalid request data', async () => {
      await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required fields (severity, description, category)
        .expect(400);
    });
  });
});
