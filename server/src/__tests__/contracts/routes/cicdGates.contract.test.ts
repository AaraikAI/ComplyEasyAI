/**
 * CI/CD Gates Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

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

jest.mock('../../../utils/pick', () => ({
  pick: (obj: any, keys: string[]) => {
    const result: any = {};
    for (const key of keys) { if (obj[key] !== undefined) result[key] = obj[key]; }
    return result;
  },
}));

import cicdGatesRoutes from '../../../routes/cicdGates';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      (req as any).user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as Record<string, unknown>;
    } catch { /* noop */ }
  }
  next();
});
app.use('/api/cicd-gates', cicdGatesRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');

describe('CI/CD Gates API — Contract Tests', () => {
  const authToken = generateTestToken();

  beforeEach(() => { jest.clearAllMocks(); });

  // GET /policies
  describe('GET /api/cicd-gates/policies', () => {
    it('should list gate policies', async () => {
      prismaMock.cICDGatePolicy.findMany.mockResolvedValue([]);
      prismaMock.cICDGatePolicy.count.mockResolvedValue(0);

      const res = await request(app).get('/api/cicd-gates/policies').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('policies');
      expect(res.body.data).toHaveProperty('total');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/cicd-gates/policies');
      expect(res.status).toBe(401);
    });
  });

  // GET /policies/:id
  describe('GET /api/cicd-gates/policies/:id', () => {
    it('should return policy detail', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue({
        id: 'pol-1', organizationId: 'org-123', name: 'Deploy Policy',
        rules: {}, isActive: true, results: [], createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app).get('/api/cicd-gates/policies/pol-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', 'pol-1');
    });

    it('should return 404 if not found', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/cicd-gates/policies/pol-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // POST /policies (admin)
  describe('POST /api/cicd-gates/policies', () => {
    it('should create a gate policy (admin)', async () => {
      prismaMock.cICDGatePolicy.create.mockResolvedValue({
        id: 'pol-1', organizationId: 'org-123', name: 'New Policy', description: null,
        rules: {}, isActive: true, createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/cicd-gates/policies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Policy' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'New Policy');
    });

    it('should return 400 when name missing', async () => {
      const res = await request(app)
        .post('/api/cicd-gates/policies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/cicd-gates/policies')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Policy' });
      expect(res.status).toBe(403);
    });
  });

  // PATCH /policies/:id (admin)
  describe('PATCH /api/cicd-gates/policies/:id', () => {
    it('should update gate policy', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue({ id: 'pol-1', organizationId: 'org-123' });
      prismaMock.cICDGatePolicy.update.mockResolvedValue({ id: 'pol-1', name: 'Updated' });

      const res = await request(app)
        .patch('/api/cicd-gates/policies/pol-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
      expect(prismaMock.cICDGatePolicy.update).toHaveBeenCalled();
    });

    it('should return 404 if policy not found', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue(null);
      const res = await request(app)
        .patch('/api/cicd-gates/policies/pol-bad')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'X' });
      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .patch('/api/cicd-gates/policies/pol-1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'X' });
      expect(res.status).toBe(403);
    });
  });

  // DELETE /policies/:id (admin)
  describe('DELETE /api/cicd-gates/policies/:id', () => {
    it('should delete a gate policy', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue({ id: 'pol-1', organizationId: 'org-123' });
      prismaMock.cICDGatePolicy.delete.mockResolvedValue({ id: 'pol-1' });

      const res = await request(app)
        .delete('/api/cicd-gates/policies/pol-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('message');
    });

    it('should return 404 if not found', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue(null);
      const res = await request(app).delete('/api/cicd-gates/policies/pol-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app).delete('/api/cicd-gates/policies/pol-1').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // POST /check
  describe('POST /api/cicd-gates/check', () => {
    it('should check compliance against active policies', async () => {
      prismaMock.cICDGatePolicy.findMany.mockResolvedValue([
        { id: 'pol-1', name: 'Policy A', rules: {}, isActive: true, organizationId: 'org-123' },
      ]);
      prismaMock.cICDGateResult.create.mockResolvedValue({ id: 'res-1' });

      const res = await request(app)
        .post('/api/cicd-gates/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repository: 'repo', branch: 'main', commitHash: 'abc123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('overallStatus');
      expect(res.body.data).toHaveProperty('results');
    });

    it('should return 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/api/cicd-gates/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repository: 'repo' });
      expect(res.status).toBe(400);
    });
  });

  // POST /report
  describe('POST /api/cicd-gates/report', () => {
    it('should report pipeline result', async () => {
      prismaMock.cICDGatePolicy.findFirst.mockResolvedValue({ id: 'pol-1', organizationId: 'org-123' });
      prismaMock.cICDGateResult.create.mockResolvedValue({ id: 'res-1' });

      const res = await request(app)
        .post('/api/cicd-gates/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ policyId: 'pol-1', repository: 'repo', branch: 'main', commitHash: 'abc', status: 'PASSED' });

      expect(res.status).toBe(201);
      expect(prismaMock.cICDGateResult.create).toHaveBeenCalled();
    });

    it('should return 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/api/cicd-gates/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ policyId: 'pol-1' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .post('/api/cicd-gates/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ policyId: 'pol-1', repository: 'r', branch: 'b', commitHash: 'c', status: 'BAD' });
      expect(res.status).toBe(400);
    });
  });

  // GET /results
  describe('GET /api/cicd-gates/results', () => {
    it('should list gate results', async () => {
      prismaMock.cICDGateResult.findMany.mockResolvedValue([]);
      prismaMock.cICDGateResult.count.mockResolvedValue(0);

      const res = await request(app).get('/api/cicd-gates/results').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('results');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  // GET /results/:id
  describe('GET /api/cicd-gates/results/:id', () => {
    it('should return result detail', async () => {
      prismaMock.cICDGateResult.findFirst.mockResolvedValue({
        id: 'res-1', policyId: 'pol-1', repository: 'repo', branch: 'main',
        commitHash: 'abc', status: 'PASSED', details: {}, policy: { id: 'pol-1', name: 'P' },
      });

      const res = await request(app).get('/api/cicd-gates/results/res-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', 'res-1');
    });

    it('should return 404 if not found', async () => {
      prismaMock.cICDGateResult.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/cicd-gates/results/res-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });
});
