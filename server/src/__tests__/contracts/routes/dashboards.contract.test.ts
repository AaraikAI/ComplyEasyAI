/**
 * Custom Dashboard Routes — Contract Tests
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

import dashboardRoutes from '../../../routes/dashboards';
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
app.use('/api/dashboards', dashboardRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Dashboards API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET /templates
  describe('GET /api/dashboards/templates', () => {
    it('should return dashboard templates', async () => {
      const res = await request(app).get('/api/dashboards/templates').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // GET /
  describe('GET /api/dashboards/', () => {
    it('should list dashboards', async () => {
      prismaMock.customDashboard.findMany.mockResolvedValue([]);
      prismaMock.customDashboard.count.mockResolvedValue(0);
      prismaMock.user.findMany.mockResolvedValue([]);
      const res = await request(app).get('/api/dashboards/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('meta');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/dashboards/');
      expect(res.status).toBe(401);
    });
  });

  // GET /:id
  describe('GET /api/dashboards/:id', () => {
    it('should return dashboard with widgets', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({
        id: 'd-1', organizationId: 'org-123', createdBy: 'user-123', name: 'My Dash',
        isShared: false, widgets: [], layout: {}, createdAt: new Date(), updatedAt: new Date(),
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-123', name: 'Test', email: 'test@example.com' });

      const res = await request(app).get('/api/dashboards/d-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', 'd-1');
      expect(res.body.data).toHaveProperty('isOwner');
    });

    it('should return 404 if not found', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/dashboards/d-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // POST /
  describe('POST /api/dashboards/', () => {
    it('should create a dashboard', async () => {
      prismaMock.customDashboard.count.mockResolvedValue(0);
      prismaMock.customDashboard.create.mockResolvedValue({
        id: 'd-1', organizationId: 'org-123', createdBy: 'user-123', name: 'New Dash',
      });

      const res = await request(app)
        .post('/api/dashboards/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Dash' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'New Dash');
    });

    it('should return 400 when name missing', async () => {
      const res = await request(app)
        .post('/api/dashboards/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // PATCH /:id
  describe('PATCH /api/dashboards/:id', () => {
    it('should update a dashboard (owner)', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({ id: 'd-1', organizationId: 'org-123', createdBy: 'user-123' });
      prismaMock.customDashboard.update.mockResolvedValue({ id: 'd-1', name: 'Updated' });

      const res = await request(app)
        .patch('/api/dashboards/d-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('should return 404 if not found', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue(null);
      const res = await request(app).patch('/api/dashboards/d-bad').set('Authorization', `Bearer ${authToken}`).send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  // DELETE /:id
  describe('DELETE /api/dashboards/:id', () => {
    it('should delete a dashboard', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({ id: 'd-1', organizationId: 'org-123', createdBy: 'user-123' });
      prismaMock.customDashboard.delete.mockResolvedValue({ id: 'd-1' });

      const res = await request(app).delete('/api/dashboards/d-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('deleted', true);
    });
  });

  // POST /:id/widgets
  describe('POST /api/dashboards/:id/widgets', () => {
    it('should add a widget', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({ id: 'd-1', organizationId: 'org-123', createdBy: 'user-123', _count: { widgets: 0 } });
      prismaMock.dashboardWidget.create.mockResolvedValue({ id: 'w-1', dashboardId: 'd-1', type: 'TABLE', title: 'Widget' });

      const res = await request(app)
        .post('/api/dashboards/d-1/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'TABLE', title: 'Widget' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('type', 'TABLE');
    });

    it('should return 400 when type/title missing', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({ id: 'd-1', organizationId: 'org-123', createdBy: 'user-123', _count: { widgets: 0 } });

      const res = await request(app)
        .post('/api/dashboards/d-1/widgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'TABLE' });
      expect(res.status).toBe(400);
    });
  });

  // PATCH /:id/widgets/:widgetId
  describe('PATCH /api/dashboards/:id/widgets/:widgetId', () => {
    it('should update a widget', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({ id: 'd-1', organizationId: 'org-123', createdBy: 'user-123' });
      prismaMock.dashboardWidget.findFirst.mockResolvedValue({ id: 'w-1', dashboardId: 'd-1' });
      prismaMock.dashboardWidget.update.mockResolvedValue({ id: 'w-1', title: 'Renamed' });

      const res = await request(app)
        .patch('/api/dashboards/d-1/widgets/w-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Renamed' });
      expect(res.status).toBe(200);
    });
  });

  // DELETE /:id/widgets/:widgetId
  describe('DELETE /api/dashboards/:id/widgets/:widgetId', () => {
    it('should delete a widget', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({ id: 'd-1', organizationId: 'org-123', createdBy: 'user-123' });
      prismaMock.dashboardWidget.findFirst.mockResolvedValue({ id: 'w-1', dashboardId: 'd-1' });
      prismaMock.dashboardWidget.delete.mockResolvedValue({ id: 'w-1' });

      const res = await request(app).delete('/api/dashboards/d-1/widgets/w-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('deleted', true);
    });
  });

  // POST /:id/clone
  describe('POST /api/dashboards/:id/clone', () => {
    it('should clone a dashboard', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue({
        id: 'd-1', organizationId: 'org-123', createdBy: 'user-123', name: 'Orig',
        description: null, isShared: false, layout: {}, widgets: [],
      });
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
      prismaMock.customDashboard.create.mockResolvedValue({ id: 'd-2', name: 'Orig (Copy)' });
      prismaMock.customDashboard.findUnique.mockResolvedValue({ id: 'd-2', name: 'Orig (Copy)', widgets: [] });

      const res = await request(app)
        .post('/api/dashboards/d-1/clone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(201);
    });

    it('should return 404 if source not found', async () => {
      prismaMock.customDashboard.findFirst.mockResolvedValue(null);
      const res = await request(app).post('/api/dashboards/d-bad/clone').set('Authorization', `Bearer ${authToken}`).send({});
      expect(res.status).toBe(404);
    });
  });
});
