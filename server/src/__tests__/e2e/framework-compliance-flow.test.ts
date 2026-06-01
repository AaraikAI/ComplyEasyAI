/**
 * E2E Tests - Framework Compliance Flow
 * Tests complete compliance framework workflows including onboarding,
 * control implementation, evidence collection, and audit preparation.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

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

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// The frameworks route gates creation with enforceLimit('maxFrameworks');
// without a mock the real tier middleware queries tierService and returns 429.
jest.mock('../../middleware/tierMiddleware', () => {
  const passthrough = (_req: any, _res: any, next: any) => next();
  return {
    enforceLimit: () => passthrough,
    requireFeature: () => passthrough,
    requireTier: () => passthrough,
    attachTierInfo: () => passthrough,
    trackUsage: () => passthrough,
    requireActiveSubscription: () => passthrough,
    requireAiFeature: () => [passthrough],
    requireResourceCreation: () => [passthrough],
    requireEnterpriseFeature: () => [passthrough],
    requireVisionaryFeature: () => [passthrough],
  };
});

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    generatePolicyDraft: jest.fn().mockResolvedValue('Policy content...'),
    suggestControls: jest.fn().mockResolvedValue([]),
  },
}));

import frameworksRoutes from '../../routes/frameworks';
import controlMappingsRoutes from '../../routes/controlMappings';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'test@example.com',
  };
  next();
});
app.use('/api/frameworks', frameworksRoutes);
app.use('/api/control-mappings', controlMappingsRoutes);
app.use(errorHandler);

describe('E2E: Framework Compliance Flow', () => {
  // Prisma model is `complianceFramework`; controls are `frameworkControl`.
  const mockFramework = {
    id: 'fw-123',
    name: 'SOC 2 Type II',
    organizationId: 'org-123',
    region: 'US',
    status: 'In_Review',
    progress: 0,
    version: 1,
    lastModifiedBy: 'user-123',
    nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockControl = {
    id: 'ctrl-123',
    frameworkId: 'fw-123',
    name: 'CC1.1 - Control Environment',
    description: 'Management commitment to integrity',
    status: 'Pending',
    category: 'Governance',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Audit logging fires on most mutations.
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  describe('Framework lifecycle', () => {
    it('should create a framework', async () => {
      prismaMock.complianceFramework.create.mockResolvedValue(mockFramework as any);

      const response = await request(app)
        .post('/api/frameworks')
        .send({
          name: 'SOC 2 Type II',
          region: 'US',
          nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'fw-123');
      expect(response.body).toHaveProperty('name', 'SOC 2 Type II');
    });

    it('should reject framework creation without required fields', async () => {
      const response = await request(app)
        .post('/api/frameworks')
        .send({ region: 'US' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should list frameworks for the organization', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        { ...mockFramework, controls: [] },
        { ...mockFramework, id: 'fw-2', name: 'ISO 27001', controls: [] },
      ] as any);

      const response = await request(app)
        .get('/api/frameworks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should get a framework by id with paginated controls', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework as any);
      prismaMock.frameworkControl.findMany.mockResolvedValue([mockControl] as any);
      prismaMock.frameworkControl.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/frameworks/fw-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'fw-123');
      expect(Array.isArray(response.body.controls)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 404 for a framework from another organization', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null as any);

      const response = await request(app)
        .get('/api/frameworks/fw-999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should update a framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework as any);
      prismaMock.complianceFramework.update.mockResolvedValue({
        ...mockFramework,
        notes: 'Kickoff complete',
        version: 2,
      } as any);

      const response = await request(app)
        .patch('/api/frameworks/fw-123')
        .send({ notes: 'Kickoff complete' })
        .expect(200);

      expect(response.body).toHaveProperty('id', 'fw-123');
    });
  });

  describe('Control management', () => {
    it('should create a control under a framework', async () => {
      // createControl verifies framework ownership, then recalculates progress.
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework as any);
      prismaMock.frameworkControl.create.mockResolvedValue(mockControl as any);
      prismaMock.frameworkControl.findMany.mockResolvedValue([mockControl] as any);
      prismaMock.complianceFramework.update.mockResolvedValue(mockFramework as any);

      const response = await request(app)
        .post('/api/frameworks/fw-123/controls')
        .send({ name: 'CC1.1 - Control Environment', category: 'Governance' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'ctrl-123');
    });

    it('should update a control status and recalc progress', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework as any);
      prismaMock.frameworkControl.findUnique.mockResolvedValue({
        ownerId: null,
        evidenceRequired: false,
        status: 'Pending',
      } as any);
      prismaMock.frameworkControl.update.mockResolvedValue({
        ...mockControl,
        status: 'Implemented',
      } as any);
      prismaMock.frameworkControl.findMany.mockResolvedValue([
        { ...mockControl, status: 'Implemented' },
      ] as any);
      prismaMock.complianceFramework.update.mockResolvedValue({
        ...mockFramework,
        progress: 100,
      } as any);

      const response = await request(app)
        .patch('/api/frameworks/fw-123/controls/ctrl-123')
        .send({ status: 'Implemented' })
        .expect(200);

      expect(response.body.status).toBe('Implemented');
    });

    it('should return 404 creating a control under a framework not owned by the org', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null as any);

      const response = await request(app)
        .post('/api/frameworks/fw-999/controls')
        .send({ name: 'Orphan Control' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Framework templates', () => {
    it('should list available framework templates', async () => {
      const response = await request(app)
        .get('/api/frameworks/templates')
        .expect(200);

      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });
  });

  describe('Cross-framework control mappings', () => {
    const sourceControl = {
      id: 'ctrl-src',
      name: 'AC-1',
      framework: { id: 'fw-1', name: 'NIST', organizationId: 'org-123' },
    };
    const targetControl = {
      id: 'ctrl-tgt',
      name: 'CC6.1',
      framework: { id: 'fw-2', name: 'SOC 2', organizationId: 'org-123' },
    };

    it('should create a control mapping between two owned controls', async () => {
      // createMapping resolves both controls (Promise.all), checks for an existing
      // mapping, then creates the new one.
      prismaMock.frameworkControl.findFirst
        .mockResolvedValueOnce(sourceControl as any)
        .mockResolvedValueOnce(targetControl as any);
      prismaMock.controlMapping.findFirst.mockResolvedValue(null as any);
      prismaMock.controlMapping.create.mockResolvedValue({
        id: 'map-1',
        sourceControlId: 'ctrl-src',
        targetControlId: 'ctrl-tgt',
        mappingType: 'equivalent',
        sourceControl,
        targetControl,
      } as any);

      const response = await request(app)
        .post('/api/control-mappings')
        .send({
          sourceControlId: 'ctrl-src',
          targetControlId: 'ctrl-tgt',
          mappingType: 'equivalent',
        })
        .expect(201);

      expect(response.body).toHaveProperty('mapping');
      expect(response.body.mapping).toHaveProperty('id', 'map-1');
    });

    it('should list all control mappings for the organization', async () => {
      prismaMock.controlMapping.findMany.mockResolvedValue([
        { id: 'map-1', sourceControl, targetControl },
      ] as any);

      const response = await request(app)
        .get('/api/control-mappings')
        .expect(200);

      expect(response.body).toHaveProperty('mappings');
      expect(Array.isArray(response.body.mappings)).toBe(true);
    });
  });
});
