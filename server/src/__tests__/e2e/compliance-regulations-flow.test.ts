/**
 * E2E Tests - Compliance Regulations Flow
 * Tests complete compliance workflows for DORA, SOX, SOD, MDM, and Personnel.
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

import doraRoutes from '../../routes/dora';
import soxRoutes from '../../routes/sox';
import sodRoutes from '../../routes/sod';
import mdmRoutes from '../../routes/mdm';
import personnelRoutes from '../../routes/personnel';
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
app.use('/api/dora', doraRoutes);
app.use('/api/sox', soxRoutes);
app.use('/api/sod', sodRoutes);
app.use('/api/mdm', mdmRoutes);
app.use('/api/personnel', personnelRoutes);
app.use(errorHandler);

describe('E2E: Compliance Regulations Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // DORA (Digital Operational Resilience Act) Flow
  // ===========================================================================
  describe('DORA Compliance Flow', () => {
    const mockICTAsset = {
      id: 'ict-123',
      name: 'Core Banking System',
      type: 'Application',
      criticality: 'Critical',
      organizationId: 'org-123',
      riskLevel: 'High',
    };

    const mockICTIncident = {
      id: 'incident-123',
      title: 'Database Outage',
      severity: 'Major',
      status: 'Open',
      ictAssetId: 'ict-123',
      organizationId: 'org-123',
      reportedAt: new Date(),
    };

    const mockICTProvider = {
      id: 'provider-123',
      name: 'Cloud Provider',
      type: 'Critical',
      services: ['Infrastructure', 'Storage'],
      organizationId: 'org-123',
    };

    it('should complete ICT asset registration', async () => {
      prismaMock.ictAsset.create.mockResolvedValue(mockICTAsset as any);

      const response = await request(app)
        .post('/api/dora/ict-assets')
        .send({
          name: 'Core Banking System',
          type: 'Application',
          criticality: 'Critical',
          owner: 'user-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should report and track ICT incident', async () => {
      // Report incident
      prismaMock.ictIncident.create.mockResolvedValue(mockICTIncident as any);

      const reportResponse = await request(app)
        .post('/api/dora/incidents')
        .send({
          title: 'Database Outage',
          severity: 'Major',
          ictAssetId: 'ict-123',
          description: 'Primary database became unavailable',
        })
        .expect(201);

      expect(reportResponse.body).toHaveProperty('id');

      // Update incident
      prismaMock.ictIncident.findFirst.mockResolvedValue(mockICTIncident as any);
      prismaMock.ictIncident.update.mockResolvedValue({
        ...mockICTIncident,
        status: 'Resolved',
        resolvedAt: new Date(),
      } as any);

      const updateResponse = await request(app)
        .patch(`/api/dora/incidents/${reportResponse.body.id}`)
        .send({ status: 'Resolved', resolution: 'Failover completed' })
        .expect(200);

      expect(updateResponse.body.status).toBe('Resolved');
    });

    it('should manage ICT third-party providers', async () => {
      prismaMock.ictProvider.create.mockResolvedValue(mockICTProvider as any);

      const response = await request(app)
        .post('/api/dora/providers')
        .send({
          name: 'Cloud Provider',
          type: 'Critical',
          services: ['Infrastructure', 'Storage'],
          contractStart: new Date(),
          contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should perform operational resilience testing', async () => {
      prismaMock.resilienceTest.create.mockResolvedValue({
        id: 'test-123',
        type: 'TLPT',
        status: 'Completed',
        results: { passed: true, findings: [] },
      } as any);

      const response = await request(app)
        .post('/api/dora/resilience-tests')
        .send({
          type: 'TLPT',
          scope: ['ict-123'],
          scheduledDate: new Date(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should get DORA compliance dashboard', async () => {
      prismaMock.ictAsset.findMany.mockResolvedValue([mockICTAsset] as any);
      prismaMock.ictIncident.findMany.mockResolvedValue([mockICTIncident] as any);

      const response = await request(app)
        .get('/api/dora/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('ictAssets');
      expect(response.body).toHaveProperty('openIncidents');
    });
  });

  // ===========================================================================
  // SOX (Sarbanes-Oxley) Flow
  // ===========================================================================
  describe('SOX Compliance Flow', () => {
    const mockSOXControl = {
      id: 'sox-ctrl-123',
      name: 'Financial Reporting Controls',
      type: 'Key',
      status: 'Effective',
      organizationId: 'org-123',
    };

    const mockSOXTest = {
      id: 'sox-test-123',
      controlId: 'sox-ctrl-123',
      type: 'Design',
      result: 'Effective',
      testedAt: new Date(),
      testedBy: 'user-123',
    };

    it('should manage SOX controls', async () => {
      prismaMock.soxControl.create.mockResolvedValue(mockSOXControl as any);

      const response = await request(app)
        .post('/api/sox/controls')
        .send({
          name: 'Financial Reporting Controls',
          type: 'Key',
          frequency: 'Quarterly',
          owner: 'user-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should perform control testing', async () => {
      prismaMock.soxControl.findFirst.mockResolvedValue(mockSOXControl as any);
      prismaMock.soxTest.create.mockResolvedValue(mockSOXTest as any);

      const response = await request(app)
        .post('/api/sox/controls/sox-ctrl-123/test')
        .send({
          type: 'Design',
          sampleSize: 25,
          evidence: ['ev-1', 'ev-2'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('result');
    });

    it('should track material weakness', async () => {
      prismaMock.materialWeakness.create.mockResolvedValue({
        id: 'mw-123',
        title: 'Revenue Recognition Issue',
        status: 'Open',
        severity: 'Material',
        remediationPlan: 'Implement new controls',
      } as any);

      const response = await request(app)
        .post('/api/sox/material-weaknesses')
        .send({
          title: 'Revenue Recognition Issue',
          description: 'Controls over revenue recognition are inadequate',
          affectedControls: ['sox-ctrl-123'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should generate SOX compliance report', async () => {
      prismaMock.soxControl.findMany.mockResolvedValue([mockSOXControl] as any);
      prismaMock.soxTest.findMany.mockResolvedValue([mockSOXTest] as any);

      const response = await request(app)
        .get('/api/sox/report')
        .query({ period: 'Q1-2024' })
        .expect(200);

      expect(response.body).toHaveProperty('controls');
      expect(response.body).toHaveProperty('testResults');
    });
  });

  // ===========================================================================
  // SOD (Segregation of Duties) Flow
  // ===========================================================================
  describe('SOD Compliance Flow', () => {
    const mockSODRule = {
      id: 'sod-rule-123',
      name: 'Payment Processing Segregation',
      conflictingRoles: ['Payment Approver', 'Payment Initiator'],
      severity: 'High',
      organizationId: 'org-123',
    };

    const mockSODViolation = {
      id: 'sod-viol-123',
      ruleId: 'sod-rule-123',
      userId: 'user-456',
      conflictingRoles: ['Payment Approver', 'Payment Initiator'],
      status: 'Open',
      detectedAt: new Date(),
    };

    it('should create SOD rule', async () => {
      prismaMock.sodRule.create.mockResolvedValue(mockSODRule as any);

      const response = await request(app)
        .post('/api/sod/rules')
        .send({
          name: 'Payment Processing Segregation',
          conflictingRoles: ['Payment Approver', 'Payment Initiator'],
          severity: 'High',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should analyze SOD conflicts', async () => {
      prismaMock.sodRule.findMany.mockResolvedValue([mockSODRule] as any);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'user-456', roles: ['Payment Approver', 'Payment Initiator'] },
      ] as any);

      const response = await request(app)
        .post('/api/sod/analyze')
        .expect(200);

      expect(response.body).toHaveProperty('violations');
    });

    it('should manage SOD violations', async () => {
      prismaMock.sodViolation.findMany.mockResolvedValue([mockSODViolation] as any);

      const listResponse = await request(app)
        .get('/api/sod/violations')
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);

      // Resolve violation
      prismaMock.sodViolation.findFirst.mockResolvedValue(mockSODViolation as any);
      prismaMock.sodViolation.update.mockResolvedValue({
        ...mockSODViolation,
        status: 'Resolved',
        resolution: 'Role removed',
      } as any);

      const resolveResponse = await request(app)
        .patch('/api/sod/violations/sod-viol-123')
        .send({
          status: 'Resolved',
          resolution: 'Removed conflicting role',
        })
        .expect(200);

      expect(resolveResponse.body.status).toBe('Resolved');
    });

    it('should get SOD matrix', async () => {
      prismaMock.sodRule.findMany.mockResolvedValue([mockSODRule] as any);

      const response = await request(app)
        .get('/api/sod/matrix')
        .expect(200);

      expect(response.body).toHaveProperty('matrix');
    });
  });

  // ===========================================================================
  // MDM (Master Data Management) Flow
  // ===========================================================================
  describe('MDM Compliance Flow', () => {
    const mockDataEntity = {
      id: 'entity-123',
      name: 'Customer',
      type: 'Master',
      status: 'Active',
      schema: { fields: ['id', 'name', 'email'] },
      organizationId: 'org-123',
    };

    const mockDataQualityRule = {
      id: 'dq-rule-123',
      entityId: 'entity-123',
      name: 'Email Validation',
      type: 'Format',
      rule: 'email LIKE %@%.%',
      severity: 'High',
    };

    it('should register data entity', async () => {
      prismaMock.dataEntity.create.mockResolvedValue(mockDataEntity as any);

      const response = await request(app)
        .post('/api/mdm/entities')
        .send({
          name: 'Customer',
          type: 'Master',
          schema: { fields: ['id', 'name', 'email'] },
          owner: 'user-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should define data quality rules', async () => {
      prismaMock.dataQualityRule.create.mockResolvedValue(mockDataQualityRule as any);

      const response = await request(app)
        .post('/api/mdm/entities/entity-123/quality-rules')
        .send({
          name: 'Email Validation',
          type: 'Format',
          rule: 'email LIKE %@%.%',
          severity: 'High',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should run data quality assessment', async () => {
      prismaMock.dataEntity.findFirst.mockResolvedValue(mockDataEntity as any);
      prismaMock.dataQualityRule.findMany.mockResolvedValue([mockDataQualityRule] as any);

      const response = await request(app)
        .post('/api/mdm/entities/entity-123/assess')
        .expect(200);

      expect(response.body).toHaveProperty('qualityScore');
      expect(response.body).toHaveProperty('issues');
    });

    it('should get data lineage', async () => {
      prismaMock.dataLineage.findMany.mockResolvedValue([
        { sourceEntity: 'entity-123', targetEntity: 'entity-456', transformationType: 'ETL' },
      ] as any);

      const response = await request(app)
        .get('/api/mdm/entities/entity-123/lineage')
        .expect(200);

      expect(response.body).toHaveProperty('upstream');
      expect(response.body).toHaveProperty('downstream');
    });
  });

  // ===========================================================================
  // Personnel Compliance Flow
  // ===========================================================================
  describe('Personnel Compliance Flow', () => {
    const mockEmployee = {
      id: 'emp-123',
      userId: 'user-456',
      name: 'John Doe',
      department: 'Engineering',
      status: 'Active',
      organizationId: 'org-123',
    };

    const mockTraining = {
      id: 'train-123',
      name: 'Security Awareness',
      type: 'Mandatory',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const mockBackgroundCheck = {
      id: 'bg-123',
      employeeId: 'emp-123',
      type: 'Criminal',
      status: 'Completed',
      result: 'Clear',
      completedAt: new Date(),
    };

    it('should manage employee records', async () => {
      prismaMock.employee.create.mockResolvedValue(mockEmployee as any);

      const response = await request(app)
        .post('/api/personnel/employees')
        .send({
          userId: 'user-456',
          name: 'John Doe',
          department: 'Engineering',
          startDate: new Date(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should track training compliance', async () => {
      prismaMock.training.findMany.mockResolvedValue([mockTraining] as any);
      prismaMock.trainingCompletion.findMany.mockResolvedValue([
        { trainingId: 'train-123', employeeId: 'emp-123', completedAt: new Date() },
      ] as any);

      const response = await request(app)
        .get('/api/personnel/employees/emp-123/training')
        .expect(200);

      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('pending');
    });

    it('should manage background checks', async () => {
      prismaMock.backgroundCheck.create.mockResolvedValue(mockBackgroundCheck as any);

      const response = await request(app)
        .post('/api/personnel/employees/emp-123/background-checks')
        .send({
          type: 'Criminal',
          provider: 'CheckProvider',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should track access certifications', async () => {
      prismaMock.accessCertification.create.mockResolvedValue({
        id: 'cert-123',
        employeeId: 'emp-123',
        certifiedBy: 'user-123',
        certifiedAt: new Date(),
        status: 'Certified',
      } as any);

      const response = await request(app)
        .post('/api/personnel/employees/emp-123/certify-access')
        .send({
          accessRights: ['system-a', 'system-b'],
          certifiedBy: 'user-123',
        })
        .expect(201);

      expect(response.body.status).toBe('Certified');
    });

    it('should handle employee offboarding', async () => {
      prismaMock.employee.findFirst.mockResolvedValue(mockEmployee as any);
      prismaMock.employee.update.mockResolvedValue({
        ...mockEmployee,
        status: 'Offboarded',
        offboardedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/personnel/employees/emp-123/offboard')
        .send({
          lastDay: new Date(),
          reason: 'Resignation',
        })
        .expect(200);

      expect(response.body.status).toBe('Offboarded');
    });
  });
});
