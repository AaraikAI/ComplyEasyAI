/**
 * Maturity Assessment Route Contract Tests
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

import maturityRoutes from '../../../routes/maturity';
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
app.use('/api/maturity', maturityRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockAssessment = (overrides: Record<string, any> = {}) => ({
  id: 'ma-123', organizationId: 'org-123', assessmentDate: new Date(),
  overallLevel: 3, recommendations: null, createdAt: new Date(), updatedAt: new Date(),
  domains: [
    { id: 'd-1', domain: 'Governance', currentLevel: 3, targetLevel: 4, gaps: null },
    { id: 'd-2', domain: 'Risk', currentLevel: 2, targetLevel: 4, gaps: null },
  ],
  ...overrides,
});

describe('Maturity API', () => {
  const authToken = generateTestToken();

  describe('GET /api/maturity/assessments/latest', () => {
    it('should return the latest assessment', async () => {
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(mockAssessment());

      const response = await request(app)
        .get('/api/maturity/assessments/latest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('overallLevel');
    });

    it('should return 404 when no assessments exist', async () => {
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/maturity/assessments/latest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/maturity/assessments/latest');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/maturity/assessments/trend', () => {
    it('should return assessment trend data', async () => {
      prismaMock.maturityAssessment.findMany.mockResolvedValue([mockAssessment()]);

      const response = await request(app)
        .get('/api/maturity/assessments/trend')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('trend');
      expect(response.body.data).toHaveProperty('totalAssessments');
    });
  });

  describe('GET /api/maturity/assessments', () => {
    it('should return paginated assessments', async () => {
      prismaMock.maturityAssessment.findMany.mockResolvedValue([mockAssessment()]);
      prismaMock.maturityAssessment.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/maturity/assessments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toHaveProperty('total');
    });
  });

  describe('GET /api/maturity/assessments/:id', () => {
    it('should return a specific assessment', async () => {
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(mockAssessment());

      const response = await request(app)
        .get('/api/maturity/assessments/ma-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('ma-123');
    });

    it('should return 404 for non-existent assessment', async () => {
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/maturity/assessments/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/maturity/assessments', () => {
    it('should create an assessment', async () => {
      prismaMock.maturityAssessment.create.mockResolvedValue(mockAssessment());

      const response = await request(app)
        .post('/api/maturity/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domains: [{ domain: 'Governance', currentLevel: 3, targetLevel: 4 }] });

      expect(response.status).toBe(201);
    });

    it('should validate domains array is required', async () => {
      const response = await request(app)
        .post('/api/maturity/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate domain entries have a domain name', async () => {
      const response = await request(app)
        .post('/api/maturity/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domains: [{ currentLevel: 3 }] });

      expect(response.status).toBe(400);
    });

    it('should validate currentLevel range (1-5)', async () => {
      const response = await request(app)
        .post('/api/maturity/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domains: [{ domain: 'Governance', currentLevel: 6 }] });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/maturity/assessments/:id/recommendations', () => {
    it('should generate recommendations', async () => {
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(mockAssessment());
      prismaMock.maturityAssessment.update.mockResolvedValue(mockAssessment());

      const response = await request(app)
        .post('/api/maturity/assessments/ma-123/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should return 404 for non-existent assessment', async () => {
      prismaMock.maturityAssessment.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/maturity/assessments/non-existent/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });
  });
});
