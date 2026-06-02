/**
 * Search Routes — Contract Tests
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
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    const userRole = (req as any).user.role?.toLowerCase();
    if (roles.length > 0 && !roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

import searchRoutes from '../../../routes/search';
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
app.use('/api/search', searchRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Search API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => {
    jest.clearAllMocks();
    // The global jest config uses resetMocks, which wipes the shared mock's $transaction
    // implementation before each test. Re-establish the interactive-transaction behaviour so
    // the route's prisma.$transaction(async (tx) => …) callback actually executes against the mock.
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      async (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock),
    );
    // searchIndex.upsert is exercised by /index and /recent but is not predefined on the shared
    // mock; attach a fresh mock fn each test so the indexing writes are actually intercepted.
    (prismaMock.searchIndex as Record<string, unknown>).upsert = jest.fn();
  });

  // GET / (full-text search)
  describe('GET /api/search/', () => {
    it('should search and return results', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        { id: 's-1', resourceType: 'risk', resourceid: 'r-1', title: 'Test Risk', excerpt: 'desc', metadata: {}, updatedat: new Date(), rank: 0.5 },
      ]);

      const res = await request(app).get('/api/search/?q=risk').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('results');
      expect(res.body.data).toHaveProperty('query', 'risk');
    });

    it('should return an empty, org-scoped result set when q is missing', async () => {
      // The handler treats a missing/blank `q` as "nothing to search": it short-circuits
      // to an empty result set rather than running a tsquery. (If the primary full-text
      // path is unavailable it falls back to an ILIKE scan, which here yields nothing.)
      // Seed both paths so the response is deterministic regardless of suite ordering.
      prismaMock.$queryRaw.mockResolvedValue([]);
      prismaMock.searchIndex.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/search/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.results).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/search/?q=test');
      expect(res.status).toBe(401);
    });
  });

  // POST /index (admin only)
  describe('POST /api/search/index', () => {
    it('should re-index every indexable resource and report the count', async () => {
      // The route indexes the real schema models: RiskItem, FrameworkControl, EvidenceAnalysis,
      // Vendor and Policy (there are no `risk`/`control`/`evidence` models). Seed one record per
      // model so the indexing loops execute and we can assert each source was queried + upserted.
      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'r-1', title: 'SQL Injection Risk', description: 'desc', category: 'Security', status: 'Open', severity: 'High' },
      ]);
      prismaMock.frameworkControl.findMany.mockResolvedValue([
        { id: 'c-1', name: 'CC6.1', description: 'Access control', status: 'Implemented', frameworkId: 'fw-1' },
      ]);
      prismaMock.evidenceAnalysis.findMany.mockResolvedValue([
        { id: 'e-1', evidenceId: 'ev-1', verificationStatus: 'Verified', overallConfidence: 0.9 },
      ]);
      prismaMock.vendor.findMany.mockResolvedValue([
        { id: 'v-1', name: 'Acme Cloud', serviceDescription: 'Hosting', riskLevel: 'Medium', status: 'Active' },
      ]);
      prismaMock.policy.findMany.mockResolvedValue([
        { id: 'p-1', title: 'InfoSec Policy', content: 'body', status: 'Approved', framework: 'SOC 2' },
      ]);

      const res = await request(app).post('/api/search/index').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // 5 seeded records across 5 models → 5 upserts into the search index.
      expect(res.body.data).toHaveProperty('indexedCount', 5);
      expect(res.body.data).toHaveProperty('elapsedMs');

      // Each source model must be queried scoped to the caller's organization.
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-123' }) }),
      );
      expect(prismaMock.evidenceAnalysis.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-123' }) }),
      );
      // The legacy (non-existent) model names must never be referenced.
      expect((prismaMock as Record<string, any>).risk).toBeUndefined();
      expect((prismaMock as Record<string, any>).control).toBeUndefined();
      expect((prismaMock as Record<string, any>).evidence).toBeUndefined();

      // Indexing wrote deterministic composite ids back to the search index.
      const upsert = (prismaMock.searchIndex as Record<string, any>).upsert as jest.Mock;
      expect(upsert).toHaveBeenCalledTimes(5);
      const upsertedIds = upsert.mock.calls.map((c) => (c[0] as any).where.id);
      expect(upsertedIds).toEqual(
        expect.arrayContaining(['risk-r-1', 'control-c-1', 'evidence-e-1', 'vendor-v-1', 'policy-p-1']),
      );
    });

    it('should return 403 for non-admin', async () => {
      const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');
      const res = await request(app).post('/api/search/index').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
      // Authorization is enforced before any indexing query runs.
      expect(prismaMock.riskItem.findMany).not.toHaveBeenCalled();
    });
  });

  // GET /recent
  describe('GET /api/search/recent', () => {
    it('should return recent searches', async () => {
      prismaMock.searchIndex.findMany.mockResolvedValue([]);
      const res = await request(app).get('/api/search/recent').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('searches');
    });
  });

  // POST /recent
  describe('POST /api/search/recent', () => {
    it('should save a search query', async () => {
      prismaMock.searchIndex.upsert.mockResolvedValue({ id: 'r-1' });
      prismaMock.searchIndex.findMany.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/search/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'test search' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('message');
    });

    it('should return 400 when query missing', async () => {
      const res = await request(app)
        .post('/api/search/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
