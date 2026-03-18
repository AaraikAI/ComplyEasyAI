/**
 * Evidence Collection Route Contract Tests
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

import evidenceCollectionRoutes from '../../../routes/evidenceCollection';
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
app.use('/api/evidence-collection', evidenceCollectionRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockRule = (overrides: Record<string, any> = {}) => ({
  id: 'ecr-123', organizationId: 'org-123', controlId: 'ctrl-123',
  sourceType: 'AWS_CONFIG', integrationId: null, query: null,
  schedule: null, isActive: true, lastCollectedAt: null,
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Evidence Collection API', () => {
  const authToken = generateTestToken();

  describe('GET /api/evidence-collection/status', () => {
    it('should return collection status dashboard', async () => {
      prismaMock.evidenceCollectionRule.findMany.mockResolvedValue([mockRule()]);

      const response = await request(app)
        .get('/api/evidence-collection/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('rules');
      expect(response.body.data.summary).toHaveProperty('totalRules');
      expect(response.body.data.summary).toHaveProperty('activeRules');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/evidence-collection/status');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/evidence-collection', () => {
    it('should return paginated collection rules', async () => {
      prismaMock.evidenceCollectionRule.findMany.mockResolvedValue([mockRule()]);
      prismaMock.evidenceCollectionRule.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/evidence-collection')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('rules');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/evidence-collection/:id', () => {
    it('should return a specific rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(mockRule());

      const response = await request(app)
        .get('/api/evidence-collection/ecr-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('ecr-123');
    });

    it('should return 404 for non-existent rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/evidence-collection/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/evidence-collection', () => {
    it('should create a collection rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(null); // no duplicate
      prismaMock.evidenceCollectionRule.create.mockResolvedValue(mockRule());

      const response = await request(app)
        .post('/api/evidence-collection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', sourceType: 'AWS_CONFIG' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/evidence-collection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123' });

      expect(response.status).toBe(400);
    });

    it('should validate sourceType enum', async () => {
      const response = await request(app)
        .post('/api/evidence-collection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', sourceType: 'INVALID' });

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate rules', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(mockRule());

      const response = await request(app)
        .post('/api/evidence-collection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', sourceType: 'AWS_CONFIG' });

      expect(response.status).toBe(409);
    });
  });

  describe('PATCH /api/evidence-collection/:id', () => {
    it('should update a collection rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(mockRule());
      prismaMock.evidenceCollectionRule.update.mockResolvedValue(mockRule({ isActive: false }));

      const response = await request(app)
        .patch('/api/evidence-collection/ecr-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/evidence-collection/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/evidence-collection/:id', () => {
    it('should delete a collection rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(mockRule());
      prismaMock.evidenceCollectionRule.delete.mockResolvedValue(mockRule());

      const response = await request(app)
        .delete('/api/evidence-collection/ecr-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/evidence-collection/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/evidence-collection/:id/trigger', () => {
    it('should trigger manual collection', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(mockRule({ isActive: true }));
      prismaMock.evidenceCollectionRule.update.mockResolvedValue(mockRule({ lastCollectedAt: new Date() }));

      const response = await request(app)
        .post('/api/evidence-collection/ecr-123/trigger')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 400 for inactive rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(mockRule({ isActive: false }));

      const response = await request(app)
        .post('/api/evidence-collection/ecr-123/trigger')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent rule', async () => {
      prismaMock.evidenceCollectionRule.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/evidence-collection/non-existent/trigger')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
