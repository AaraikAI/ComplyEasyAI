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
  const mockFramework = {
    id: 'fw-123',
    name: 'SOC 2 Type II',
    organizationId: 'org-123',
    type: 'SOC2',
    status: 'Active',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequirement = {
    id: 'req-123',
    frameworkId: 'fw-123',
    code: 'CC1.1',
    title: 'Control Environment',
    description: 'Management commitment to integrity',
    status: 'Not Started',
    progress: 0,
  };

  const mockControl = {
    id: 'ctrl-123',
    name: 'Access Control Policy',
    description: 'Policy for access management',
    status: 'Draft',
    organizationId: 'org-123',
  };

  const mockEvidence = {
    id: 'ev-123',
    controlId: 'ctrl-123',
    type: 'Document',
    title: 'Access Control Policy Document',
    status: 'Pending',
    organizationId: 'org-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete SOC 2 Compliance Workflow', () => {
    it('should complete full framework compliance lifecycle', async () => {
      // Step 1: Start framework onboarding
      prismaMock.framework.create.mockResolvedValue(mockFramework as any);
      prismaMock.requirement.createMany.mockResolvedValue({ count: 100 } as any);

      const onboardResponse = await request(app)
        .post('/api/frameworks')
        .send({
          type: 'SOC2',
          name: 'SOC 2 Type II',
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      expect(onboardResponse.body).toHaveProperty('id');
      const frameworkId = onboardResponse.body.id;

      // Step 2: Get framework requirements
      prismaMock.framework.findFirst.mockResolvedValue(mockFramework as any);
      prismaMock.requirement.findMany.mockResolvedValue([mockRequirement] as any);

      const reqResponse = await request(app)
        .get(`/api/frameworks/${frameworkId}/requirements`)
        .expect(200);

      expect(Array.isArray(reqResponse.body)).toBe(true);

      // Step 3: Create control for requirement
      prismaMock.control.create.mockResolvedValue(mockControl as any);

      const controlResponse = await request(app)
        .post('/api/control-mappings')
        .send({
          requirementId: 'req-123',
          controlId: 'ctrl-123',
          mappingType: 'Primary',
        })
        .expect(201);

      expect(controlResponse.body).toHaveProperty('id');

      // Step 4: Update requirement status
      prismaMock.requirement.findFirst.mockResolvedValue(mockRequirement as any);
      prismaMock.requirement.update.mockResolvedValue({
        ...mockRequirement,
        status: 'In Progress',
      } as any);

      const updateReqResponse = await request(app)
        .patch(`/api/frameworks/${frameworkId}/requirements/req-123`)
        .send({ status: 'In Progress' })
        .expect(200);

      expect(updateReqResponse.body.status).toBe('In Progress');

      // Step 5: Get framework progress
      prismaMock.framework.findFirst.mockResolvedValue({
        ...mockFramework,
        progress: 45,
        requirements: [{ ...mockRequirement, status: 'In Progress' }],
      } as any);

      const progressResponse = await request(app)
        .get(`/api/frameworks/${frameworkId}`)
        .expect(200);

      expect(progressResponse.body).toHaveProperty('progress');
    });

    it('should handle multi-framework compliance', async () => {
      const frameworks = [
        { ...mockFramework, id: 'fw-1', type: 'SOC2', name: 'SOC 2' },
        { ...mockFramework, id: 'fw-2', type: 'ISO27001', name: 'ISO 27001' },
        { ...mockFramework, id: 'fw-3', type: 'HIPAA', name: 'HIPAA' },
      ];

      prismaMock.framework.findMany.mockResolvedValue(frameworks as any);

      const listResponse = await request(app)
        .get('/api/frameworks')
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
    });
  });

  describe('Control Mapping Workflow', () => {
    it('should map controls across frameworks', async () => {
      const mappings = [
        { id: 'm1', controlId: 'ctrl-123', requirementId: 'req-1', frameworkId: 'fw-1' },
        { id: 'm2', controlId: 'ctrl-123', requirementId: 'req-2', frameworkId: 'fw-2' },
      ];

      prismaMock.controlMapping.findMany.mockResolvedValue(mappings as any);

      const response = await request(app)
        .get('/api/control-mappings')
        .query({ controlId: 'ctrl-123' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get cross-framework coverage', async () => {
      prismaMock.controlMapping.groupBy.mockResolvedValue([
        { frameworkId: 'fw-1', _count: { id: 50 } },
        { frameworkId: 'fw-2', _count: { id: 45 } },
      ] as any);

      const response = await request(app)
        .get('/api/control-mappings/coverage')
        .expect(200);

      expect(response.body).toHaveProperty('coverage');
    });
  });

  describe('Evidence Collection Workflow', () => {
    it('should collect and validate evidence', async () => {
      prismaMock.evidence.create.mockResolvedValue(mockEvidence as any);
      prismaMock.evidence.findMany.mockResolvedValue([mockEvidence] as any);

      // Create evidence
      const createResponse = await request(app)
        .post('/api/frameworks/fw-123/evidence')
        .send({
          controlId: 'ctrl-123',
          type: 'Document',
          title: 'Access Control Policy',
          fileUrl: 'https://storage.example.com/evidence/policy.pdf',
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');

      // List evidence
      const listResponse = await request(app)
        .get('/api/frameworks/fw-123/evidence')
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
    });

    it('should track evidence freshness', async () => {
      const staleEvidence = {
        ...mockEvidence,
        collectedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days old
        isFresh: false,
      };

      prismaMock.evidence.findMany.mockResolvedValue([staleEvidence] as any);

      const response = await request(app)
        .get('/api/frameworks/fw-123/evidence')
        .query({ checkFreshness: true })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Audit Preparation Workflow', () => {
    it('should prepare audit package', async () => {
      prismaMock.framework.findFirst.mockResolvedValue({
        ...mockFramework,
        requirements: [mockRequirement],
        controls: [mockControl],
        evidence: [mockEvidence],
      } as any);

      const response = await request(app)
        .post('/api/frameworks/fw-123/prepare-audit')
        .send({
          auditType: 'External',
          auditorName: 'Big Four Auditor',
          startDate: new Date(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('auditPackage');
    });

    it('should identify gaps before audit', async () => {
      const incompleteReqs = [
        { ...mockRequirement, status: 'Not Started' },
        { ...mockRequirement, id: 'req-2', status: 'In Progress' },
      ];

      prismaMock.requirement.findMany.mockResolvedValue(incompleteReqs as any);

      const response = await request(app)
        .get('/api/frameworks/fw-123/gaps')
        .expect(200);

      expect(response.body).toHaveProperty('gaps');
    });
  });

  describe('Framework Dashboard', () => {
    it('should get compliance dashboard metrics', async () => {
      prismaMock.framework.findMany.mockResolvedValue([
        { ...mockFramework, progress: 85 },
        { ...mockFramework, id: 'fw-2', progress: 60 },
      ] as any);

      const response = await request(app)
        .get('/api/frameworks/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('overallProgress');
      expect(response.body).toHaveProperty('frameworkStats');
    });
  });
});
