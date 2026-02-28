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
  // ===========================================================================
  // Framework CRUD Tests
  // ===========================================================================
  describe('Framework CRUD', () => {
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

    it('should return 404 for non-existent framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      await request(app)
        .get('/api/frameworks/nonexistent')
        .expect(404);
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

    it('should update framework', async () => {
      const mockFramework = {
        id: 'fw-1',
        name: 'SOC2',
        organizationId: 'org-123',
        status: 'Active',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.complianceFramework.update.mockResolvedValue({
        ...mockFramework,
        name: 'SOC2 Type II',
      });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .patch('/api/frameworks/fw-1')
        .send({ name: 'SOC2 Type II' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'SOC2 Type II');
    });

    it('should delete framework', async () => {
      const mockFramework = {
        id: 'fw-1',
        name: 'SOC2',
        organizationId: 'org-123',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.complianceFramework.delete.mockResolvedValue(mockFramework);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/api/frameworks/fw-1')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // Control Management Tests
  // ===========================================================================
  describe('Control Management', () => {
    it('should create control', async () => {
      const mockFramework = {
        id: 'fw-1',
        name: 'SOC2',
        organizationId: 'org-123',
      };

      const mockControl = {
        id: 'ctrl-1',
        frameworkId: 'fw-1',
        name: 'Access Control',
        controlId: 'CC6.1',
        status: 'NotStarted',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.create.mockResolvedValue(mockControl);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/frameworks/fw-1/controls')
        .send({
          name: 'Access Control',
          controlId: 'CC6.1',
          description: 'Access control requirements',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('controlId', 'CC6.1');
    });

    it('should update control', async () => {
      const mockFramework = {
        id: 'fw-1',
        organizationId: 'org-123',
      };

      const mockControl = {
        id: 'ctrl-1',
        frameworkId: 'fw-1',
        status: 'Implemented',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.frameworkControl.update.mockResolvedValue({
        ...mockControl,
        status: 'Implemented',
      });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .patch('/api/frameworks/fw-1/controls/ctrl-1')
        .send({ status: 'Implemented' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Implemented');
    });

    it('should bulk update controls', async () => {
      const mockFramework = {
        id: 'fw-1',
        organizationId: 'org-123',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.updateMany.mockResolvedValue({ count: 3 });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/frameworks/fw-1/controls/bulk-update')
        .send({
          controlIds: ['ctrl-1', 'ctrl-2', 'ctrl-3'],
          update: { status: 'Implemented' },
        })
        .expect(200);

      expect(response.body).toHaveProperty('updated');
    });

    it('should delete control', async () => {
      const mockFramework = {
        id: 'fw-1',
        organizationId: 'org-123',
      };

      const mockControl = {
        id: 'ctrl-1',
        frameworkId: 'fw-1',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.frameworkControl.delete.mockResolvedValue(mockControl);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/api/frameworks/fw-1/controls/ctrl-1')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // Template Tests
  // ===========================================================================
  describe('Framework Templates', () => {
    it('should list available templates', async () => {
      const response = await request(app)
        .get('/api/frameworks/templates')
        .expect(200);

      expect(response.body).toHaveProperty('templates');
    });

    it('should get template for framework type', async () => {
      const response = await request(app)
        .get('/api/frameworks/templates/SOC2')
        .expect(200);

      expect(response.body).toHaveProperty('frameworkType');
      expect(response.body).toHaveProperty('controls');
    });

    it('should apply template to framework', async () => {
      const mockFramework = {
        id: 'fw-1',
        organizationId: 'org-123',
        name: 'SOC2',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.frameworkControl.createMany.mockResolvedValue({ count: 10 });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/frameworks/fw-1/apply-template')
        .send({ frameworkType: 'SOC2' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('applied');
    });
  });

  // ===========================================================================
  // Historical Scores Tests
  // ===========================================================================
  describe('Historical Compliance Scores', () => {
    it('should get historical scores', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        { id: 'fw-1', controls: [{ status: 'Implemented' }] },
      ] as any);
      prismaMock.auditLog.upsert.mockResolvedValue({} as any);

      const response = await request(app)
        .get('/api/frameworks/scores/history')
        .expect(200);

      expect(response.body).toHaveProperty('scores');
    });

    it('should accept months parameter', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);
      prismaMock.auditLog.upsert.mockResolvedValue({} as any);

      const response = await request(app)
        .get('/api/frameworks/scores/history?months=12')
        .expect(200);

      expect(response.body).toHaveProperty('scores');
      expect(Array.isArray(response.body.scores)).toBe(true);
    });
  });

  // ===========================================================================
  // AI Suggestions Tests
  // ===========================================================================
  describe('AI Suggestions', () => {
    it('should get suggestions for framework', async () => {
      const mockFramework = {
        id: 'fw-1',
        organizationId: 'org-123',
      };

      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework);
      prismaMock.aISuggestion.findMany.mockResolvedValue([
        { id: 'sug-1', type: 'ControlImplementation', status: 'Pending' },
      ] as any);

      const response = await request(app)
        .get('/api/frameworks/fw-1/suggestions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should accept suggestion', async () => {
      prismaMock.aISuggestion.findFirst.mockResolvedValue({
        id: 'sug-1',
        status: 'Pending',
        organizationId: 'org-123',
      } as any);
      prismaMock.aISuggestion.update.mockResolvedValue({
        id: 'sug-1',
        status: 'Accepted',
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/frameworks/suggestions/sug-1/accept')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Accepted');
    });

    it('should reject suggestion', async () => {
      prismaMock.aISuggestion.findFirst.mockResolvedValue({
        id: 'sug-1',
        status: 'Pending',
        organizationId: 'org-123',
      } as any);
      prismaMock.aISuggestion.update.mockResolvedValue({
        id: 'sug-1',
        status: 'Rejected',
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/frameworks/suggestions/sug-1/reject')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Rejected');
    });
  });
});
