/**
 * Control Mappings Routes — Contract Tests
 * 5 endpoints: create, get by controlId, update, delete, export CSV
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/database', () => ({ __esModule: true, default: {} }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) return next();
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) return res.status(401).json({ error: 'Authentication required' });
    const userRole = (req as any).user.role?.toLowerCase();
    const allowed = _roles.map((r: string) => r.toLowerCase());
    if (!allowed.includes(userRole)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  },
  AuthRequest: {},
}));

const mockController = {
  createMapping: jest.fn<any>(),
  // The route binds listAllMappings for GET '/'; it must exist on the mock or
  // the route's `.bind(controller)` call throws at import time (suite fails to run).
  listAllMappings: jest.fn<any>(),
  getMappings: jest.fn<any>(),
  updateMapping: jest.fn<any>(),
  deleteMapping: jest.fn<any>(),
  exportMappings: jest.fn<any>(),
};

// jest config uses resetMocks, which strips implementations before each test.
// Re-apply the handlers in beforeEach so requests reach a responding handler.
const applyControllerMocks = (): void => {
  mockController.createMapping.mockImplementation((_req: any, res: any) => res.status(201).json({ id: 'cm-1' }));
  mockController.listAllMappings.mockImplementation((_req: any, res: any) => res.json([]));
  mockController.getMappings.mockImplementation((_req: any, res: any) => res.json([]));
  mockController.updateMapping.mockImplementation((_req: any, res: any) => res.json({ id: 'cm-1', updated: true }));
  mockController.deleteMapping.mockImplementation((_req: any, res: any) => res.json({ success: true }));
  mockController.exportMappings.mockImplementation((_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/csv');
    res.send('id,control,framework\n');
  });
};

jest.mock('../../../controllers/controlMappingsController', () => ({
  __esModule: true,
  default: mockController,
}));

import controlMappingsRoutes from '../../../routes/controlMappings';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], 'test-secret'); } catch { /* no-op */ }
  }
  next();
});
app.use('/api/control-mappings', controlMappingsRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('Control Mappings Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => {
    jest.clearAllMocks();
    applyControllerMocks();
  });

  // ── Create Mapping ───────────────────────────────────────────────

  describe('POST /api/control-mappings/', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/control-mappings/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceControlId: 'ctrl-1', targetControlId: 'iso-a-5-1', mappingType: 'equivalent' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/control-mappings/')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ controlId: 'ctrl-1' });
      expect(res.status).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/control-mappings/').send({ controlId: 'ctrl-1' });
      expect(res.status).toBe(401);
    });
  });

  // ── Get Mappings by Control ──────────────────────────────────────

  describe('GET /api/control-mappings/control/:controlId', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .get('/api/control-mappings/control/ctrl-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/control-mappings/control/ctrl-1');
      expect(res.status).toBe(401);
    });
  });

  // ── Update Mapping ───────────────────────────────────────────────

  describe('PATCH /api/control-mappings/:mappingId', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/control-mappings/cm-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Mapped' });
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .patch('/api/control-mappings/cm-1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'Mapped' });
      expect(res.status).toBe(403);
    });
  });

  // ── Delete Mapping ───────────────────────────────────────────────

  describe('DELETE /api/control-mappings/:mappingId', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .delete('/api/control-mappings/cm-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .delete('/api/control-mappings/cm-1')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Export CSV ───────────────────────────────────────────────────

  describe('GET /api/control-mappings/export/csv', () => {
    it('returns 200 with CSV content', async () => {
      const res = await request(app)
        .get('/api/control-mappings/export/csv')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/control-mappings/export/csv');
      expect(res.status).toBe(401);
    });
  });
});
