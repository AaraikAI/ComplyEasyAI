/**
 * BIA (Business Impact Analysis) Route Contract Tests
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

import biaRoutes from '../../../routes/bia';
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
app.use('/api/bia', biaRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockProcess = (overrides: Record<string, any> = {}) => ({
  id: 'bp-123', organizationId: 'org-123', name: 'Order Processing',
  description: 'Handles orders', owner: 'user-123', department: 'Operations',
  criticality: 'BUSINESS_CRITICAL', rto: 4, rpo: 2, mtpd: 24,
  impactAnalysis: null, assets: [], createdAt: new Date(), updatedAt: new Date(),
  dependencies: [],
  ...overrides,
});

describe('BIA API', () => {
  const authToken = generateTestToken();

  describe('GET /api/bia/stats', () => {
    it('should return BIA statistics', async () => {
      prismaMock.businessProcess.findMany.mockResolvedValue([
        mockProcess({ criticality: 'BUSINESS_CRITICAL', department: 'Operations', rto: 4, rpo: 2, mtpd: 24 }),
      ]);
      prismaMock.processDependency.count.mockResolvedValue(5);

      const response = await request(app)
        .get('/api/bia/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalProcesses');
      expect(response.body.data).toHaveProperty('byCriticality');
      expect(response.body.data).toHaveProperty('averageRtoHours');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/bia/stats');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bia/processes', () => {
    it('should return paginated processes', async () => {
      prismaMock.businessProcess.findMany.mockResolvedValue([mockProcess()]);
      prismaMock.businessProcess.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/bia/processes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toHaveProperty('total');
    });
  });

  describe('GET /api/bia/processes/:id', () => {
    it('should return a specific process with dependencies', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.processDependency.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/bia/processes/bp-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('dependents');
    });

    it('should return 404 for non-existent process', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bia/processes/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/bia/processes', () => {
    it('should create a business process', async () => {
      prismaMock.businessProcess.create.mockResolvedValue(mockProcess());

      const response = await request(app)
        .post('/api/bia/processes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Order Processing', owner: 'user-123', department: 'Operations' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bia/processes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Only name' });

      expect(response.status).toBe(400);
    });

    it('should validate criticality enum', async () => {
      const response = await request(app)
        .post('/api/bia/processes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', owner: 'user-123', department: 'IT', criticality: 'INVALID' });

      expect(response.status).toBe(400);
    });

    it('should validate rto is non-negative', async () => {
      const response = await request(app)
        .post('/api/bia/processes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', owner: 'user-123', department: 'IT', rto: -1 });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/bia/processes/:id', () => {
    it('should update a process', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.businessProcess.update.mockResolvedValue(mockProcess({ name: 'Updated' }));

      const response = await request(app)
        .patch('/api/bia/processes/bp-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent process', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/bia/processes/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/bia/processes/:id', () => {
    it('should delete a process without dependents', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.processDependency.count.mockResolvedValue(0);
      prismaMock.businessProcess.delete.mockResolvedValue(mockProcess());

      const response = await request(app)
        .delete('/api/bia/processes/bp-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 400 if process has dependents', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.processDependency.count.mockResolvedValue(3);

      const response = await request(app)
        .delete('/api/bia/processes/bp-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/bia/processes/:id/dependencies', () => {
    it('should add a dependency', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.processDependency.findFirst.mockResolvedValue(null);
      prismaMock.processDependency.create.mockResolvedValue({
        id: 'dep-1', processId: 'bp-123', dependsOn: 'bp-456', type: 'TECHNOLOGY', isCritical: false,
      });

      const response = await request(app)
        .post('/api/bia/processes/bp-123/dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dependsOn: 'bp-456', type: 'TECHNOLOGY' });

      expect(response.status).toBe(201);
    });

    it('should prevent self-dependency', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());

      const response = await request(app)
        .post('/api/bia/processes/bp-123/dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dependsOn: 'bp-123', type: 'TECHNOLOGY' });

      expect(response.status).toBe(400);
    });

    it('should 404 when an INTERNAL_PROCESS dependency targets a process in another org', async () => {
      // The route verifies the parent process (1st findFirst → owned) and then,
      // for INTERNAL_PROCESS dependencies, the dependsOn target (2nd findFirst).
      // A target owned by a different tenant resolves to null → cross-tenant 404.
      prismaMock.businessProcess.findFirst
        .mockResolvedValueOnce(mockProcess()) // parent process, owned by caller
        .mockResolvedValueOnce(null); // dependsOn target NOT in caller's org

      const response = await request(app)
        .post('/api/bia/processes/bp-123/dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dependsOn: 'bp-foreign', type: 'INTERNAL_PROCESS' });

      expect(response.status).toBe(404);
      // The target lookup must AND-scope by both the referenced id and the org,
      // so a foreign process id cannot be linked as a dependency.
      expect(prismaMock.businessProcess.findFirst).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'bp-foreign', organizationId: 'org-123' }),
        }),
      );
      // The dependency row must NOT be created when the target is foreign.
      expect(prismaMock.processDependency.create).not.toHaveBeenCalled();
    });

    it('should create an INTERNAL_PROCESS dependency when the target is in the same org', async () => {
      // Parent and target are both owned by the caller; the dependency persists.
      prismaMock.businessProcess.findFirst
        .mockResolvedValueOnce(mockProcess()) // parent
        .mockResolvedValueOnce(mockProcess({ id: 'bp-456' })); // target, same org
      prismaMock.processDependency.findFirst.mockResolvedValue(null);
      prismaMock.processDependency.create.mockResolvedValue({
        id: 'dep-2', processId: 'bp-123', dependsOn: 'bp-456', type: 'INTERNAL_PROCESS', isCritical: false,
      });

      const response = await request(app)
        .post('/api/bia/processes/bp-123/dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dependsOn: 'bp-456', type: 'INTERNAL_PROCESS' });

      expect(response.status).toBe(201);
      expect(prismaMock.processDependency.create).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());

      const response = await request(app)
        .post('/api/bia/processes/bp-123/dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dependsOn: 'bp-456' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/bia/processes/:id/dependencies/:depId', () => {
    it('should remove a dependency', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.processDependency.findFirst.mockResolvedValue({
        id: 'dep-1', processId: 'bp-123', dependsOn: 'bp-456', type: 'TECHNOLOGY', isCritical: false,
      });
      prismaMock.processDependency.delete.mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/api/bia/processes/bp-123/dependencies/dep-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 if dependency not found', async () => {
      prismaMock.businessProcess.findFirst.mockResolvedValue(mockProcess());
      prismaMock.processDependency.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/bia/processes/bp-123/dependencies/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
