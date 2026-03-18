/**
 * Evidence Versions Routes — Contract Tests
 * 5 endpoints: list versions, get version, create version, restore version, delete version
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
  getVersions: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json([])),
  getVersion: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ id: 'v-1', version: 1 })),
  createVersion: jest.fn<any>().mockImplementation((_req: any, res: any) => res.status(201).json({ id: 'v-new' })),
  restoreVersion: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ restored: true })),
  deleteVersion: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ success: true })),
};

jest.mock('../../../controllers/evidenceVersioningController', () => ({
  __esModule: true,
  default: mockController,
}));

import evidenceVersionsRoutes from '../../../routes/evidenceVersions';
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
app.use('/api/evidence-versions', evidenceVersionsRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('Evidence Versions Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // ── List Versions ────────────────────────────────────────────────

  describe('GET /api/evidence-versions/control/:controlId', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .get('/api/evidence-versions/control/ctrl-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/evidence-versions/control/ctrl-1');
      expect(res.status).toBe(401);
    });
  });

  // ── Get Version ──────────────────────────────────────────────────

  describe('GET /api/evidence-versions/control/:controlId/:versionId', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .get('/api/evidence-versions/control/ctrl-1/v-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ── Create Version ───────────────────────────────────────────────

  describe('POST /api/evidence-versions/control/:controlId', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/evidence-versions/control/ctrl-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ content: 'Evidence data', fileName: 'evidence.pdf' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/evidence-versions/control/ctrl-1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ content: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  // ── Restore Version ──────────────────────────────────────────────

  describe('POST /api/evidence-versions/control/:controlId/restore/:versionId', () => {
    it('returns 200 on restore', async () => {
      const res = await request(app)
        .post('/api/evidence-versions/control/ctrl-1/restore/v-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.restored).toBe(true);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/evidence-versions/control/ctrl-1/restore/v-1')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Delete Version ───────────────────────────────────────────────

  describe('DELETE /api/evidence-versions/control/:controlId/:versionId', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .delete('/api/evidence-versions/control/ctrl-1/v-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .delete('/api/evidence-versions/control/ctrl-1/v-1')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
