/**
 * Report Builder Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
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

import reportRoutes from '../../../routes/reports';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'test-secret') as any; } catch {}
  }
  next();
});
app.use('/api/reports', reportRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Reports API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET /library
  describe('GET /api/reports/library', () => {
    it('should return pre-built report library', async () => {
      const res = await request(app).get('/api/reports/library').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // GET /
  describe('GET /api/reports/', () => {
    it('should list report templates', async () => {
      prismaMock.reportTemplate.findMany.mockResolvedValue([]);
      prismaMock.reportTemplate.count.mockResolvedValue(0);
      prismaMock.user.findMany.mockResolvedValue([]);
      const res = await request(app).get('/api/reports/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('meta');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/reports/');
      expect(res.status).toBe(401);
    });
  });

  // GET /:id
  describe('GET /api/reports/:id', () => {
    it('should return report template', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue({
        id: 'r-1', organizationId: 'org-123', createdBy: 'user-123', name: 'Report',
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-123', name: 'Test', email: 'test@example.com' });

      const res = await request(app).get('/api/reports/r-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', 'r-1');
    });

    it('should return 404 if not found', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/reports/r-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // POST /
  describe('POST /api/reports/', () => {
    it('should create a report template', async () => {
      prismaMock.reportTemplate.create.mockResolvedValue({ id: 'r-1', name: 'New Report' });
      const res = await request(app)
        .post('/api/reports/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Report' });
      expect(res.status).toBe(201);
    });

    it('should return 400 when name missing', async () => {
      const res = await request(app).post('/api/reports/').set('Authorization', `Bearer ${authToken}`).send({});
      expect(res.status).toBe(400);
    });
  });

  // PATCH /:id
  describe('PATCH /api/reports/:id', () => {
    it('should update a report template', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue({ id: 'r-1', organizationId: 'org-123' });
      prismaMock.reportTemplate.update.mockResolvedValue({ id: 'r-1', name: 'Updated' });
      const res = await request(app).patch('/api/reports/r-1').set('Authorization', `Bearer ${authToken}`).send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('should return 404 if not found', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue(null);
      const res = await request(app).patch('/api/reports/r-bad').set('Authorization', `Bearer ${authToken}`).send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  // DELETE /:id
  describe('DELETE /api/reports/:id', () => {
    it('should delete a report template', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue({ id: 'r-1', organizationId: 'org-123' });
      prismaMock.reportTemplate.delete.mockResolvedValue({ id: 'r-1' });
      const res = await request(app).delete('/api/reports/r-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('deleted', true);
    });
  });

  // POST /:id/generate
  describe('POST /api/reports/:id/generate', () => {
    it('should generate a report from template', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue({
        id: 'r-1', organizationId: 'org-123', createdBy: 'user-123', name: 'Report',
        sections: [{ id: 's1', title: 'Summary', type: 'summary', dataSources: ['risks'] }],
        filters: {}, format: 'PDF',
      });
      prismaMock.riskItem.findMany.mockResolvedValue([]);
      prismaMock.riskItem.count.mockResolvedValue(0);
      prismaMock.riskItem.groupBy.mockResolvedValue([]);
      prismaMock.reportTemplate.update.mockResolvedValue({ id: 'r-1' });

      const res = await request(app)
        .post('/api/reports/r-1/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('metadata');
      expect(res.body.data).toHaveProperty('sections');
    });

    it('should return 404 if template not found', async () => {
      prismaMock.reportTemplate.findFirst.mockResolvedValue(null);
      const res = await request(app).post('/api/reports/r-bad/generate').set('Authorization', `Bearer ${authToken}`).send({});
      expect(res.status).toBe(404);
    });
  });
});
