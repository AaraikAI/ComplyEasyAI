/**
 * Compliance Routes Integration Tests
 *
 * Tests for DORA, SOD, SOX, and Auditor routes.
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
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

// Setup app
let app: Express;

describe('DORA Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    const doraRoutes = (await import('../../../routes/dora')).default;
    app.use('/api/dora', doraRoutes);
  });

  describe('GET /api/dora/dashboard', () => {
    it('should return DORA compliance dashboard', async () => {
      // Mock database responses
      (prismaMock as any).dORAICTRiskAssessment = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };
      (prismaMock as any).dORAICTIncident = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };
      (prismaMock as any).dORAThirdPartyProvider = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };
      (prismaMock as any).dORAResilienceTest = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };

      const response = await request(app)
        .get('/api/dora/dashboard')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/dora/ict-risk-assessments', () => {
    it('should create ICT risk assessment', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        name: 'Q1 ICT Risk Assessment',
        organizationId: 'org-123',
      };

      (prismaMock as any).dORAICTRiskAssessment = {
        create: jest.fn().mockResolvedValue(mockAssessment),
      };

      const response = await request(app)
        .post('/api/dora/ict-risk-assessments')
        .send({
          name: 'Q1 ICT Risk Assessment',
          assessmentDate: new Date().toISOString(),
          scope: 'All ICT systems',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});

describe('SOD Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    const sodRoutes = (await import('../../../routes/sod')).default;
    app.use('/api/sod', sodRoutes);
  });

  describe('GET /api/sod/rules', () => {
    it('should list SoD rules', async () => {
      const mockRules = [
        { id: 'rule-1', name: 'Procurement Rule', status: 'Active' },
        { id: 'rule-2', name: 'Finance Rule', status: 'Active' },
      ];

      prismaMock.soDRule.findMany.mockResolvedValue(mockRules as any);

      const response = await request(app)
        .get('/api/sod/rules')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/sod/analysis', () => {
    it('should run SoD analysis', async () => {
      prismaMock.soDRule.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.soDViolation.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/sod/analysis')
        .send({
          scope: 'all',
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});

describe('SOX Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    const soxRoutes = (await import('../../../routes/sox')).default;
    app.use('/api/sox', soxRoutes);
  });

  describe('GET /api/sox/controls', () => {
    it('should list SOX controls', async () => {
      prismaMock.sOXControl.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/sox/controls')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/sox/controls', () => {
    it('should create SOX control', async () => {
      const mockControl = {
        id: 'control-123',
        name: 'Revenue Recognition Control',
        controlId: 'SOX-001',
        organizationId: 'org-123',
      };

      prismaMock.sOXControl.create.mockResolvedValue(mockControl as any);

      const response = await request(app)
        .post('/api/sox/controls')
        .send({
          name: 'Revenue Recognition Control',
          controlId: 'SOX-001',
          category: 'Financial Reporting',
          controlType: 'Detective',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});

describe('Auditor Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    const auditorRoutes = (await import('../../../routes/auditor')).default;
    app.use('/api/auditor', auditorRoutes);
  });

  describe('GET /api/auditor/engagements', () => {
    it('should list audit engagements', async () => {
      prismaMock.auditEngagement.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/auditor/engagements')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/auditor/engagements', () => {
    it('should create audit engagement', async () => {
      const mockEngagement = {
        id: 'engagement-123',
        name: 'SOC 2 Type II Audit',
        organizationId: 'org-123',
      };

      prismaMock.auditEngagement.create.mockResolvedValue(mockEngagement as any);

      const response = await request(app)
        .post('/api/auditor/engagements')
        .send({
          name: 'SOC 2 Type II Audit',
          auditType: 'SOC 2',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
