/**
 * Calendar Route Contract Tests
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

import calendarRoutes from '../../../routes/calendar';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      (req as any).user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'test-secret');
    } catch { res.status(401).json({ error: 'Invalid token' }); return; }
  }
  next();
});
app.use('/api/calendar', calendarRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockDeadline = (overrides: Record<string, any> = {}) => ({
  id: 'dl-123', organizationId: 'org-123', title: 'SOC 2 Audit',
  description: 'Annual audit', type: 'AUDIT_DATE',
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  status: 'UPCOMING', frameworkId: null, controlId: null,
  assignedTo: null, reminderDays: [30, 14, 7, 1], recurrence: null,
  completedAt: null, createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Calendar API', () => {
  const authToken = generateTestToken();

  describe('GET /api/calendar/upcoming', () => {
    it('should return upcoming deadlines', async () => {
      prismaMock.complianceDeadline.findMany.mockResolvedValue([mockDeadline()]);

      const response = await request(app)
        .get('/api/calendar/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('withinDays');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/calendar/upcoming');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/calendar/overdue', () => {
    it('should return overdue deadlines', async () => {
      prismaMock.complianceDeadline.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/calendar/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/calendar/deadlines', () => {
    it('should return paginated deadlines', async () => {
      prismaMock.complianceDeadline.findMany.mockResolvedValue([mockDeadline()]);
      prismaMock.complianceDeadline.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/calendar/deadlines')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toHaveProperty('total');
    });
  });

  describe('GET /api/calendar/deadlines/:id', () => {
    it('should return a specific deadline', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(mockDeadline());

      const response = await request(app)
        .get('/api/calendar/deadlines/dl-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('dl-123');
    });

    it('should return 404 for non-existent deadline', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/calendar/deadlines/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/calendar/deadlines', () => {
    it('should create a deadline', async () => {
      prismaMock.complianceDeadline.create.mockResolvedValue(mockDeadline());

      const response = await request(app)
        .post('/api/calendar/deadlines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'SOC 2 Audit', type: 'AUDIT_DATE', dueDate: '2027-06-01' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/calendar/deadlines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only title' });

      expect(response.status).toBe(400);
    });

    it('should validate type enum', async () => {
      const response = await request(app)
        .post('/api/calendar/deadlines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test', type: 'INVALID', dueDate: '2027-06-01' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/calendar/deadlines/:id', () => {
    it('should update a deadline', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(mockDeadline());
      prismaMock.complianceDeadline.update.mockResolvedValue(mockDeadline({ title: 'Updated' }));

      const response = await request(app)
        .patch('/api/calendar/deadlines/dl-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent deadline', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/calendar/deadlines/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/calendar/deadlines/:id/complete', () => {
    it('should mark a deadline as completed', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(mockDeadline({ status: 'UPCOMING' }));
      prismaMock.complianceDeadline.update.mockResolvedValue(mockDeadline({ status: 'COMPLETED' }));

      const response = await request(app)
        .patch('/api/calendar/deadlines/dl-123/complete')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 400 if already completed', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(mockDeadline({ status: 'COMPLETED' }));

      const response = await request(app)
        .patch('/api/calendar/deadlines/dl-123/complete')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/calendar/deadlines/:id', () => {
    it('should cancel a deadline', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(mockDeadline());
      prismaMock.complianceDeadline.update.mockResolvedValue(mockDeadline({ status: 'CANCELLED' }));

      const response = await request(app)
        .delete('/api/calendar/deadlines/dl-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent deadline', async () => {
      prismaMock.complianceDeadline.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/calendar/deadlines/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
