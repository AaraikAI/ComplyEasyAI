/**
 * Regulatory Changes Route Contract Tests
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

import regulatoryChangesRoutes from '../../../routes/regulatoryChanges';
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
app.use('/api/regulatory-changes', regulatoryChangesRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockChange = (overrides: Record<string, any> = {}) => ({
  id: 'rc-123', regulationName: 'GDPR', changeType: 'AMENDMENT',
  title: 'New GDPR Amendment', summary: 'New requirements for AI systems',
  sourceUrl: null, effectiveDate: null, impactAnalysis: null,
  status: 'NEW', detectedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
  impacts: [{ id: 'imp-1', organizationId: 'org-123', impactLevel: 'Medium' }],
  ...overrides,
});

const mockImpact = (overrides: Record<string, any> = {}) => ({
  id: 'imp-123', regulatoryChangeId: 'rc-123', controlId: 'ctrl-123',
  organizationId: 'org-123', impactLevel: 'Medium',
  requiredAction: 'Review controls', status: 'NEW',
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Regulatory Changes API', () => {
  const authToken = generateTestToken();

  describe('GET /api/regulatory-changes/stats', () => {
    it('should return regulatory change stats', async () => {
      prismaMock.regulatoryChangeImpact.findMany.mockResolvedValue([
        {
          ...mockImpact(),
          regulatoryChange: { changeType: 'AMENDMENT', status: 'NEW', regulationName: 'GDPR' },
          regulatoryChangeId: 'rc-123',
        } as any,
      ]);

      const response = await request(app)
        .get('/api/regulatory-changes/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalChanges');
      expect(response.body.data).toHaveProperty('totalImpacts');
      expect(response.body.data).toHaveProperty('byType');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/regulatory-changes/stats');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/regulatory-changes', () => {
    it('should return paginated regulatory changes', async () => {
      prismaMock.regulatoryChangeDetection.findMany.mockResolvedValue([mockChange()]);
      prismaMock.regulatoryChangeDetection.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/regulatory-changes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('changes');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/regulatory-changes/:id', () => {
    it('should return a specific change with impacts', async () => {
      prismaMock.regulatoryChangeDetection.findUnique.mockResolvedValue(mockChange());

      const response = await request(app)
        .get('/api/regulatory-changes/rc-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('rc-123');
    });

    it('should return 404 for non-existent change', async () => {
      prismaMock.regulatoryChangeDetection.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/regulatory-changes/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 if org has no impacts', async () => {
      prismaMock.regulatoryChangeDetection.findUnique.mockResolvedValue(
        mockChange({ impacts: [] })
      );

      const response = await request(app)
        .get('/api/regulatory-changes/rc-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/regulatory-changes', () => {
    it('should create a regulatory change', async () => {
      prismaMock.regulatoryChangeDetection.create.mockResolvedValue(mockChange());
      prismaMock.regulatoryChangeImpact.create.mockResolvedValue(mockImpact());
      prismaMock.regulatoryChangeDetection.findUnique.mockResolvedValue(mockChange());

      const response = await request(app)
        .post('/api/regulatory-changes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          regulationName: 'GDPR', changeType: 'AMENDMENT',
          title: 'New Amendment', summary: 'New requirements',
        });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/regulatory-changes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ regulationName: 'GDPR' });

      expect(response.status).toBe(400);
    });

    it('should validate changeType enum', async () => {
      const response = await request(app)
        .post('/api/regulatory-changes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          regulationName: 'GDPR', changeType: 'INVALID',
          title: 'Test', summary: 'Test',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/regulatory-changes/:id', () => {
    it('should update a regulatory change', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(mockImpact());
      prismaMock.regulatoryChangeDetection.update.mockResolvedValue(mockChange({ status: 'REVIEWING' }));

      const response = await request(app)
        .patch('/api/regulatory-changes/rc-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'REVIEWING' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent change', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/regulatory-changes/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'REVIEWING' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/regulatory-changes/:id/dismiss', () => {
    it('should dismiss a regulatory change', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(mockImpact());
      prismaMock.regulatoryChangeImpact.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.regulatoryChangeImpact.count.mockResolvedValue(0);
      prismaMock.regulatoryChangeDetection.update.mockResolvedValue(mockChange({ status: 'DISMISSED' }));

      const response = await request(app)
        .patch('/api/regulatory-changes/rc-123/dismiss')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent change', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/regulatory-changes/non-existent/dismiss')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/regulatory-changes/:id/impacts', () => {
    it('should return paginated impacts for a change', async () => {
      prismaMock.regulatoryChangeImpact.findMany.mockResolvedValue([mockImpact()]);
      prismaMock.regulatoryChangeImpact.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/regulatory-changes/rc-123/impacts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('impacts');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('POST /api/regulatory-changes/:id/impacts', () => {
    it('should add an impact assessment', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(mockImpact());
      prismaMock.regulatoryChangeImpact.create.mockResolvedValue(mockImpact());

      const response = await request(app)
        .post('/api/regulatory-changes/rc-123/impacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', impactLevel: 'High', requiredAction: 'Update controls' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(mockImpact());

      const response = await request(app)
        .post('/api/regulatory-changes/rc-123/impacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123' });

      expect(response.status).toBe(400);
    });

    it('should validate impactLevel enum', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(mockImpact());

      const response = await request(app)
        .post('/api/regulatory-changes/rc-123/impacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', impactLevel: 'INVALID', requiredAction: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/regulatory-changes/:id/impacts/:impactId', () => {
    it('should update an impact', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(mockImpact());
      prismaMock.regulatoryChangeImpact.update.mockResolvedValue(mockImpact({ status: 'IN_PROGRESS' }));

      const response = await request(app)
        .patch('/api/regulatory-changes/rc-123/impacts/imp-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
    });

    it('should return 404 if impact not found', async () => {
      prismaMock.regulatoryChangeImpact.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/regulatory-changes/rc-123/impacts/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(404);
    });
  });
});
