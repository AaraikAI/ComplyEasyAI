/**
 * Data Anonymization Routes — Contract Tests
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
    const userRole = (req as any).user.role;
    if (roles.length > 0 && !roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

// Mock dataAnonymizationService. Implementations are (re)applied in beforeEach
// because the jest config uses resetMocks, which strips the resolved value set
// here before each test runs.
jest.mock('../../../services/dataAnonymizationService', () => ({
  __esModule: true,
  default: {
    anonymizeBatch: jest.fn(),
    anonymizeRecord: jest.fn(),
  },
}));

import dataAnonymizationService from '../../../services/dataAnonymizationService';

import anonymizationRoutes from '../../../routes/anonymization';
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
app.use('/api/anonymization', anonymizationRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const viewerToken = jwt.sign(
  { id: 'user-456', organizationId: 'org-123', role: 'Viewer', email: 'viewer@example.com', name: 'Viewer' },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '1h' }
);

describe('Anonymization API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => {
    jest.clearAllMocks();
    (dataAnonymizationService.anonymizeBatch as jest.Mock).mockResolvedValue([
      { email: 'j***@e***.com', name: 'J*** D***' },
    ]);
    (dataAnonymizationService.anonymizeRecord as jest.Mock).mockResolvedValue({
      email: 'j***@e***.com', name: 'J*** D***',
    });
  });

  // POST /preview
  describe('POST /api/anonymization/preview', () => {
    it('should preview anonymization (dry run)', async () => {
      const res = await request(app)
        .post('/api/anonymization/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          records: [{ email: 'john@example.com', name: 'John Doe' }],
          fieldConfig: { email: { method: 'masking' }, name: { method: 'masking' } },
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('original');
      expect(res.body).toHaveProperty('anonymized');
      expect(res.body).toHaveProperty('count', 1);
    });

    it('should return 400 when records/fieldConfig missing', async () => {
      const res = await request(app)
        .post('/api/anonymization/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ records: [{ email: 'test@test.com' }] });
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-Admin/Owner', async () => {
      const res = await request(app)
        .post('/api/anonymization/preview')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ records: [], fieldConfig: {} });
      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/anonymization/preview').send({});
      expect(res.status).toBe(401);
    });
  });

  // POST /dsar-export
  describe('POST /api/anonymization/dsar-export', () => {
    it('should anonymize DSAR export data', async () => {
      const res = await request(app)
        .post('/api/anonymization/dsar-export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dsarId: 'dsar-1' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('dsarId', 'dsar-1');
      expect(res.body).toHaveProperty('fieldConfig');
    });

    it('should return 400 when dsarId missing', async () => {
      const res = await request(app)
        .post('/api/anonymization/dsar-export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-Admin/Owner', async () => {
      const res = await request(app)
        .post('/api/anonymization/dsar-export')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ dsarId: 'dsar-1' });
      expect(res.status).toBe(403);
    });
  });

  // GET /methods
  describe('GET /api/anonymization/methods', () => {
    it('should return supported anonymization methods', async () => {
      const res = await request(app)
        .get('/api/anonymization/methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('methods');
      expect(Array.isArray(res.body.methods)).toBe(true);
      expect(res.body.methods.length).toBeGreaterThan(0);
      expect(res.body.methods[0]).toHaveProperty('id');
      expect(res.body.methods[0]).toHaveProperty('name');
      expect(res.body.methods[0]).toHaveProperty('description');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/anonymization/methods');
      expect(res.status).toBe(401);
    });
  });
});
