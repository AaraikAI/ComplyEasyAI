/**
 * E2E Tests - Audit Log & Evidence Versioning Flow
 * Tests the audit-trail (audit log) API and the per-control evidence
 * versioning API.
 *
 * Exercises the real routes in src/routes/audit.ts and
 * src/routes/evidenceVersions.ts. Both controllers operate directly on prisma
 * (auditLog, frameworkControl, evidenceVersion) which are present on the shared
 * prismaMock, so the mock is configured with correct shapes per test.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

import auditRoutes from '../../routes/audit';
import evidenceVersionsRoutes from '../../routes/evidenceVersions';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/audit', auditRoutes);
app.use('/api/evidence-versions', evidenceVersionsRoutes);
app.use(errorHandler);

describe('E2E: Audit Log & Evidence Versioning Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Audit Log (audit trail)
  // ===========================================================================
  describe('Audit Log', () => {
    const mockLog = {
      id: 'audit-123',
      action: 'framework.created',
      userId: 'user-123',
      organizationId: 'org-123',
      details: null,
      hash: 'h-1',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      user: { id: 'user-123', name: 'Admin', email: 'admin@example.com' },
    };

    it('should create an audit log entry', async () => {
      prismaMock.auditLog.create.mockResolvedValue(mockLog as any);

      const response = await request(app)
        .post('/api/audit')
        .send({ action: 'framework.created', details: { frameworkId: 'fw-1' } })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'audit-123');
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: 'org-123', userId: 'user-123' }),
        })
      );
    });

    it('should reject an audit log entry without an action with 400', async () => {
      const response = await request(app)
        .post('/api/audit')
        .send({ details: 'no action provided' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should list audit logs (org-scoped) with total', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([mockLog] as any);
      prismaMock.auditLog.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/audit')
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total', 1);
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-123' }) })
      );
    });

    it('should export audit logs as JSON', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([mockLog] as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .get('/api/audit/export')
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('exportedAt');
    });

    it('should archive audit logs before a cutoff date', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([{ id: 'audit-123' }] as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/audit/archive')
        .send({ beforeDate: '2023-01-01T00:00:00.000Z' })
        .expect(200);

      expect(response.body).toHaveProperty('archived', 1);
      expect(response.body.message).toContain('archived');
    });
  });

  // ===========================================================================
  // Evidence Versioning (per control)
  // ===========================================================================
  describe('Evidence Versioning', () => {
    const mockControl = {
      id: 'ctrl-123',
      name: 'CC6.1 - Logical Access',
      framework: { id: 'fw-123', organizationId: 'org-123' },
    };

    const mockVersion = {
      id: 'ev-v-123',
      controlId: 'ctrl-123',
      versionNumber: 2,
      fileUrl: 'https://storage.example.com/evidence/policy-v2.pdf',
      fileName: 'policy-v2.pdf',
      isCurrent: true,
      uploadedBy: 'user-123',
      uploader: { id: 'user-123', name: 'Admin', email: 'admin@example.com' },
    };

    it('should list version history for a control', async () => {
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl as any);
      prismaMock.evidenceVersion.findMany.mockResolvedValue([
        mockVersion,
        { ...mockVersion, id: 'ev-v-122', versionNumber: 1, isCurrent: false },
      ] as any);

      const response = await request(app)
        .get('/api/evidence-versions/control/ctrl-123')
        .expect(200);

      expect(response.body).toHaveProperty('versions');
      expect(response.body.versions).toHaveLength(2);
    });

    it('should 404 when the control is in another organization', async () => {
      prismaMock.frameworkControl.findFirst.mockResolvedValue({
        ...mockControl,
        framework: { id: 'fw-999', organizationId: 'org-OTHER' },
      } as any);

      const response = await request(app)
        .get('/api/evidence-versions/control/ctrl-123')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should create a new evidence version', async () => {
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl as any);
      prismaMock.evidenceVersion.findFirst.mockResolvedValue({ versionNumber: 1 } as any);
      prismaMock.evidenceVersion.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.evidenceVersion.create.mockResolvedValue(mockVersion as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/evidence-versions/control/ctrl-123')
        .send({
          fileName: 'policy-v2.pdf',
          fileUrl: 'https://storage.example.com/evidence/policy-v2.pdf',
        })
        .expect(201);

      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toHaveProperty('versionNumber', 2);
      // New version is one above the current max.
      expect(prismaMock.evidenceVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ versionNumber: 2, isCurrent: true }) })
      );
    });

    it('should restore a previous version', async () => {
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl as any);
      prismaMock.evidenceVersion.findFirst.mockResolvedValue({
        ...mockVersion,
        id: 'ev-v-122',
        versionNumber: 1,
        isCurrent: false,
      } as any);
      prismaMock.evidenceVersion.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.evidenceVersion.update.mockResolvedValue({ id: 'ev-v-122', isCurrent: true } as any);
      prismaMock.frameworkControl.update.mockResolvedValue(mockControl as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/evidence-versions/control/ctrl-123/restore/ev-v-122')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Version restored successfully');
    });

    it('should refuse to delete the current version with 400', async () => {
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl as any);
      prismaMock.evidenceVersion.findFirst.mockResolvedValue({ ...mockVersion, isCurrent: true } as any);

      const response = await request(app)
        .delete('/api/evidence-versions/control/ctrl-123/ev-v-123')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('current version');
    });

    it('should delete a non-current version', async () => {
      prismaMock.frameworkControl.findFirst.mockResolvedValue(mockControl as any);
      prismaMock.evidenceVersion.findFirst.mockResolvedValue({
        ...mockVersion,
        id: 'ev-v-122',
        versionNumber: 1,
        isCurrent: false,
      } as any);
      prismaMock.evidenceVersion.delete.mockResolvedValue({ id: 'ev-v-122' } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/api/evidence-versions/control/ctrl-123/ev-v-122')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Version deleted successfully');
    });
  });
});
