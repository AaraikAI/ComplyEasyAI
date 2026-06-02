/**
 * Control Effectiveness Route Contract Tests
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

import controlEffectivenessRoutes from '../../../routes/controlEffectiveness';
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
app.use('/api/control-effectiveness', controlEffectivenessRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockRecord = (overrides: Record<string, any> = {}) => ({
  id: 'ce-123', organizationId: 'org-123', controlId: 'ctrl-123',
  rating: 'EFFECTIVE', testMethod: 'Manual review', findings: null,
  assessedBy: 'user-123', evidence: [], assessmentDate: new Date(),
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Control Effectiveness API', () => {
  const authToken = generateTestToken();

  describe('GET /api/control-effectiveness/trend', () => {
    it('should return effectiveness trend over time', async () => {
      prismaMock.controlEffectivenessRecord.findMany.mockResolvedValue([
        mockRecord({ rating: 'EFFECTIVE', assessmentDate: new Date() }),
      ]);

      const response = await request(app)
        .get('/api/control-effectiveness/trend')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('trend');
      expect(response.body.data).toHaveProperty('months');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/control-effectiveness/trend');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/control-effectiveness/degrading', () => {
    it('should return degrading controls', async () => {
      prismaMock.controlEffectivenessRecord.findMany.mockResolvedValue([
        mockRecord({ controlId: 'ctrl-1', rating: 'INEFFECTIVE', assessmentDate: new Date() }),
        mockRecord({ controlId: 'ctrl-1', rating: 'EFFECTIVE', assessmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }),
      ]);

      const response = await request(app)
        .get('/api/control-effectiveness/degrading')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('degrading');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/control-effectiveness/stats', () => {
    it('should return effectiveness statistics', async () => {
      prismaMock.controlEffectivenessRecord.findMany.mockResolvedValue([
        mockRecord({ controlId: 'ctrl-1', rating: 'EFFECTIVE' }),
      ]);

      const response = await request(app)
        .get('/api/control-effectiveness/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalControlsAssessed');
      expect(response.body.data).toHaveProperty('counts');
      expect(response.body.data).toHaveProperty('overallEffectivenessScore');
    });
  });

  describe('GET /api/control-effectiveness/control/:controlId', () => {
    it('should return effectiveness history for a control', async () => {
      prismaMock.controlEffectivenessRecord.findMany.mockResolvedValue([mockRecord()]);
      prismaMock.controlEffectivenessRecord.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/control-effectiveness/control/ctrl-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('controlId');
      expect(response.body.data).toHaveProperty('records');
      expect(response.body.data).toHaveProperty('trend');
    });
  });

  describe('GET /api/control-effectiveness', () => {
    it('should return paginated effectiveness records', async () => {
      prismaMock.controlEffectivenessRecord.findMany.mockResolvedValue([mockRecord()]);
      prismaMock.controlEffectivenessRecord.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/control-effectiveness')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('records');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('POST /api/control-effectiveness', () => {
    it('should create an effectiveness assessment', async () => {
      // The record is a child of a FrameworkControl; the route first verifies
      // the parent control belongs to the caller's org (org-scoped through its
      // framework) before stamping the assessment.
      prismaMock.frameworkControl.findFirst.mockResolvedValue({ id: 'ctrl-123' } as any);
      prismaMock.controlEffectivenessRecord.create.mockResolvedValue(mockRecord());

      const response = await request(app)
        .post('/api/control-effectiveness')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', rating: 'EFFECTIVE', testMethod: 'Manual review' });

      expect(response.status).toBe(201);
      // Parent-control ownership must be AND-scoped: the control id AND the
      // caller's organizationId (via framework relation).
      expect(prismaMock.frameworkControl.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'ctrl-123',
            framework: expect.objectContaining({ organizationId: 'org-123' }),
          }),
        }),
      );
    });

    it('should 404 when the parent control belongs to another org', async () => {
      // Parent-control lookup resolves to null because the control is not in the
      // caller's org → the route must reject with 404 and never create the record.
      prismaMock.frameworkControl.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/control-effectiveness')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-foreign', rating: 'EFFECTIVE', testMethod: 'Manual review' });

      expect(response.status).toBe(404);
      expect(prismaMock.controlEffectivenessRecord.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/control-effectiveness')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123' });

      expect(response.status).toBe(400);
    });

    it('should validate rating enum', async () => {
      const response = await request(app)
        .post('/api/control-effectiveness')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', rating: 'INVALID', testMethod: 'Manual' });

      expect(response.status).toBe(400);
    });
  });
});
