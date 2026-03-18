/**
 * Vendor Monitoring Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) {
      next();
      return;
    }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

import vendorMonitoringRoutes from '../../../routes/vendorMonitoring';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());

app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as Record<string, unknown>;
      (req as any).user = decoded;
    } catch {
      // let route handle it
    }
  }
  next();
});

app.use('/api/vendor-monitoring', vendorMonitoringRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') => {
  return jwt.sign(
    { id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Vendor Monitoring API — Contract Tests', () => {
  const authToken = generateTestToken();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // GET /api/vendor-monitoring/alerts
  // ========================================================================
  describe('GET /api/vendor-monitoring/alerts', () => {
    it('should return alerts for authenticated user', async () => {
      prismaMock.vendorMonitoringCheck.findMany.mockResolvedValue([
        { id: 'chk-1', vendorId: 'v-1', checkType: 'ssl_check', status: 'FAIL', organizationId: 'org-123', checkedAt: new Date(), details: null },
      ]);
      prismaMock.vendorMonitoringCheck.count.mockResolvedValue(1);
      prismaMock.vendor.findMany.mockResolvedValue([{ id: 'v-1', name: 'Vendor A', riskLevel: 'High' }]);

      const res = await request(app)
        .get('/api/vendor-monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('alerts');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('totalPages');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/vendor-monitoring/alerts');
      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // GET /api/vendor-monitoring/stats
  // ========================================================================
  describe('GET /api/vendor-monitoring/stats', () => {
    it('should return monitoring stats', async () => {
      prismaMock.vendorMonitoringCheck.findMany.mockResolvedValue([]);
      prismaMock.vendor.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/vendor-monitoring/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalChecks');
      expect(res.body.data).toHaveProperty('issuesFound');
      expect(res.body.data).toHaveProperty('uniqueVendorsMonitored');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byCheckType');
      expect(res.body.data).toHaveProperty('vendors');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/vendor-monitoring/stats');
      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // GET /api/vendor-monitoring/
  // ========================================================================
  describe('GET /api/vendor-monitoring/', () => {
    it('should list monitoring checks', async () => {
      prismaMock.vendorMonitoringCheck.findMany.mockResolvedValue([]);
      prismaMock.vendorMonitoringCheck.count.mockResolvedValue(0);
      prismaMock.vendor.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/vendor-monitoring/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('checks');
      expect(res.body.data).toHaveProperty('total');
    });

    it('should return 400 for invalid status filter', async () => {
      const res = await request(app)
        .get('/api/vendor-monitoring/?status=INVALID')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/vendor-monitoring/');
      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // POST /api/vendor-monitoring/
  // ========================================================================
  describe('POST /api/vendor-monitoring/', () => {
    it('should create a monitoring check', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({ id: 'v-1', name: 'Vendor A', organizationId: 'org-123' });
      const mockCheck = { id: 'chk-1', vendorId: 'v-1', checkType: 'ssl_check', status: 'PASS', organizationId: 'org-123', checkedAt: new Date(), details: null };
      prismaMock.vendorMonitoringCheck.create.mockResolvedValue(mockCheck);

      const res = await request(app)
        .post('/api/vendor-monitoring/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vendorId: 'v-1', checkType: 'ssl_check' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(prismaMock.vendorMonitoringCheck.create).toHaveBeenCalled();
    });

    it('should return 400 when vendorId or checkType is missing', async () => {
      const res = await request(app)
        .post('/api/vendor-monitoring/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vendorId: 'v-1' });

      expect(res.status).toBe(400);
    });

    it('should return 404 when vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/vendor-monitoring/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vendorId: 'v-bad', checkType: 'ssl_check' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/vendor-monitoring/')
        .send({ vendorId: 'v-1', checkType: 'ssl_check' });
      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // GET /api/vendor-monitoring/vendor/:vendorId
  // ========================================================================
  describe('GET /api/vendor-monitoring/vendor/:vendorId', () => {
    it('should return vendor monitoring history', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({ id: 'v-1', name: 'Vendor A', riskLevel: 'Medium', status: 'Active' });
      prismaMock.vendorMonitoringCheck.findMany.mockResolvedValue([]);
      prismaMock.vendorMonitoringCheck.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/vendor-monitoring/vendor/v-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('vendor');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('checks');
    });

    it('should return 404 when vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/vendor-monitoring/vendor/v-bad')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/vendor-monitoring/vendor/v-1');
      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // POST /api/vendor-monitoring/vendor/:vendorId/check
  // ========================================================================
  describe('POST /api/vendor-monitoring/vendor/:vendorId/check', () => {
    it('should trigger monitoring checks for a vendor', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({
        id: 'v-1', name: 'Vendor A', website: 'https://vendor.com',
        soc2Report: true, iso27001Certified: false, contractEnd: null, organizationId: 'org-123',
      });
      prismaMock.vendorMonitoringCheck.create.mockResolvedValue({
        id: 'chk-1', vendorId: 'v-1', checkType: 'domain_reputation', status: 'PASS',
        organizationId: 'org-123', checkedAt: new Date(), details: {},
      });

      const res = await request(app)
        .post('/api/vendor-monitoring/vendor/v-1/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('vendorId');
      expect(res.body.data).toHaveProperty('checksRun');
      expect(res.body.data).toHaveProperty('results');
      expect(prismaMock.vendorMonitoringCheck.create).toHaveBeenCalled();
    });

    it('should return 404 when vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/vendor-monitoring/vendor/v-bad/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/vendor-monitoring/vendor/v-1/check')
        .send({});
      expect(res.status).toBe(401);
    });
  });
});
