/**
 * Exceptions Route Contract Tests
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

import exceptionsRoutes from '../../../routes/exceptions';
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
app.use('/api/exceptions', exceptionsRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockException = (overrides: Record<string, any> = {}) => ({
  id: 'exc-123', organizationId: 'org-123', controlId: 'ctrl-123',
  title: 'Legacy System Exception', justification: 'Cannot upgrade',
  riskAcceptance: 'Medium risk accepted', compensatingControls: 'Enhanced monitoring',
  requestedBy: 'user-123', approvedBy: null,
  expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  status: 'REQUESTED', createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Exceptions API', () => {
  const authToken = generateTestToken();

  describe('GET /api/exceptions/expiring', () => {
    it('should return expiring exceptions', async () => {
      prismaMock.complianceException.findMany.mockResolvedValue([mockException({ status: 'APPROVED' })]);

      const response = await request(app)
        .get('/api/exceptions/expiring')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('exceptions');
      expect(response.body.data).toHaveProperty('windowDays');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/exceptions/expiring');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/exceptions/stats', () => {
    it('should return exception statistics', async () => {
      prismaMock.complianceException.findMany.mockResolvedValue([mockException()]);
      prismaMock.complianceException.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/exceptions/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('currentlyExpired');
    });
  });

  describe('GET /api/exceptions', () => {
    it('should return paginated exceptions', async () => {
      prismaMock.complianceException.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.complianceException.findMany.mockResolvedValue([mockException()]);
      prismaMock.complianceException.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/exceptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('exceptions');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/exceptions/:id', () => {
    it('should return a specific exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(mockException());

      const response = await request(app)
        .get('/api/exceptions/exc-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('exc-123');
    });

    it('should return 404 for non-existent exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/exceptions/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/exceptions', () => {
    it('should create an exception', async () => {
      prismaMock.complianceException.create.mockResolvedValue(mockException());

      const response = await request(app)
        .post('/api/exceptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          controlId: 'ctrl-123', title: 'Legacy System',
          justification: 'Cannot upgrade', riskAcceptance: 'Medium',
          expiryDate: '2027-12-31', reviewDate: '2027-06-30',
        });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/exceptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', title: 'Partial' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/exceptions/:id', () => {
    it('should update an exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(mockException());
      prismaMock.complianceException.update.mockResolvedValue(mockException({ title: 'Updated' }));

      const response = await request(app)
        .patch('/api/exceptions/exc-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/exceptions/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/exceptions/:id/approve', () => {
    it('should approve a REQUESTED exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(mockException({ status: 'REQUESTED' }));
      prismaMock.complianceException.update.mockResolvedValue(mockException({ status: 'APPROVED' }));

      const response = await request(app)
        .patch('/api/exceptions/exc-123/approve')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 400 for non-REQUESTED exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(mockException({ status: 'APPROVED' }));

      const response = await request(app)
        .patch('/api/exceptions/exc-123/approve')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/exceptions/non-existent/approve')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/exceptions/:id/reject', () => {
    it('should reject a REQUESTED exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(mockException({ status: 'REQUESTED' }));
      prismaMock.complianceException.update.mockResolvedValue(mockException({ status: 'REJECTED' }));

      const response = await request(app)
        .patch('/api/exceptions/exc-123/reject')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 400 for non-REQUESTED exception', async () => {
      prismaMock.complianceException.findFirst.mockResolvedValue(mockException({ status: 'APPROVED' }));

      const response = await request(app)
        .patch('/api/exceptions/exc-123/reject')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });
});
