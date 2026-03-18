/**
 * Audit Prep Route Contract Tests
 */

import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) { next(); return; }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    next();
  },
  AuthRequest: {},
}));

import auditPrepRoutes from '../../../routes/auditPrep';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'test-secret'); }
    catch { res.status(401).json({ error: 'Invalid token' }); return; }
  }
  next();
});
app.use('/api/audit-prep', auditPrepRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockFramework = (overrides: Record<string, any> = {}) => ({
  id: 'fw-123', organizationId: 'org-123', name: 'SOC 2',
  description: 'SOC 2 Type II', status: 'In_Progress', progress: 75,
  nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  createdAt: new Date(), updatedAt: new Date(),
  controls: [
    {
      id: 'ctrl-1', name: 'CC1.1', category: 'Security', status: 'Implemented',
      evidence: 'doc.pdf', evidenceRequired: true,
      evidenceVersions: [{ uploadedAt: new Date(), isCurrent: true, fileName: 'doc.pdf', fileUrl: '/doc.pdf', uploadedBy: 'user-123', versionNumber: 1 }],
    },
    {
      id: 'ctrl-2', name: 'CC1.2', category: 'Security', status: 'Not Started',
      evidence: null, evidenceRequired: true,
      evidenceVersions: [],
    },
  ],
  ...overrides,
});

describe('Audit Prep API', () => {
  const authToken = generateTestToken();

  describe('POST /api/audit-prep/analyze', () => {
    it('should return full readiness analysis', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());
      prismaMock.policy.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/audit-prep/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ framework: 'fw-123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('domains');
      expect(response.body.data).toHaveProperty('totalControls');
      expect(response.body.data).toHaveProperty('gapsCount');
    });

    it('should validate framework is required', async () => {
      const response = await request(app)
        .post('/api/audit-prep/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/audit-prep/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ framework: 'non-existent' });

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/audit-prep/analyze')
        .send({ framework: 'fw-123' });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/audit-prep/readiness/:frameworkId', () => {
    it('should return readiness score', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());
      prismaMock.policy.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/audit-prep/readiness/fw-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('readinessScore');
      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data).toHaveProperty('totalControls');
    });

    it('should return 404 for non-existent framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/audit-prep/readiness/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/audit-prep/gaps/:frameworkId', () => {
    it('should return gaps for a framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());
      prismaMock.policy.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/audit-prep/gaps/fw-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('gaps');
      expect(response.body.data).toHaveProperty('totalGaps');
    });
  });

  describe('POST /api/audit-prep/mock-questions/:frameworkId', () => {
    it('should generate mock audit questions', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());

      const response = await request(app)
        .post('/api/audit-prep/mock-questions/fw-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('questions');
      expect(response.body.data).toHaveProperty('totalQuestions');
    });

    it('should return 404 for non-existent framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/audit-prep/mock-questions/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/audit-prep/evidence-package/:frameworkId', () => {
    it('should generate evidence package manifest', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());

      const response = await request(app)
        .post('/api/audit-prep/evidence-package/fw-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('categories');
    });

    it('should return 404 for non-existent framework', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/audit-prep/evidence-package/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/audit-prep/timeline/:frameworkId', () => {
    it('should return remediation timeline', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());
      prismaMock.policy.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/audit-prep/timeline/fw-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalGaps');
      expect(response.body.data).toHaveProperty('estimatedWorkingDays');
      expect(response.body.data).toHaveProperty('phases');
    });
  });

  describe('POST /api/audit-prep/executive-summary', () => {
    it('should generate executive summary', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());
      prismaMock.policy.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/audit-prep/executive-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ framework: 'fw-123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('overallReadiness');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should validate framework is required', async () => {
      const response = await request(app)
        .post('/api/audit-prep/executive-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/audit-prep/export-evidence', () => {
    it('should export evidence package', async () => {
      prismaMock.complianceFramework.findFirst.mockResolvedValue(mockFramework());

      const response = await request(app)
        .post('/api/audit-prep/export-evidence')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ framework: 'fw-123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('items');
    });

    it('should validate framework is required', async () => {
      const response = await request(app)
        .post('/api/audit-prep/export-evidence')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
