/**
 * E2E Tests - Export & Import Flow
 * Tests complete data export/import workflows including CSV,
 * PDF reports, bulk operations, and data migration.
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

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

import exportRoutes from '../../routes/export';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/export', exportRoutes);
app.use(errorHandler);

describe('E2E: Export & Import Flow', () => {
  const mockExportJob = {
    id: 'job-123',
    type: 'risks',
    format: 'csv',
    status: 'Completed',
    fileUrl: 'https://storage.example.com/exports/risks.csv',
    createdAt: new Date(),
    completedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CSV Export Workflow', () => {
    it('should export risks to CSV', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'r1', title: 'Risk 1', severity: 'High', status: 'Open' },
        { id: 'r2', title: 'Risk 2', severity: 'Medium', status: 'Mitigated' },
      ] as any);
      prismaMock.exportJob.create.mockResolvedValue(mockExportJob as any);

      const response = await request(app)
        .post('/api/export/risks')
        .send({ format: 'csv' })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should export vendors to CSV', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([
        { id: 'v1', name: 'Vendor 1', riskLevel: 'High', status: 'Active' },
      ] as any);

      const response = await request(app)
        .post('/api/export/vendors')
        .send({ format: 'csv' })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should export policies to CSV', async () => {
      prismaMock.policy.findMany.mockResolvedValue([
        { id: 'p1', title: 'Policy 1', status: 'Active', version: '1.0' },
      ] as any);

      const response = await request(app)
        .post('/api/export/policies')
        .send({ format: 'csv' })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should export with custom columns', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'r1', title: 'Risk 1', severity: 'High' },
      ] as any);

      const response = await request(app)
        .post('/api/export/risks')
        .send({
          format: 'csv',
          columns: ['id', 'title', 'severity'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should export with date range filter', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/export/risks')
        .send({
          format: 'csv',
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  describe('PDF Report Generation', () => {
    it('should generate compliance report PDF', async () => {
      prismaMock.framework.findFirst.mockResolvedValue({
        id: 'fw-123',
        name: 'SOC 2',
        progress: 78,
        requirements: [],
        controls: [],
      } as any);

      const response = await request(app)
        .post('/api/export/compliance-report')
        .send({
          frameworkId: 'fw-123',
          format: 'pdf',
          includeEvidence: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should generate risk assessment report', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'r1', title: 'Risk 1', severity: 'High' },
      ] as any);

      const response = await request(app)
        .post('/api/export/risk-report')
        .send({
          format: 'pdf',
          includeCharts: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should generate audit report', async () => {
      prismaMock.audit.findFirst.mockResolvedValue({
        id: 'audit-123',
        findings: [],
        evidence: [],
      } as any);

      const response = await request(app)
        .post('/api/export/audit-report')
        .send({
          auditId: 'audit-123',
          format: 'pdf',
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  describe('Bulk Export', () => {
    it('should export all organization data', async () => {
      prismaMock.exportJob.create.mockResolvedValue({
        ...mockExportJob,
        type: 'full-backup',
      } as any);

      const response = await request(app)
        .post('/api/export/full-backup')
        .send({
          format: 'json',
          includeAttachments: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('jobId');
    });

    it('should check export job status', async () => {
      prismaMock.exportJob.findFirst.mockResolvedValue(mockExportJob as any);

      const response = await request(app)
        .get('/api/export/jobs/job-123')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should list export history', async () => {
      prismaMock.exportJob.findMany.mockResolvedValue([mockExportJob] as any);

      const response = await request(app)
        .get('/api/export/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Framework Export', () => {
    it('should export framework as template', async () => {
      prismaMock.framework.findFirst.mockResolvedValue({
        id: 'fw-123',
        name: 'Custom Framework',
        requirements: [],
        controls: [],
      } as any);

      const response = await request(app)
        .post('/api/export/frameworks/fw-123/template')
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body).toHaveProperty('template');
    });
  });

  describe('Audit Log Export', () => {
    it('should export audit logs', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'create', entity: 'Risk', timestamp: new Date() },
      ] as any);

      const response = await request(app)
        .post('/api/export/audit-logs')
        .send({
          format: 'csv',
          dateRange: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  describe('Data Import Workflow', () => {
    it('should validate import file', async () => {
      const response = await request(app)
        .post('/api/export/import/validate')
        .send({
          type: 'risks',
          fileUrl: 'https://storage.example.com/imports/risks.csv',
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('rowCount');
      expect(response.body).toHaveProperty('errors');
    });

    it('should import risks from CSV', async () => {
      prismaMock.riskItem.createMany.mockResolvedValue({ count: 10 } as any);

      const response = await request(app)
        .post('/api/export/import/risks')
        .send({
          fileUrl: 'https://storage.example.com/imports/risks.csv',
          mapping: {
            title: 'Risk Name',
            severity: 'Severity Level',
            description: 'Description',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('importedCount');
    });

    it('should handle import errors gracefully', async () => {
      prismaMock.riskItem.createMany.mockRejectedValue(new Error('Validation failed'));

      const response = await request(app)
        .post('/api/export/import/risks')
        .send({
          fileUrl: 'https://storage.example.com/imports/bad-data.csv',
        })
        .expect(200);

      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('failedRows');
    });

    it('should import vendors', async () => {
      prismaMock.vendor.createMany.mockResolvedValue({ count: 5 } as any);

      const response = await request(app)
        .post('/api/export/import/vendors')
        .send({
          fileUrl: 'https://storage.example.com/imports/vendors.csv',
        })
        .expect(200);

      expect(response.body).toHaveProperty('importedCount');
    });
  });

  describe('Scheduled Exports', () => {
    it('should schedule recurring export', async () => {
      prismaMock.scheduledExport.create.mockResolvedValue({
        id: 'sched-123',
        type: 'risks',
        format: 'csv',
        schedule: '0 0 * * 0', // Weekly
        recipients: ['admin@example.com'],
      } as any);

      const response = await request(app)
        .post('/api/export/schedule')
        .send({
          type: 'risks',
          format: 'csv',
          schedule: '0 0 * * 0',
          recipients: ['admin@example.com'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should list scheduled exports', async () => {
      prismaMock.scheduledExport.findMany.mockResolvedValue([
        { id: 'sched-123', type: 'risks', schedule: '0 0 * * 0' },
      ] as any);

      const response = await request(app)
        .get('/api/export/schedules')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should cancel scheduled export', async () => {
      prismaMock.scheduledExport.delete.mockResolvedValue({ id: 'sched-123' } as any);

      const response = await request(app)
        .delete('/api/export/schedules/sched-123')
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });
  });
});
