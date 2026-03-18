/**
 * Notification Routes — Contract Tests
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

import notificationRoutes from '../../../routes/notifications';
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
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Notifications API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET /unread-count
  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      prismaMock.notification.count.mockResolvedValue(5);
      const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('unreadCount', 5);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/notifications/unread-count');
      expect(res.status).toBe(401);
    });
  });

  // GET /preferences
  describe('GET /api/notifications/preferences', () => {
    it('should return default preferences when none exist', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/notifications/preferences').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('isDefault', true);
    });

    it('should return stored preferences', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-123', email: true, slack: false, websocket: true, sms: false, categories: {},
      });
      const res = await request(app).get('/api/notifications/preferences').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('email', true);
    });
  });

  // PATCH /preferences
  describe('PATCH /api/notifications/preferences', () => {
    it('should upsert preferences', async () => {
      prismaMock.notificationPreference.upsert.mockResolvedValue({
        userId: 'user-123', email: false, slack: true, websocket: true, sms: false, categories: {},
      });
      const res = await request(app)
        .patch('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: false });
      expect(res.status).toBe(200);
      expect(prismaMock.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  // POST /mark-all-read
  describe('POST /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });
      const res = await request(app).post('/api/notifications/mark-all-read').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('markedRead', 3);
    });
  });

  // GET /
  describe('GET /api/notifications/', () => {
    it('should list notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);
      prismaMock.notification.count.mockResolvedValue(0);
      const res = await request(app).get('/api/notifications/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });
  });

  // PATCH /:id/read
  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark single notification as read', async () => {
      prismaMock.notification.findFirst.mockResolvedValue({ id: 'n-1', organizationId: 'org-123', userId: 'user-123' });
      prismaMock.notification.update.mockResolvedValue({ id: 'n-1', readAt: new Date(), status: 'read' });
      const res = await request(app).patch('/api/notifications/n-1/read').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 if not found', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);
      const res = await request(app).patch('/api/notifications/n-bad/read').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // DELETE /:id
  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      prismaMock.notification.findFirst.mockResolvedValue({ id: 'n-1', organizationId: 'org-123', userId: 'user-123' });
      prismaMock.notification.delete.mockResolvedValue({ id: 'n-1' });
      const res = await request(app).delete('/api/notifications/n-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('deleted', true);
    });

    it('should return 404 if not found', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);
      const res = await request(app).delete('/api/notifications/n-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });
});
