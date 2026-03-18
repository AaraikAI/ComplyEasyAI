/**
 * Certifications Route Contract Tests
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

import certificationsRoutes from '../../../routes/certifications';
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
app.use('/api/certifications', certificationsRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockCert = (overrides: Record<string, any> = {}) => ({
  id: 'cert-123', organizationId: 'org-123', frameworkId: null,
  name: 'ISO 27001', certBody: 'BSI', certNumber: 'CERT-001',
  issueDate: new Date(), expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  status: 'CERT_ACTIVE', scope: 'ISMS', documents: [],
  createdAt: new Date(), updatedAt: new Date(),
  surveillanceAudits: [],
  ...overrides,
});

describe('Certifications API', () => {
  const authToken = generateTestToken();

  describe('GET /api/certifications/expiring', () => {
    it('should return expiring certifications', async () => {
      prismaMock.certification.findMany.mockResolvedValue([mockCert()]);

      const response = await request(app)
        .get('/api/certifications/expiring')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('certifications');
      expect(response.body.data).toHaveProperty('windowDays');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/certifications/expiring');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/certifications', () => {
    it('should return paginated certifications', async () => {
      prismaMock.certification.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.certification.findMany.mockResolvedValue([mockCert()]);
      prismaMock.certification.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/certifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('certifications');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/certifications/:id', () => {
    it('should return a specific certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());

      const response = await request(app)
        .get('/api/certifications/cert-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('cert-123');
    });

    it('should return 404 for non-existent certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/certifications/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/certifications', () => {
    it('should create a certification', async () => {
      prismaMock.certification.create.mockResolvedValue(mockCert());

      const response = await request(app)
        .post('/api/certifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'ISO 27001', certBody: 'BSI', issueDate: '2026-01-01', expiryDate: '2029-01-01' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/certifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'ISO 27001' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/certifications/:id', () => {
    it('should update a certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());
      prismaMock.certification.update.mockResolvedValue(mockCert({ name: 'Updated' }));

      const response = await request(app)
        .patch('/api/certifications/cert-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/certifications/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/certifications/:id', () => {
    it('should delete a certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());
      prismaMock.certification.delete.mockResolvedValue(mockCert());

      const response = await request(app)
        .delete('/api/certifications/cert-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/certifications/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/certifications/:id/audits', () => {
    it('should schedule a surveillance audit', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());
      prismaMock.certAudit.create.mockResolvedValue({
        id: 'audit-1', certificationId: 'cert-123', type: 'SURVEILLANCE_1',
        scheduledDate: new Date(), auditorName: 'John',
      });

      const response = await request(app)
        .post('/api/certifications/cert-123/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'SURVEILLANCE_1', scheduledDate: '2027-06-01' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());

      const response = await request(app)
        .post('/api/certifications/cert-123/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'SURVEILLANCE_1' });

      expect(response.status).toBe(400);
    });

    it('should validate type enum', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());

      const response = await request(app)
        .post('/api/certifications/cert-123/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'INVALID', scheduledDate: '2027-06-01' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/certifications/:id/audits/:auditId', () => {
    it('should update audit results', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());
      prismaMock.certAudit.findFirst.mockResolvedValue({
        id: 'audit-1', certificationId: 'cert-123', type: 'SURVEILLANCE_1',
      });
      prismaMock.certAudit.update.mockResolvedValue({
        id: 'audit-1', result: 'PASS',
      });

      const response = await request(app)
        .patch('/api/certifications/cert-123/audits/audit-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ result: 'PASS' });

      expect(response.status).toBe(200);
    });

    it('should return 404 if audit not found', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(mockCert());
      prismaMock.certAudit.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/certifications/cert-123/audits/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ result: 'PASS' });

      expect(response.status).toBe(404);
    });
  });
});
