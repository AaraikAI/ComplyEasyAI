/**
 * Costs Route Contract Tests
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

import costsRoutes from '../../../routes/costs';
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
app.use('/api/costs', costsRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockCost = (overrides: Record<string, any> = {}) => ({
  id: 'cost-123', organizationId: 'org-123', category: 'TOOL_LICENSE',
  description: 'Security tool license', amount: 5000, currency: 'USD',
  frameworkId: null, controlId: null, vendorId: null,
  periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31'),
  createdBy: 'user-123', createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Costs API', () => {
  const authToken = generateTestToken();

  describe('GET /api/costs/summary', () => {
    it('should return cost summary', async () => {
      prismaMock.complianceCost.aggregate.mockResolvedValue({ _sum: { amount: 10000 }, _count: 5 } as any);
      prismaMock.complianceCost.groupBy.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/costs/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalSpend');
      expect(response.body.data).toHaveProperty('byCategory');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/costs/summary');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/costs/trend', () => {
    it('should return cost trend data', async () => {
      prismaMock.complianceCost.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/costs/trend')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('trend');
      expect(response.body.data).toHaveProperty('months');
    });
  });

  describe('GET /api/costs/budget', () => {
    it('should return budget vs actual data', async () => {
      prismaMock.complianceCost.groupBy.mockResolvedValue([]);
      prismaMock.complianceCost.aggregate.mockResolvedValue({ _sum: { amount: 0 }, _count: 0 } as any);

      const response = await request(app)
        .get('/api/costs/budget')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('year');
      expect(response.body.data).toHaveProperty('totalActual');
      expect(response.body.data).toHaveProperty('quarterly');
    });
  });

  describe('GET /api/costs', () => {
    it('should return paginated costs', async () => {
      prismaMock.complianceCost.findMany.mockResolvedValue([mockCost()]);
      prismaMock.complianceCost.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/costs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('costs');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('POST /api/costs', () => {
    it('should create a cost entry', async () => {
      prismaMock.complianceCost.create.mockResolvedValue(mockCost());

      const response = await request(app)
        .post('/api/costs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'TOOL_LICENSE', description: 'Security tool',
          amount: 5000, periodStart: '2026-01-01', periodEnd: '2026-12-31',
        });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/costs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category: 'TOOL_LICENSE' });

      expect(response.status).toBe(400);
    });

    it('should validate category enum', async () => {
      const response = await request(app)
        .post('/api/costs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'INVALID', description: 'Test',
          amount: 100, periodStart: '2026-01-01', periodEnd: '2026-12-31',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/costs/:id', () => {
    it('should update a cost entry', async () => {
      prismaMock.complianceCost.findFirst.mockResolvedValue(mockCost());
      prismaMock.complianceCost.update.mockResolvedValue(mockCost({ amount: 6000 }));

      const response = await request(app)
        .patch('/api/costs/cost-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 6000 });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent cost', async () => {
      prismaMock.complianceCost.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/costs/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 6000 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/costs/:id', () => {
    it('should delete a cost entry', async () => {
      prismaMock.complianceCost.findFirst.mockResolvedValue(mockCost());
      prismaMock.complianceCost.delete.mockResolvedValue(mockCost());

      const response = await request(app)
        .delete('/api/costs/cost-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent cost', async () => {
      prismaMock.complianceCost.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/costs/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
