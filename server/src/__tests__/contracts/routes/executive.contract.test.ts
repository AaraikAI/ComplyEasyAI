/**
 * Executive Route Contract Tests
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

import executiveRoutes from '../../../routes/executive';
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
app.use('/api/executive', executiveRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Executive API', () => {
  const authToken = generateTestToken();

  // Setup common mocks for the dashboard which queries many tables
  const setupDashboardMocks = () => {
    prismaMock.complianceFramework.findMany.mockResolvedValue([
      { id: 'fw-1', name: 'SOC 2', progress: 75, status: 'In_Progress', controls: [{ id: 'c-1', status: 'Implemented' }] } as any,
    ]);
    prismaMock.riskItem.findMany.mockResolvedValue([
      { id: 'r-1', severity: 'High', status: 'Open', createdAt: new Date() },
    ]);
    prismaMock.grcIncident.findMany.mockResolvedValue([]);
    prismaMock.certification.findMany.mockResolvedValue([]);
    prismaMock.complianceException.findMany.mockResolvedValue([]);
    prismaMock.controlEffectivenessRecord.findMany.mockResolvedValue([]);
    prismaMock.maturityAssessment.findFirst.mockResolvedValue(null);
    prismaMock.vendor.findMany.mockResolvedValue([]);
  };

  describe('GET /api/executive/dashboard', () => {
    it('should return aggregated executive dashboard', async () => {
      setupDashboardMocks();

      const response = await request(app)
        .get('/api/executive/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('overallCompliance');
      expect(response.body.data).toHaveProperty('frameworkScores');
      expect(response.body.data).toHaveProperty('riskPosture');
      expect(response.body.data).toHaveProperty('incidents');
      expect(response.body.data).toHaveProperty('certifications');
      expect(response.body.data).toHaveProperty('auditReadiness');
      expect(response.body.data).toHaveProperty('generatedAt');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/executive/dashboard');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/executive/rag-status', () => {
    it('should return RAG status per framework', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        { id: 'fw-1', name: 'SOC 2', progress: 85, status: 'In_Progress', nextAuditDate: new Date() } as any,
      ]);

      const response = await request(app)
        .get('/api/executive/rag-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('overall');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('frameworks');
    });
  });

  describe('POST /api/executive/board-pack', () => {
    it('should generate board pack data', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);
      prismaMock.riskItem.findMany.mockResolvedValue([]);
      prismaMock.grcIncident.findMany.mockResolvedValue([]);
      prismaMock.certification.findMany.mockResolvedValue([]);
      prismaMock.complianceException.findMany.mockResolvedValue([]);
      prismaMock.complianceCost.aggregate.mockResolvedValue({ _sum: { amount: 0 }, _count: 0 } as any);
      prismaMock.controlEffectivenessRecord.groupBy.mockResolvedValue([]);
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/executive/board-pack')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data).toHaveProperty('executiveSummary');
      expect(response.body.data).toHaveProperty('frameworkCompliance');
    });
  });

  describe('GET /api/executive/trends', () => {
    it('should return period-over-period trends', async () => {
      prismaMock.riskItem.count.mockResolvedValue(0);
      prismaMock.grcIncident.count.mockResolvedValue(0);
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);
      prismaMock.complianceException.count.mockResolvedValue(0);
      prismaMock.complianceCost.aggregate.mockResolvedValue({ _sum: { amount: 0 } } as any);

      const response = await request(app)
        .get('/api/executive/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('periodDays');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data).toHaveProperty('frameworkProgress');
    });
  });
});
