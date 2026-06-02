/**
 * E2E Tests - Risk Management Flow
 * Tests the complete risk management workflow
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockRiskItem } from '../mocks/prisma';

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
  AuditLogger: {
    log: jest.fn(),
  },
}));

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn(),
    generateRemediationPlan: jest.fn(),
  },
}));

// Mock auth middleware so the router's built-in authenticate/authorize work
jest.mock('../../middleware/auth', () => ({
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

// Mock rate limiters
jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

import risksRoutes from '../../routes/risks';
import { errorHandler } from '../../middleware/errorHandler';

// Create self-contained Express app for testing (avoids side effects of importing index.ts)
const app = express();
app.use(express.json());

// Mock auth middleware that sets user
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'test@example.com',
    name: 'Test User',
  };
  next();
});

app.use('/api/risks', risksRoutes);
app.use(errorHandler);

describe('E2E: Risk Management Flow', () => {
  beforeEach(() => {
    // Re-setup gemini mocks (resetMocks: true clears implementations)
    const geminiService = require('../../services/geminiService').default;
    geminiService.prioritizeRisks.mockResolvedValue([
      { id: 'r1', score: 95, rationale: 'High severity' },
    ]);
    geminiService.generateRemediationPlan.mockResolvedValue('Remediation plan');
  });

  describe('Complete Risk Management Workflow', () => {
    it('should complete full risk lifecycle', async () => {
      const mockRisk = createMockRiskItem({
        title: 'E2E Test Risk',
        description: 'Test risk for E2E testing',
        severity: 'High',
        category: 'Security',
        likelihood: 4,
        impact: 5,
      });

      // Step 1: Create a risk
      prismaMock.riskItem.create.mockResolvedValue(mockRisk);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const createResponse = await request(app)
        .post('/api/risks')
        .send({
          title: 'E2E Test Risk',
          description: 'Test risk for E2E testing',
          severity: 'High',
          category: 'Security',
          likelihood: 4,
          impact: 5,
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const riskId = createResponse.body.id;

      // Step 2: Get the risk
      prismaMock.riskItem.findFirst.mockResolvedValue(mockRisk);

      const getResponse = await request(app)
        .get(`/api/risks/${riskId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', riskId);

      // Step 3: Prioritize risks
      prismaMock.riskItem.findMany.mockResolvedValue([mockRisk]);
      prismaMock.riskItem.update.mockResolvedValue({} as any);

      const prioritizeResponse = await request(app)
        .post('/api/risks/prioritize')
        .expect(200);

      expect(Array.isArray(prioritizeResponse.body)).toBe(true);

      // Step 4: Update risk status
      const updatedRisk = { ...mockRisk, status: 'In Progress' };
      prismaMock.riskItem.findFirst.mockResolvedValue(mockRisk);
      prismaMock.riskItem.update.mockResolvedValue(updatedRisk);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const updateResponse = await request(app)
        .patch(`/api/risks/${riskId}`)
        .send({
          status: 'In Progress',
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('status', 'In Progress');
    });
  });

  describe('Risk Scanning Workflow', () => {
    it('should perform risk scan and return detected risks with scan totals', async () => {
      // POST /api/risks/scan -> risksController.scan reads frameworks + integrations,
      // creates risk items for at-risk controls, then writes an audit log. With no
      // frameworks or integrations the scan completes cleanly with an empty result set.
      prismaMock.complianceFramework.findMany.mockResolvedValue([] as any);
      prismaMock.integration.findMany.mockResolvedValue([] as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/risks/scan')
        .send({
          organizationId: 'org-123',
          scanType: 'full',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Risk scan completed');
      expect(Array.isArray(response.body.newRisks)).toBe(true);
      expect(response.body.newRisks).toHaveLength(0);
      expect(response.body.totalScanned).toEqual({ frameworks: 0, integrations: 0 });
    });

    it('should create risk items for non-compliant controls during a scan', async () => {
      // A framework with a Failed control must yield one new High-severity risk item.
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        {
          id: 'fw-1',
          name: 'SOC 2',
          organizationId: 'org-123',
          progress: 80,
          status: 'In_Progress',
          nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          controls: [
            { id: 'c-1', name: 'Access Control', status: 'Failed', description: 'desc', evidence: 'ev' },
          ],
        },
      ] as any);
      prismaMock.integration.findMany.mockResolvedValue([] as any);
      prismaMock.riskItem.findFirst.mockResolvedValue(null);
      const createdRisk = createMockRiskItem({ id: 'risk-scan-1', title: 'Non-Compliant Control: Access Control', severity: 'High' });
      prismaMock.riskItem.create.mockResolvedValue(createdRisk);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/risks/scan')
        .send({ scanType: 'full' })
        .expect(200);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Non-Compliant Control: Access Control',
            severity: 'High',
            category: 'Compliance',
            organizationId: 'org-123',
            status: 'Open',
          }),
        }),
      );
      expect(response.body.newRisks).toHaveLength(1);
      expect(response.body.totalScanned.frameworks).toBe(1);
    });
  });
});
