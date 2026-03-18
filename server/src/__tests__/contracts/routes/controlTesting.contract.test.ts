/**
 * Control Testing Route Contract Tests
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

import controlTestingRoutes from '../../../routes/controlTesting';
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
app.use('/api/control-testing', controlTestingRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockTest = (overrides: Record<string, any> = {}) => ({
  id: 'ct-123', organizationId: 'org-123', controlId: 'ctrl-123',
  testType: 'ACCESS_REVIEW_TEST', testConfig: null, schedule: null,
  isActive: true, lastRunAt: null,
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

const mockResult = (overrides: Record<string, any> = {}) => ({
  id: 'ctr-123', testId: 'ct-123', status: 'PASS',
  details: { message: 'Test passed' }, evidence: null,
  testedAt: new Date(), createdAt: new Date(),
  ...overrides,
});

describe('Control Testing API', () => {
  const authToken = generateTestToken();

  describe('GET /api/control-testing/coverage', () => {
    it('should return test coverage data', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        {
          id: 'fw-1', name: 'SOC 2',
          controls: [{ id: 'ctrl-1' }, { id: 'ctrl-2' }],
        } as any,
      ]);
      prismaMock.controlTest.findMany.mockResolvedValue([
        { controlId: 'ctrl-1' } as any,
      ]);

      const response = await request(app)
        .get('/api/control-testing/coverage')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalControls');
      expect(response.body.data).toHaveProperty('testedControls');
      expect(response.body.data).toHaveProperty('untestedControls');
      expect(response.body.data).toHaveProperty('overallCoveragePercent');
      expect(response.body.data).toHaveProperty('totalTests');
      expect(response.body.data).toHaveProperty('frameworks');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/control-testing/coverage');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/control-testing/stats', () => {
    it('should return test statistics', async () => {
      prismaMock.controlTest.findMany.mockResolvedValue([
        mockTest({
          results: [
            { status: 'PASS', testedAt: new Date() },
            { status: 'FAIL', testedAt: new Date() },
          ],
        }),
      ]);

      const response = await request(app)
        .get('/api/control-testing/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalTests');
      expect(response.body.data).toHaveProperty('activeTests');
      expect(response.body.data).toHaveProperty('inactiveTests');
      expect(response.body.data).toHaveProperty('totalResults');
      expect(response.body.data).toHaveProperty('passRate');
      expect(response.body.data).toHaveProperty('failRate');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('byResultStatus');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/control-testing/stats');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/control-testing', () => {
    it('should return paginated control tests', async () => {
      prismaMock.controlTest.findMany.mockResolvedValue([mockTest({ _count: { results: 2 } })]);
      prismaMock.controlTest.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/control-testing')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('tests');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/control-testing');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/control-testing/:id', () => {
    it('should return a specific control test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(
        mockTest({ results: [mockResult()] })
      );

      const response = await request(app)
        .get('/api/control-testing/ct-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('ct-123');
    });

    it('should return 404 for non-existent test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/control-testing/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/control-testing', () => {
    it('should create a control test', async () => {
      prismaMock.controlTest.create.mockResolvedValue(mockTest());

      const response = await request(app)
        .post('/api/control-testing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', testType: 'ACCESS_REVIEW_TEST' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/control-testing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123' });

      expect(response.status).toBe(400);
    });

    it('should validate testType enum', async () => {
      const response = await request(app)
        .post('/api/control-testing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ controlId: 'ctrl-123', testType: 'INVALID' });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/control-testing')
        .send({ controlId: 'ctrl-123', testType: 'ACCESS_REVIEW_TEST' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/control-testing/:id', () => {
    it('should update a control test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest());
      prismaMock.controlTest.update.mockResolvedValue(mockTest({ isActive: false }));

      const response = await request(app)
        .patch('/api/control-testing/ct-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/control-testing/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
    });

    it('should validate testType enum on update', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest());

      const response = await request(app)
        .patch('/api/control-testing/ct-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ testType: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/control-testing/:id', () => {
    it('should delete a control test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest());
      prismaMock.controlTest.delete.mockResolvedValue(mockTest());

      const response = await request(app)
        .delete('/api/control-testing/ct-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/control-testing/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/control-testing/:id/run', () => {
    it('should trigger a test run', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest({ isActive: true }));
      prismaMock.controlTestResult.create.mockResolvedValue(mockResult());
      prismaMock.controlTest.update.mockResolvedValue(mockTest({ lastRunAt: new Date() }));

      const response = await request(app)
        .post('/api/control-testing/ct-123/run')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
    });

    it('should return 400 for inactive test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest({ isActive: false }));

      const response = await request(app)
        .post('/api/control-testing/ct-123/run')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/control-testing/non-existent/run')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/control-testing/:id/results', () => {
    it('should return paginated test results', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest());
      prismaMock.controlTestResult.findMany.mockResolvedValue([mockResult()]);
      prismaMock.controlTestResult.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/control-testing/ct-123/results')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('testId');
      expect(response.body.data).toHaveProperty('testType');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should return 404 for non-existent test', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/control-testing/non-existent/results')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should validate status filter enum', async () => {
      prismaMock.controlTest.findFirst.mockResolvedValue(mockTest());

      const response = await request(app)
        .get('/api/control-testing/ct-123/results?status=INVALID')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });
});
