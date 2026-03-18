/**
 * Auditor Routes — Contract Tests
 * 26 endpoints: dashboard, match, profiles CRUD, engagements CRUD,
 * findings CRUD, workpapers CRUD, requests CRUD
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

const mockAuditorService = {
  getDashboardStats: jest.fn<any>().mockResolvedValue({ engagements: 5, findings: 10 }),
  matchAuditors: jest.fn<any>().mockResolvedValue([{ id: 'auditor-1', score: 95 }]),
  listAuditorProfiles: jest.fn<any>().mockResolvedValue([]),
  createAuditorProfile: jest.fn<any>().mockResolvedValue({ id: 'ap-1' }),
  getAuditorProfile: jest.fn<any>().mockResolvedValue({ id: 'ap-1' }),
  updateAuditorProfile: jest.fn<any>().mockResolvedValue({ id: 'ap-1', updated: true }),
  deleteAuditorProfile: jest.fn<any>().mockResolvedValue(undefined),
  listEngagements: jest.fn<any>().mockResolvedValue([]),
  createEngagement: jest.fn<any>().mockResolvedValue({ id: 'eng-1' }),
  getEngagement: jest.fn<any>().mockResolvedValue({ id: 'eng-1' }),
  updateEngagement: jest.fn<any>().mockResolvedValue({ id: 'eng-1', updated: true }),
  deleteEngagement: jest.fn<any>().mockResolvedValue(undefined),
  listFindings: jest.fn<any>().mockResolvedValue([]),
  createFinding: jest.fn<any>().mockResolvedValue({ id: 'find-1' }),
  getFinding: jest.fn<any>().mockResolvedValue({ id: 'find-1' }),
  updateFinding: jest.fn<any>().mockResolvedValue({ id: 'find-1', updated: true }),
  deleteFinding: jest.fn<any>().mockResolvedValue(undefined),
  listWorkpapers: jest.fn<any>().mockResolvedValue([]),
  createWorkpaper: jest.fn<any>().mockResolvedValue({ id: 'wp-1' }),
  getWorkpaper: jest.fn<any>().mockResolvedValue({ id: 'wp-1' }),
  updateWorkpaper: jest.fn<any>().mockResolvedValue({ id: 'wp-1', updated: true }),
  deleteWorkpaper: jest.fn<any>().mockResolvedValue(undefined),
  listRequests: jest.fn<any>().mockResolvedValue([]),
  createRequest: jest.fn<any>().mockResolvedValue({ id: 'req-1' }),
  getRequest: jest.fn<any>().mockResolvedValue({ id: 'req-1' }),
  updateRequest: jest.fn<any>().mockResolvedValue({ id: 'req-1', updated: true }),
  deleteRequest: jest.fn<any>().mockResolvedValue(undefined),
};

jest.mock('../../../services/auditorService', () => ({ __esModule: true, default: mockAuditorService }));

import auditorRoutes from '../../../routes/auditor';
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
app.use('/api/auditor', auditorRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('Auditor Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // Helper for standard CRUD patterns
  const testCRUD = (resource: string, serviceFns: { list: string; create: string; get: string; update: string; delete: string }) => {
    describe(`${resource} CRUD`, () => {
      it(`GET /api/auditor/${resource} returns 200`, async () => {
        const res = await request(app).get(`/api/auditor/${resource}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      });

      it(`POST /api/auditor/${resource} returns 201`, async () => {
        const res = await request(app)
          .post(`/api/auditor/${resource}`)
          .set('Authorization', `Bearer ${editorToken}`)
          .send({ name: 'Test' });
        expect(res.status).toBe(201);
      });

      it(`POST /api/auditor/${resource} returns 403 for viewer`, async () => {
        const res = await request(app)
          .post(`/api/auditor/${resource}`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({ name: 'Test' });
        expect(res.status).toBe(403);
      });

      it(`GET /api/auditor/${resource}/test-id returns 200`, async () => {
        const res = await request(app)
          .get(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      });

      it(`PATCH /api/auditor/${resource}/test-id returns 200`, async () => {
        const res = await request(app)
          .patch(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${editorToken}`)
          .send({ name: 'Updated' });
        expect(res.status).toBe(200);
      });

      it(`PATCH /api/auditor/${resource}/test-id returns 403 for viewer`, async () => {
        const res = await request(app)
          .patch(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({ name: 'Updated' });
        expect(res.status).toBe(403);
      });

      it(`DELETE /api/auditor/${resource}/test-id returns 200 for admin`, async () => {
        const res = await request(app)
          .delete(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      });

      it(`DELETE /api/auditor/${resource}/test-id returns 403 for editor`, async () => {
        const res = await request(app)
          .delete(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${editorToken}`);
        expect(res.status).toBe(403);
      });
    });
  };

  // ── Dashboard ────────────────────────────────────────────────────

  describe('GET /api/auditor/dashboard', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/auditor/dashboard').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(mockAuditorService.getDashboardStats).toHaveBeenCalledWith('org-1');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/auditor/dashboard');
      expect(res.status).toBe(401);
    });
  });

  // ── Match ────────────────────────────────────────────────────────

  describe('POST /api/auditor/match', () => {
    it('returns 200 with matches', async () => {
      const res = await request(app)
        .post('/api/auditor/match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ frameworks: ['SOC2'], industry: 'Tech' });
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/auditor/match').send({});
      expect(res.status).toBe(401);
    });
  });

  // ── CRUD Resources ──────────────────────────────────────────────

  testCRUD('profiles', {
    list: 'listAuditorProfiles',
    create: 'createAuditorProfile',
    get: 'getAuditorProfile',
    update: 'updateAuditorProfile',
    delete: 'deleteAuditorProfile',
  });

  testCRUD('engagements', {
    list: 'listEngagements',
    create: 'createEngagement',
    get: 'getEngagement',
    update: 'updateEngagement',
    delete: 'deleteEngagement',
  });

  testCRUD('findings', {
    list: 'listFindings',
    create: 'createFinding',
    get: 'getFinding',
    update: 'updateFinding',
    delete: 'deleteFinding',
  });

  testCRUD('workpapers', {
    list: 'listWorkpapers',
    create: 'createWorkpaper',
    get: 'getWorkpaper',
    update: 'updateWorkpaper',
    delete: 'deleteWorkpaper',
  });

  testCRUD('requests', {
    list: 'listRequests',
    create: 'createRequest',
    get: 'getRequest',
    update: 'updateRequest',
    delete: 'deleteRequest',
  });
});
