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

  // Helper for standard CRUD patterns. The service-method names are threaded
  // through so each test can assert the route forwards the caller's
  // organizationId as the first argument — this is what makes the "contract"
  // multi-tenant-aware: a route that dropped org scoping would fail here.
  // `createBody`/`updateBody` carry each resource's schema-valid payload (the
  // route's validateBody(...) rejects anything else with 400), so the tests
  // actually reach the service layer rather than stopping at validation.
  const testCRUD = (
    resource: string,
    serviceFns: { list: string; create: string; get: string; update: string; delete: string },
    createBody: Record<string, unknown>,
    updateBody: Record<string, unknown>,
  ) => {
    const svc = mockAuditorService as Record<string, ReturnType<typeof jest.fn>>;
    describe(`${resource} CRUD`, () => {
      it(`GET /api/auditor/${resource} returns 200`, async () => {
        const res = await request(app).get(`/api/auditor/${resource}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        // List must be scoped to the caller's organization.
        expect(svc[serviceFns.list]).toHaveBeenCalledWith('org-1', expect.anything());
      });

      it(`POST /api/auditor/${resource} returns 201`, async () => {
        const res = await request(app)
          .post(`/api/auditor/${resource}`)
          .set('Authorization', `Bearer ${editorToken}`)
          .send(createBody);
        expect(res.status).toBe(201);
        // Create must persist under the caller's organization (first arg) and
        // forward the validated body (objectContaining tolerates route-injected
        // fields like createdBy/uploadedBy/requestedBy).
        expect(svc[serviceFns.create]).toHaveBeenCalledWith('org-1', expect.objectContaining(createBody));
      });

      it(`POST /api/auditor/${resource} returns 400 for an invalid body`, async () => {
        // `name` is not an allowed field on the title-based schemas / required
        // fields are missing — validateBody must reject before the service runs.
        const res = await request(app)
          .post(`/api/auditor/${resource}`)
          .set('Authorization', `Bearer ${editorToken}`)
          .send({ unexpectedField: 'x' });
        expect(res.status).toBe(400);
        expect(svc[serviceFns.create]).not.toHaveBeenCalled();
      });

      it(`POST /api/auditor/${resource} returns 403 for viewer`, async () => {
        const res = await request(app)
          .post(`/api/auditor/${resource}`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send(createBody);
        expect(res.status).toBe(403);
        // RBAC is enforced before the service layer.
        expect(svc[serviceFns.create]).not.toHaveBeenCalled();
      });

      it(`GET /api/auditor/${resource}/test-id returns 200`, async () => {
        const res = await request(app)
          .get(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        // Single-resource read must be scoped by org AND id.
        expect(svc[serviceFns.get]).toHaveBeenCalledWith('org-1', 'test-id');
      });

      it(`PATCH /api/auditor/${resource}/test-id returns 200`, async () => {
        const res = await request(app)
          .patch(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${editorToken}`)
          .send(updateBody);
        expect(res.status).toBe(200);
        // Update must be scoped by org AND id and forward the validated body.
        expect(svc[serviceFns.update]).toHaveBeenCalledWith('org-1', 'test-id', expect.objectContaining(updateBody));
      });

      it(`PATCH /api/auditor/${resource}/test-id returns 403 for viewer`, async () => {
        const res = await request(app)
          .patch(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send(updateBody);
        expect(res.status).toBe(403);
        expect(svc[serviceFns.update]).not.toHaveBeenCalled();
      });

      it(`DELETE /api/auditor/${resource}/test-id returns 200 for admin`, async () => {
        const res = await request(app)
          .delete(`/api/auditor/${resource}/test-id`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        // Delete must be scoped by org AND id.
        expect(svc[serviceFns.delete]).toHaveBeenCalledWith('org-1', 'test-id');
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
      // matchAuditorsSchema is .unknown(false): it accepts framework (singular),
      // specializations, certifications, minExperience and limit — not the
      // legacy frameworks[]/industry shape.
      const res = await request(app)
        .post('/api/auditor/match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ framework: 'SOC 2', specializations: ['SaaS'], minExperience: 5 });
      expect(res.status).toBe(200);
      // The matcher must run scoped to the caller's organization with the body.
      expect(mockAuditorService.matchAuditors).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ framework: 'SOC 2', minExperience: 5 }),
      );
    });

    it('returns 400 for an unknown field in the match body', async () => {
      const res = await request(app)
        .post('/api/auditor/match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ frameworks: ['SOC2'], industry: 'Tech' });
      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/auditor/match').send({});
      expect(res.status).toBe(401);
    });
  });

  // ── CRUD Resources ──────────────────────────────────────────────

  // Profiles use the `name`-keyed schema; the other four resources use a
  // `title`-keyed schema (`name` is an unknown field there and is rejected).
  testCRUD('profiles', {
    list: 'listAuditorProfiles',
    create: 'createAuditorProfile',
    get: 'getAuditorProfile',
    update: 'updateAuditorProfile',
    delete: 'deleteAuditorProfile',
  }, { name: 'Jane Auditor' }, { name: 'Jane Updated' });

  testCRUD('engagements', {
    list: 'listEngagements',
    create: 'createEngagement',
    get: 'getEngagement',
    update: 'updateEngagement',
    delete: 'deleteEngagement',
  }, { title: 'SOC 2 Engagement' }, { title: 'SOC 2 Engagement (rev)' });

  testCRUD('findings', {
    list: 'listFindings',
    create: 'createFinding',
    get: 'getFinding',
    update: 'updateFinding',
    delete: 'deleteFinding',
  }, { title: 'Access review gap', severity: 'High' }, { title: 'Access review gap (rev)' });

  testCRUD('workpapers', {
    list: 'listWorkpapers',
    create: 'createWorkpaper',
    get: 'getWorkpaper',
    update: 'updateWorkpaper',
    delete: 'deleteWorkpaper',
  }, { title: 'Control matrix WP' }, { title: 'Control matrix WP (rev)' });

  testCRUD('requests', {
    list: 'listRequests',
    create: 'createRequest',
    get: 'getRequest',
    update: 'updateRequest',
    delete: 'deleteRequest',
  }, { title: 'Provide firewall config' }, { title: 'Provide firewall config (rev)' });
});
