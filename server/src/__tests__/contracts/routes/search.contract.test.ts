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
  beforeEach(() => { jest.clearAllMocks(); });

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

    it('should return 400 when q parameter is missing', async () => {
      const res = await request(app).get('/api/search/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/search/?q=test');
      expect(res.status).toBe(401);
    });
  });

  // POST /index (admin only)
  describe('POST /api/search/index', () => {
    it('should trigger re-indexing', async () => {
      prismaMock.risk.findMany.mockResolvedValue([]);
      prismaMock.control.findMany.mockResolvedValue([]);
      prismaMock.evidence.findMany.mockResolvedValue([]);
      prismaMock.vendor.findMany.mockResolvedValue([]);
      prismaMock.policy.findMany.mockResolvedValue([]);

      const res = await request(app).post('/api/search/index').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('indexedCount');
      expect(res.body.data).toHaveProperty('elapsedMs');
    });

    it('should return 403 for non-admin', async () => {
      const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');
      const res = await request(app).post('/api/search/index').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
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
